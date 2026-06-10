// Single write path for all local data. Every mutation stamps id/createdAt/
// updatedAt/pendingSync/deleted here — sync correctness depends on no code
// writing to the Dexie tables directly.

import { db, type AppDB, type Settings, type SyncedTableName } from './db';
import type { SyncStamps } from '$lib/domain/types';
import { emitLocalWrite } from '$lib/sync/bus';

type Row<T extends SyncedTableName> = AppDB[T] extends {
	get(key: string): Promise<infer R | undefined>;
}
	? R
	: never;

export type NewRow<T extends SyncedTableName> = Omit<Row<T>, keyof SyncStamps>;

function nowISO(): string {
	return new Date().toISOString();
}

export async function create<T extends SyncedTableName>(
	table: T,
	data: NewRow<T>
): Promise<string> {
	const now = nowISO();
	const id = crypto.randomUUID();
	const row = { ...data, id, createdAt: now, updatedAt: now, deleted: 0, pendingSync: 1 };
	await db.table(table).add(row as Row<T>);
	emitLocalWrite();
	return id;
}

export async function update<T extends SyncedTableName>(
	table: T,
	id: string,
	patch: Partial<NewRow<T>>
): Promise<void> {
	await db.table(table).update(id, { ...patch, updatedAt: nowISO(), pendingSync: 1 });
	emitLocalWrite();
}

/** Tombstone, never a hard delete — deletions must propagate through sync. */
export async function remove(table: SyncedTableName, id: string): Promise<void> {
	await db.table(table).update(id, { deleted: 1, updatedAt: nowISO(), pendingSync: 1 });
	emitLocalWrite();
}

/** Tombstones a vehicle and everything belonging to it. */
export async function removeVehicle(vehicleId: string): Promise<void> {
	const stamp = { deleted: 1 as const, updatedAt: nowISO(), pendingSync: 1 as const };
	await db.transaction(
		'rw',
		[db.vehicles, db.maintenanceItems, db.serviceRecords, db.mileageEntries],
		async () => {
			await db.vehicles.update(vehicleId, stamp);
			await db.maintenanceItems.where('vehicleId').equals(vehicleId).modify(stamp);
			await db.serviceRecords.where('vehicleId').equals(vehicleId).modify(stamp);
			await db.mileageEntries.where('vehicleId').equals(vehicleId).modify(stamp);
		}
	);
	emitLocalWrite();
}

export async function getSetting<K extends keyof Settings>(
	key: K
): Promise<Settings[K] | undefined>;
export async function getSetting<K extends keyof Settings>(
	key: K,
	fallback: Settings[K]
): Promise<Settings[K]>;
export async function getSetting<K extends keyof Settings>(key: K, fallback?: Settings[K]) {
	const row = await db.settings.get(key);
	return row ? (row.value as Settings[K]) : fallback;
}

export async function setSetting<K extends keyof Settings>(
	key: K,
	value: Settings[K]
): Promise<void> {
	await db.settings.put({ key, value });
}

export async function getDeviceId(): Promise<string> {
	const existing = await getSetting('deviceId');
	if (existing) return existing;
	const id = crypto.randomUUID();
	await setSetting('deviceId', id);
	return id;
}
