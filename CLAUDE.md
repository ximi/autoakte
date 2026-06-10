# Car Maintenance PWA

Local-first PWA for tracking routine car maintenance across multiple vehicles. SvelteKit (Svelte 5, runes) + Tailwind v4, Dexie (IndexedDB), optional Supabase account (email OTP) for multi-device sync, Web Push reminders via a daily Vercel cron. Full architecture plan: see the project plan / README.

## Dev environment

- **Node 22 required** (`engines` is enforced — `~/.npmrc` has `engine-strict=true`). The Homebrew default `node` on this machine is v23, which fails install. Prefix commands with:
  `export PATH="/opt/homebrew/opt/node@22/bin:$PATH"`
- Config note: this scaffold has **no `svelte.config.js`** — SvelteKit options (adapter, compiler) live in `vite.config.ts` via the `sveltekit()` plugin options.
- `npm run test` (Vitest, unit project only), `npm run check` (svelte-check), `npm run lint`.

## Architecture rules

- `src/lib/domain/` is **pure TS** — no DOM, Dexie, or Supabase imports. The due-state engine there is shared by the client UI and the server cron; keep it that way.
- All local writes go through `src/lib/db/repo.ts`, which stamps `id`/`updatedAt`/`pendingSync`/`deleted`. Never write to Dexie tables directly — sync correctness depends on it.
- Current odometer is always derived (max over mileage entries ∪ service records ∪ item anchors), never stored.
- Deletes are tombstones (`deleted: 1`), required for sync.
- The app must remain fully functional offline with no account; account only adds sync + push.
