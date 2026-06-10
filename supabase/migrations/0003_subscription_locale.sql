-- Account-based push digests are composed server-side, so the cron needs to
-- know each device's language.
alter table public.push_subscriptions
	add column locale text not null default 'en';
