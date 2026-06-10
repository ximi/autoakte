// Push/pull sync engine. Local IndexedDB is the source of truth; the server
// converges devices via last-write-wins on the client updatedAt. Pull cursors
// are per table and based on server_updated_at, so device clock skew can
// never cause missed rows.

import { db, SYNCED_TABLES, type SyncedTableName } from '$lib/db/db';
import { getSetting, setSetting } from '$lib/db/repo';
import { supabase } from './client';
import { onLocalWrite } from './bus';
import {
	newerThan,
	pullSelect,
	REMOTE_TABLE,
	toLocalPatch,
	toPushRow,
	type PulledRow
} from './shape';

const PUSH_CHUNK = 500;
const PULL_PAGE = 1000;
const WRITE_DEBOUNCE_MS = 2500;
const PERIODIC_MS = 15 * 60 * 1000;

export const syncStatus = $state({
	state: 'idle' as 'disabled' | 'idle' | 'syncing' | 'error',
	lastSyncAt: null as string | null,
	error: null as string | null
});

let syncing = false;
let rerun = false;

export async function syncNow(): Promise<void> {
	if (!supabase) return;
	const {
		data: { session }
	} = await supabase.auth.getSession();
	if (!session) return;
	if (syncing) {
		rerun = true;
		return;
	}
	syncing = true;
	syncStatus.state = 'syncing';
	try {
		await pushAll();
		await pullAll();
		syncStatus.state = 'idle';
		// eslint-disable-next-line svelte/prefer-svelte-reactivity -- plain timestamp, not reactive state
		syncStatus.lastSyncAt = new Date().toISOString();
		syncStatus.error = null;
	} catch (e) {
		syncStatus.state = 'error';
		syncStatus.error = e instanceof Error ? e.message : String(e);
		console.error('sync failed', e);
	} finally {
		syncing = false;
		if (rerun) {
			rerun = false;
			void syncNow();
		}
	}
}

async function pushAll(): Promise<void> {
	for (const table of SYNCED_TABLES) {
		const pending = await db.table(table).where('pendingSync').equals(1).toArray();
		for (let i = 0; i < pending.length; i += PUSH_CHUNK) {
			const chunk = pending.slice(i, i + PUSH_CHUNK);
			const { error } = await supabase!.rpc('push_changes', {
				changes: { [table]: chunk.map((row) => toPushRow(table, row)) }
			});
			if (error) throw new Error(`push ${table}: ${error.message}`);
			await clearPendingFlags(table, chunk);
		}
	}
}

/** Clear pendingSync only when the row wasn't rewritten mid-flight. */
export async function clearPendingFlags(
	table: SyncedTableName,
	pushed: { id: string; updatedAt: string }[]
): Promise<void> {
	await db.transaction('rw', db.table(table), async () => {
		for (const row of pushed) {
			const current = await db.table(table).get(row.id);
			if (current && current.updatedAt === row.updatedAt) {
				await db.table(table).update(row.id, { pendingSync: 0 });
			}
		}
	});
}

async function pullAll(): Promise<void> {
	const cursors = await getSetting('lastPullCursors', {});
	let changed = false;
	for (const table of SYNCED_TABLES) {
		let cursor = cursors[table] ?? '1970-01-01T00:00:00.000Z';
		for (;;) {
			const { data, error } = await supabase!
				.from(REMOTE_TABLE[table])
				.select(pullSelect(table))
				.gt('server_updated_at', cursor)
				.order('server_updated_at', { ascending: true })
				.limit(PULL_PAGE);
			if (error) throw new Error(`pull ${table}: ${error.message}`);
			const rows = (data ?? []) as unknown as PulledRow[];
			if (rows.length === 0) break;
			await applyPulled(table, rows);
			cursor = String(rows[rows.length - 1].serverUpdatedAt);
			cursors[table] = cursor;
			changed = true;
			if (rows.length < PULL_PAGE) break;
		}
	}
	if (changed) await setSetting('lastPullCursors', cursors);
}

/** Apply remote rows with LWW; preserves local-only fields (photo). */
export async function applyPulled(table: SyncedTableName, rows: PulledRow[]): Promise<void> {
	await db.transaction('rw', db.table(table), async () => {
		for (const row of rows) {
			const local = await db.table(table).get(row.id);
			// Skip unless strictly newer — also swallows the echo of our own push.
			if (local && !newerThan(String(row.updatedAt), local.updatedAt)) continue;
			const patch = toLocalPatch(table, row);
			if (local) await db.table(table).update(row.id, patch);
			else await db.table(table).add(patch as never);
		}
	});
}

/**
 * Called on sign-out (and before signing into a possibly different account):
 * re-flag everything as pending and drop cursors, so the next sign-in does a
 * full merge in both directions.
 */
export async function resetSyncCheckpoint(): Promise<void> {
	for (const table of SYNCED_TABLES) {
		await db.table(table).toCollection().modify({ pendingSync: 1 });
	}
	await setSetting('lastPullCursors', {});
}

/** Wire all sync triggers; returns a cleanup function. Call once per app load. */
export function startSyncTriggers(): () => void {
	if (!supabase) {
		syncStatus.state = 'disabled';
		return () => {};
	}

	void syncNow();

	let debounce: ReturnType<typeof setTimeout> | undefined;
	const offWrite = onLocalWrite(() => {
		clearTimeout(debounce);
		debounce = setTimeout(() => void syncNow(), WRITE_DEBOUNCE_MS);
	});

	const onVisible = () => {
		if (document.visibilityState === 'visible') void syncNow();
	};
	const onOnline = () => void syncNow();
	document.addEventListener('visibilitychange', onVisible);
	window.addEventListener('online', onOnline);
	const interval = setInterval(() => void syncNow(), PERIODIC_MS);

	const {
		data: { subscription }
	} = supabase.auth.onAuthStateChange((event) => {
		if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') void syncNow();
	});

	return () => {
		clearTimeout(debounce);
		offWrite();
		document.removeEventListener('visibilitychange', onVisible);
		window.removeEventListener('online', onOnline);
		clearInterval(interval);
		subscription.unsubscribe();
	};
}
