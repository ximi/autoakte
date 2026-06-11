# AutoAkte

A local-first PWA for tracking routine car maintenance across multiple vehicles, with due-date/mileage reminders.

- **Local-first:** everything lives in IndexedDB; the app is fully functional offline with no account.
- **Optional account** (email + 6-digit OTP code via Supabase) adds multi-device sync and self-correcting push reminders. Signing in with the same email on a second device is the pairing mechanism.
- **Reminders:** a daily Vercel cron sends Web Push digests — when an item enters _due soon_, when it becomes _overdue_, a weekly re-ping while overdue, plus a periodic "log your mileage" prompt. Two paths:
  - **Signed in:** the cron recomputes due states server-side from synced data (same TypeScript engine the client uses), so reminders self-correct daily.
  - **Signed out:** the app precomputes upcoming notification dates locally on every use and uploads only dates + message text under an anonymous device token (sha256-hashed server-side, deny-all RLS, RPC-only access). No vehicle data reaches the server; mileage-based projections drift until the app is next opened.

## Stack

SvelteKit (Svelte 5) · Tailwind v4 · Dexie (IndexedDB) · Supabase (Postgres + Auth) · `@vite-pwa/sveltekit` · `web-push` · Vercel (adapter-vercel, Node 22, cron).

## Development

Requires **Node 22** (`engine-strict` is on).

```sh
npm install
npm run dev        # app on :5173 (sync disabled until .env is filled)
npm run test       # Vitest unit suite (domain engine, db layer, sync LWW, digests)
npm run check      # svelte-check
npm run build && npm run preview   # production build incl. service worker
```

## Setup (one-time)

1. **Supabase**: create a free project, then apply `supabase/migrations/0001_init.sql`
   (`npx supabase login && npx supabase link --project-ref <ref> && npx supabase db push`, or paste it into the dashboard SQL editor).
2. **Auth**: in Supabase → Authentication → Email, make sure the **email OTP** flow works: the "Magic Link" template must contain `{{ .Token }}` (the 6-digit code) instead of/alongside the link, since the app verifies codes (`verifyOtp`), not links. Built-in email has tight rate limits (fine for personal use).
3. **Env vars**: copy `.env.example` → `.env`; fill `PUBLIC_SUPABASE_URL` and `PUBLIC_SUPABASE_ANON_KEY` (Settings → API). Generate VAPID keys with `npx web-push generate-vapid-keys`. On Vercel set all of them, plus `SUPABASE_SERVICE_ROLE_KEY` and `CRON_SECRET` (server-only).
4. **Vercel**: import the GitHub repo; `vercel.json` registers the daily cron at `/api/cron/reminders`.

## Security model

- RLS denies everything by default; each table has owner-only (`user_id = auth.uid()`) select/insert/update policies. No delete policies — deletes are tombstones so they propagate through sync.
- The LWW conditional upsert runs through `push_changes()` (SECURITY INVOKER — RLS still applies; `user_id` is forced server-side).
- The service-role key is used only by the cron on the server.

## Known limitations / risks

- **iOS push** needs iOS ≥ 16.4 **and** the PWA installed to the Home Screen; permission must be requested from a user gesture; subscriptions die silently if the PWA is uninstalled (the cron's 404/410 cleanup is the only signal).
- **iOS Safari "Notifications" feature flag**: if web pushes are accepted by APNs but never display (and iOS eventually revokes the subscription), check Settings → Apps → Safari → Advanced → Feature Flags → Notifications — it must be ON. Some iOS builds/updates leave it off; symptoms look identical to VPN/Focus issues.
- **Vercel Hobby cron** runs once daily with up to ~59 min jitter — reminders are "morning-ish".
- **Supabase free tier** pauses after ~7 idle days; the daily cron should keep it active, but check after the first quiet week.
- **LWW clock skew**: a device with a wrong clock can win an edit conflict. Pull cursors use server time, so no data is ever skipped.
- Safari may evict IndexedDB for long-unused non-installed sites — sync and the JSON export (Settings) are the backups.
- Vehicle photos stay device-local (not synced) in this version.
