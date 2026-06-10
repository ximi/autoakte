-- Accountless push reminders. The client precomputes its upcoming
-- notifications locally and uploads only (endpoint, fire dates, message
-- text) keyed by a random device token — no vehicle data reaches the server.
-- The token is a bearer secret; only its sha256 is stored.

create extension if not exists pgcrypto with schema extensions;

create table public.device_schedules (
	device_token_hash text primary key,
	endpoint text not null unique,
	p256dh text not null,
	auth text not null,
	-- [{ "date": "YYYY-MM-DD", "title": "...", "body": "..." }, ...]
	schedule jsonb not null default '[]',
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);

-- Deny all direct access (no policies); the RPCs below and the service-role
-- cron are the only entry points.
alter table public.device_schedules enable row level security;

create function public.upsert_device_schedule(
	device_token text,
	endpoint text,
	p256dh text,
	auth text,
	schedule jsonb
)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
	h text;
begin
	if device_token is null or length(device_token) < 16 then
		raise exception 'invalid device token';
	end if;
	if jsonb_typeof(schedule) <> 'array' or jsonb_array_length(schedule) > 50 then
		raise exception 'invalid schedule';
	end if;
	h := encode(digest(device_token, 'sha256'), 'hex');

	-- A reinstalled app gets a fresh token but may reuse the same endpoint.
	delete from device_schedules ds
	where ds.endpoint = upsert_device_schedule.endpoint and ds.device_token_hash <> h;

	insert into device_schedules as ds (device_token_hash, endpoint, p256dh, auth, schedule)
	values (h, endpoint, p256dh, auth, schedule)
	on conflict (device_token_hash) do update set
		endpoint = excluded.endpoint,
		p256dh = excluded.p256dh,
		auth = excluded.auth,
		schedule = excluded.schedule,
		updated_at = now();
end;
$$;

create function public.delete_device_schedule(device_token text)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
	delete from device_schedules
	where device_token_hash = encode(digest(device_token, 'sha256'), 'hex');
end;
$$;

revoke all on function public.upsert_device_schedule(text, text, text, text, jsonb) from public, anon, authenticated;
revoke all on function public.delete_device_schedule(text) from public, anon, authenticated;
grant execute on function public.upsert_device_schedule(text, text, text, text, jsonb) to anon, authenticated;
grant execute on function public.delete_device_schedule(text) to anon, authenticated;
