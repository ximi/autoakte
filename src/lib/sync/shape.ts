// Field mapping between local (camelCase, Dexie) and remote (snake_case,
// Postgres) rows. Local-only fields (pendingSync, photo) never leave the
// device; applying remote rows must preserve them.

import type { SyncedTableName } from '$lib/db/db';

export const REMOTE_TABLE: Record<SyncedTableName, string> = {
	vehicles: 'vehicles',
	maintenanceItems: 'maintenance_items',
	serviceRecords: 'service_records',
	mileageEntries: 'mileage_entries'
};

/** local field → remote column, for everything that syncs (besides stamps). */
const FIELDS: Record<SyncedTableName, Record<string, string>> = {
	vehicles: {
		name: 'name',
		make: 'make',
		model: 'model',
		year: 'year',
		plate: 'plate',
		odometerUnit: 'odometer_unit'
	},
	maintenanceItems: {
		vehicleId: 'vehicle_id',
		name: 'name',
		intervalKm: 'interval_km',
		intervalMonths: 'interval_months',
		anchorDate: 'anchor_date',
		anchorOdometer: 'anchor_odometer',
		templateId: 'template_id',
		notes: 'notes'
	},
	serviceRecords: {
		vehicleId: 'vehicle_id',
		itemId: 'item_id',
		title: 'title',
		date: 'date',
		odometer: 'odometer',
		cost: 'cost',
		currency: 'currency',
		notes: 'notes',
		attachments: 'attachments'
	},
	mileageEntries: {
		vehicleId: 'vehicle_id',
		odometer: 'odometer',
		recordedAt: 'recorded_at'
	}
};

/** PostgREST select string aliasing snake_case columns back to local names. */
export function pullSelect(table: SyncedTableName): string {
	const fields = Object.entries(FIELDS[table]).map(([local, remote]) =>
		local === remote ? local : `${local}:${remote}`
	);
	return [
		'id',
		...fields,
		'createdAt:created_at',
		'updatedAt:updated_at',
		'serverUpdatedAt:server_updated_at',
		'deleted'
	].join(',');
}

/** Local row → camelCase payload row for push_changes (drops local-only fields). */
export function toPushRow(table: SyncedTableName, row: Record<string, unknown>) {
	const out: Record<string, unknown> = {
		id: row.id,
		createdAt: row.createdAt,
		updatedAt: row.updatedAt,
		deleted: row.deleted
	};
	for (const local of Object.keys(FIELDS[table])) out[local] = row[local] ?? null;
	return out;
}

export interface PulledRow extends Record<string, unknown> {
	id: string;
	updatedAt: string;
	serverUpdatedAt: string;
	deleted: boolean;
}

/** Pulled row → local field patch (normalised timestamps, numeric tombstone). */
export function toLocalPatch(table: SyncedTableName, row: PulledRow) {
	const out: Record<string, unknown> = {
		id: row.id,
		createdAt: normaliseISO(String(row.createdAt)),
		updatedAt: normaliseISO(String(row.updatedAt)),
		deleted: row.deleted ? 1 : 0,
		pendingSync: 0
	};
	for (const local of Object.keys(FIELDS[table])) {
		out[local] = row[local] === null ? undefined : row[local];
	}
	// Nullable-by-design fields must stay explicit nulls, not undefined.
	if (table === 'maintenanceItems') {
		for (const k of ['intervalKm', 'intervalMonths', 'anchorDate', 'anchorOdometer', 'templateId'])
			out[k] = row[k] ?? null;
	}
	if (table === 'serviceRecords') {
		for (const k of ['itemId', 'title', 'cost', 'currency']) out[k] = row[k] ?? null;
		out.attachments = row.attachments ?? [];
	}
	if (table === 'mileageEntries') out.recordedAt = normaliseISO(String(row.recordedAt));
	return out;
}

/**
 * Postgres returns `+00:00` offsets while the client writes `Z` — normalise so
 * string comparison is never relied on; LWW always compares epoch ms anyway.
 */
export function normaliseISO(ts: string): string {
	return new Date(ts).toISOString();
}

export function newerThan(a: string, b: string): boolean {
	return new Date(a).getTime() > new Date(b).getTime();
}
