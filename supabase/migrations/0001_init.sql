-- Schema for optional account sync. Local-first: clients keep IndexedDB as the
-- source of truth and converge via last-write-wins on the client `updated_at`.
--
-- Design notes:
-- * Every table is scoped by user_id with owner-only RLS; no anon access.
-- * `updated_at` is the CLIENT clock (LWW comparator). `server_updated_at` is
--   set by trigger on every write and is the pull cursor — clock skew on a
--   device can mis-order a conflict but can never make the cursor drop rows.
-- * Deletes are tombstones (`deleted`), never row deletes.
-- * No cross-table foreign keys: rows sync independently and tombstones keep
--   referential meaning; ordering inserts inside one push must not matter.
-- * Conditional upsert (LWW) is inexpressible in PostgREST, hence the
--   push_changes() function. Pulls are plain PostgREST selects.

-- ── shared trigger ──────────────────────────────────────────────────────────
create function public.touch_server_updated_at()
returns trigger
language plpgsql
as $$
begin
	new.server_updated_at := now();
	return new;
end;
$$;

-- ── tables ──────────────────────────────────────────────────────────────────
create table public.vehicles (
	id uuid primary key,
	user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
	name text not null,
	make text,
	model text,
	year int,
	plate text,
	odometer_unit text not null check (odometer_unit in ('km', 'mi')),
	created_at timestamptz not null,
	updated_at timestamptz not null,
	server_updated_at timestamptz not null default now(),
	deleted boolean not null default false
);

create table public.maintenance_items (
	id uuid primary key,
	user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
	vehicle_id uuid not null,
	name text not null,
	interval_km int,
	interval_months int,
	anchor_date date,
	anchor_odometer int,
	template_id text,
	notes text,
	created_at timestamptz not null,
	updated_at timestamptz not null,
	server_updated_at timestamptz not null default now(),
	deleted boolean not null default false
);

create table public.service_records (
	id uuid primary key,
	user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
	vehicle_id uuid not null,
	item_id uuid,
	title text,
	date date not null,
	odometer int not null,
	cost numeric,
	currency text,
	notes text,
	attachments jsonb not null default '[]',
	created_at timestamptz not null,
	updated_at timestamptz not null,
	server_updated_at timestamptz not null default now(),
	deleted boolean not null default false
);

create table public.mileage_entries (
	id uuid primary key,
	user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
	vehicle_id uuid not null,
	odometer int not null,
	recorded_at timestamptz not null,
	created_at timestamptz not null,
	updated_at timestamptz not null,
	server_updated_at timestamptz not null default now(),
	deleted boolean not null default false
);

create table public.push_subscriptions (
	id uuid primary key default gen_random_uuid(),
	user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
	endpoint text not null unique,
	p256dh text not null,
	auth text not null,
	device_label text,
	enabled boolean not null default true,
	mileage_reminder_days int not null default 14,
	last_push_at timestamptz,
	last_push_state_hash text,
	created_at timestamptz not null default now()
);

create index vehicles_user_cursor on public.vehicles (user_id, server_updated_at);
create index maintenance_items_user_cursor on public.maintenance_items (user_id, server_updated_at);
create index service_records_user_cursor on public.service_records (user_id, server_updated_at);
create index mileage_entries_user_cursor on public.mileage_entries (user_id, server_updated_at);
create index push_subscriptions_user on public.push_subscriptions (user_id);

create trigger vehicles_touch before insert or update on public.vehicles
	for each row execute function public.touch_server_updated_at();
create trigger maintenance_items_touch before insert or update on public.maintenance_items
	for each row execute function public.touch_server_updated_at();
create trigger service_records_touch before insert or update on public.service_records
	for each row execute function public.touch_server_updated_at();
create trigger mileage_entries_touch before insert or update on public.mileage_entries
	for each row execute function public.touch_server_updated_at();

-- ── RLS: owner-only, no deletes (tombstones), no anon access ────────────────
alter table public.vehicles enable row level security;
alter table public.maintenance_items enable row level security;
alter table public.service_records enable row level security;
alter table public.mileage_entries enable row level security;
alter table public.push_subscriptions enable row level security;

create policy vehicles_owner_select on public.vehicles
	for select to authenticated using (user_id = (select auth.uid()));
create policy vehicles_owner_insert on public.vehicles
	for insert to authenticated with check (user_id = (select auth.uid()));
create policy vehicles_owner_update on public.vehicles
	for update to authenticated using (user_id = (select auth.uid()));

create policy maintenance_items_owner_select on public.maintenance_items
	for select to authenticated using (user_id = (select auth.uid()));
create policy maintenance_items_owner_insert on public.maintenance_items
	for insert to authenticated with check (user_id = (select auth.uid()));
create policy maintenance_items_owner_update on public.maintenance_items
	for update to authenticated using (user_id = (select auth.uid()));

create policy service_records_owner_select on public.service_records
	for select to authenticated using (user_id = (select auth.uid()));
create policy service_records_owner_insert on public.service_records
	for insert to authenticated with check (user_id = (select auth.uid()));
create policy service_records_owner_update on public.service_records
	for update to authenticated using (user_id = (select auth.uid()));

create policy mileage_entries_owner_select on public.mileage_entries
	for select to authenticated using (user_id = (select auth.uid()));
create policy mileage_entries_owner_insert on public.mileage_entries
	for insert to authenticated with check (user_id = (select auth.uid()));
create policy mileage_entries_owner_update on public.mileage_entries
	for update to authenticated using (user_id = (select auth.uid()));

-- Subscriptions may be hard-deleted (device unsubscribes).
create policy push_subscriptions_owner_all on public.push_subscriptions
	for all to authenticated
	using (user_id = (select auth.uid()))
	with check (user_id = (select auth.uid()));

-- ── LWW push ────────────────────────────────────────────────────────────────
-- `changes` carries camelCase rows exactly as the client stores them, e.g.
-- {"vehicles":[{"id":"…","name":"…","updatedAt":"…","deleted":0,…}], …}.
-- SECURITY INVOKER: RLS enforces ownership; user_id is always set server-side.
-- A row only overwrites when strictly newer (client updated_at) — pushing the
-- echo of an already-synced row is a no-op.
create function public.push_changes(changes jsonb)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
	r jsonb;
begin
	if auth.uid() is null then
		raise exception 'not authenticated';
	end if;

	for r in select * from jsonb_array_elements(coalesce(changes->'vehicles', '[]'::jsonb)) loop
		insert into vehicles (id, user_id, name, make, model, year, plate, odometer_unit, created_at, updated_at, deleted)
		values (
			(r->>'id')::uuid, auth.uid(),
			r->>'name', r->>'make', r->>'model', (r->>'year')::int, r->>'plate', r->>'odometerUnit',
			(r->>'createdAt')::timestamptz, (r->>'updatedAt')::timestamptz, (r->>'deleted')::int = 1
		)
		on conflict (id) do update set
			name = excluded.name, make = excluded.make, model = excluded.model,
			year = excluded.year, plate = excluded.plate, odometer_unit = excluded.odometer_unit,
			updated_at = excluded.updated_at, deleted = excluded.deleted
		where excluded.updated_at > vehicles.updated_at;
	end loop;

	for r in select * from jsonb_array_elements(coalesce(changes->'maintenanceItems', '[]'::jsonb)) loop
		insert into maintenance_items (id, user_id, vehicle_id, name, interval_km, interval_months, anchor_date, anchor_odometer, template_id, notes, created_at, updated_at, deleted)
		values (
			(r->>'id')::uuid, auth.uid(), (r->>'vehicleId')::uuid,
			r->>'name', (r->>'intervalKm')::int, (r->>'intervalMonths')::int,
			(r->>'anchorDate')::date, (r->>'anchorOdometer')::int, r->>'templateId', r->>'notes',
			(r->>'createdAt')::timestamptz, (r->>'updatedAt')::timestamptz, (r->>'deleted')::int = 1
		)
		on conflict (id) do update set
			vehicle_id = excluded.vehicle_id, name = excluded.name,
			interval_km = excluded.interval_km, interval_months = excluded.interval_months,
			anchor_date = excluded.anchor_date, anchor_odometer = excluded.anchor_odometer,
			template_id = excluded.template_id, notes = excluded.notes,
			updated_at = excluded.updated_at, deleted = excluded.deleted
		where excluded.updated_at > maintenance_items.updated_at;
	end loop;

	for r in select * from jsonb_array_elements(coalesce(changes->'serviceRecords', '[]'::jsonb)) loop
		insert into service_records (id, user_id, vehicle_id, item_id, title, date, odometer, cost, currency, notes, attachments, created_at, updated_at, deleted)
		values (
			(r->>'id')::uuid, auth.uid(), (r->>'vehicleId')::uuid, (r->>'itemId')::uuid,
			r->>'title', (r->>'date')::date, (r->>'odometer')::int, (r->>'cost')::numeric,
			r->>'currency', r->>'notes', coalesce(r->'attachments', '[]'::jsonb),
			(r->>'createdAt')::timestamptz, (r->>'updatedAt')::timestamptz, (r->>'deleted')::int = 1
		)
		on conflict (id) do update set
			vehicle_id = excluded.vehicle_id, item_id = excluded.item_id, title = excluded.title,
			date = excluded.date, odometer = excluded.odometer, cost = excluded.cost,
			currency = excluded.currency, notes = excluded.notes, attachments = excluded.attachments,
			updated_at = excluded.updated_at, deleted = excluded.deleted
		where excluded.updated_at > service_records.updated_at;
	end loop;

	for r in select * from jsonb_array_elements(coalesce(changes->'mileageEntries', '[]'::jsonb)) loop
		insert into mileage_entries (id, user_id, vehicle_id, odometer, recorded_at, created_at, updated_at, deleted)
		values (
			(r->>'id')::uuid, auth.uid(), (r->>'vehicleId')::uuid,
			(r->>'odometer')::int, (r->>'recordedAt')::timestamptz,
			(r->>'createdAt')::timestamptz, (r->>'updatedAt')::timestamptz, (r->>'deleted')::int = 1
		)
		on conflict (id) do update set
			vehicle_id = excluded.vehicle_id, odometer = excluded.odometer,
			recorded_at = excluded.recorded_at,
			updated_at = excluded.updated_at, deleted = excluded.deleted
		where excluded.updated_at > mileage_entries.updated_at;
	end loop;
end;
$$;

revoke all on function public.push_changes(jsonb) from public, anon;
grant execute on function public.push_changes(jsonb) to authenticated;
