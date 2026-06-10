import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { db, SYNCED_TABLES } from '$lib/db/db';
import { create } from '$lib/db/repo';
import { applyPulled, clearPendingFlags, resetSyncCheckpoint } from './engine.svelte';
import { newerThan, normaliseISO, pullSelect, toLocalPatch, toPushRow } from './shape';
import type { PulledRow } from './shape';
import type { Vehicle } from '$lib/domain/types';

beforeEach(async () => {
	await Promise.all([...SYNCED_TABLES.map((t) => db.table(t).clear()), db.settings.clear()]);
});

function pulledVehicle(over: Partial<PulledRow> = {}): PulledRow {
	return {
		id: 'aaaaaaaa-0000-0000-0000-000000000001',
		name: 'Remote Golf',
		make: null,
		model: null,
		year: null,
		plate: null,
		odometerUnit: 'km',
		createdAt: '2026-06-01T10:00:00+00:00',
		updatedAt: '2026-06-09T10:00:00+00:00',
		serverUpdatedAt: '2026-06-09T10:00:01+00:00',
		deleted: false,
		...over
	};
}

describe('timestamp handling', () => {
	it('normalises +00:00 offsets to Z so formats never mix', () => {
		expect(normaliseISO('2026-06-09T10:00:00+00:00')).toBe('2026-06-09T10:00:00.000Z');
	});

	it('newerThan compares instants, not strings', () => {
		expect(newerThan('2026-06-09T10:00:01+00:00', '2026-06-09T10:00:00.000Z')).toBe(true);
		expect(newerThan('2026-06-09T10:00:00+00:00', '2026-06-09T10:00:00.000Z')).toBe(false);
	});
});

describe('applyPulled', () => {
	it('inserts unknown rows with pendingSync cleared', async () => {
		await applyPulled('vehicles', [pulledVehicle()]);
		const row = (await db.vehicles.get('aaaaaaaa-0000-0000-0000-000000000001')) as Vehicle;
		expect(row.name).toBe('Remote Golf');
		expect(row.pendingSync).toBe(0);
		expect(row.deleted).toBe(0);
		expect(row.updatedAt).toBe('2026-06-09T10:00:00.000Z');
	});

	it('newer remote wins over older local', async () => {
		const id = await create('vehicles', { name: 'Local name', odometerUnit: 'km' });
		await db.vehicles.update(id, { updatedAt: '2026-06-01T00:00:00.000Z' });
		await applyPulled('vehicles', [pulledVehicle({ id, name: 'Remote wins' })]);
		const row = (await db.vehicles.get(id)) as Vehicle;
		expect(row.name).toBe('Remote wins');
		expect(row.pendingSync).toBe(0);
	});

	it('older or equal remote loses against local (own-push echo is a no-op)', async () => {
		const id = await create('vehicles', { name: 'Local newer', odometerUnit: 'km' });
		await db.vehicles.update(id, { updatedAt: '2026-06-10T00:00:00.000Z' });
		await applyPulled('vehicles', [
			pulledVehicle({ id, name: 'Remote older', updatedAt: '2026-06-09T10:00:00+00:00' }),
			pulledVehicle({ id, name: 'Remote equal', updatedAt: '2026-06-10T00:00:00+00:00' })
		]);
		const row = (await db.vehicles.get(id)) as Vehicle;
		expect(row.name).toBe('Local newer');
		expect(row.pendingSync).toBe(1);
	});

	it('applies remote tombstones', async () => {
		const id = await create('vehicles', { name: 'To delete', odometerUnit: 'km' });
		await db.vehicles.update(id, { updatedAt: '2026-06-01T00:00:00.000Z', pendingSync: 0 });
		await applyPulled('vehicles', [pulledVehicle({ id, deleted: true })]);
		const row = (await db.vehicles.get(id)) as Vehicle;
		expect(row.deleted).toBe(1);
	});

	it('preserves the device-local photo blob on remote update', async () => {
		const id = await create('vehicles', { name: 'With photo', odometerUnit: 'km' });
		const photo = new Blob(['x'], { type: 'image/png' });
		await db.vehicles.update(id, { photo, updatedAt: '2026-06-01T00:00:00.000Z' });
		await applyPulled('vehicles', [pulledVehicle({ id, name: 'Renamed remotely' })]);
		const row = (await db.vehicles.get(id)) as Vehicle;
		expect(row.name).toBe('Renamed remotely');
		expect(row.photo).toBeDefined();
	});
});

describe('clearPendingFlags', () => {
	it('clears flags only for rows unchanged since the push', async () => {
		const a = await create('vehicles', { name: 'A', odometerUnit: 'km' });
		const b = await create('vehicles', { name: 'B', odometerUnit: 'km' });
		const pushed = [
			{ id: a, updatedAt: (await db.vehicles.get(a))!.updatedAt },
			{ id: b, updatedAt: (await db.vehicles.get(b))!.updatedAt }
		];
		// B is rewritten while the push was in flight.
		await db.vehicles.update(b, { name: 'B2', updatedAt: '2099-01-01T00:00:00.000Z' });

		await clearPendingFlags('vehicles', pushed);
		expect((await db.vehicles.get(a))!.pendingSync).toBe(0);
		expect((await db.vehicles.get(b))!.pendingSync).toBe(1);
	});
});

describe('resetSyncCheckpoint', () => {
	it('re-flags all rows and clears cursors', async () => {
		const id = await create('vehicles', { name: 'A', odometerUnit: 'km' });
		await db.vehicles.update(id, { pendingSync: 0 });
		await db.settings.put({ key: 'lastPullCursors', value: { vehicles: '2026-01-01' } });

		await resetSyncCheckpoint();
		expect((await db.vehicles.get(id))!.pendingSync).toBe(1);
		expect((await db.settings.get('lastPullCursors'))!.value).toEqual({});
	});
});

describe('shape mapping', () => {
	it('toPushRow drops local-only fields and keeps explicit nulls', () => {
		const row = toPushRow('vehicles', {
			id: 'x',
			name: 'Golf',
			odometerUnit: 'km',
			photo: new Blob([]),
			pendingSync: 1,
			createdAt: 'c',
			updatedAt: 'u',
			deleted: 0
		});
		expect(row).toEqual({
			id: 'x',
			createdAt: 'c',
			updatedAt: 'u',
			deleted: 0,
			name: 'Golf',
			make: null,
			model: null,
			year: null,
			plate: null,
			odometerUnit: 'km'
		});
	});

	it('toLocalPatch keeps designed nulls and converts tombstones', () => {
		const patch = toLocalPatch('serviceRecords', {
			id: 'r1',
			vehicleId: 'v1',
			itemId: null,
			title: 'One-off',
			date: '2026-06-01',
			odometer: 1000,
			cost: null,
			currency: null,
			notes: null,
			attachments: [],
			createdAt: '2026-06-01T00:00:00+00:00',
			updatedAt: '2026-06-01T00:00:00+00:00',
			serverUpdatedAt: '2026-06-01T00:00:01+00:00',
			deleted: false
		});
		expect(patch.itemId).toBeNull();
		expect(patch.title).toBe('One-off');
		expect(patch.deleted).toBe(0);
		expect(patch.attachments).toEqual([]);
		expect(patch.notes).toBeUndefined();
	});

	it('pullSelect aliases snake_case columns', () => {
		expect(pullSelect('mileageEntries')).toBe(
			'id,vehicleId:vehicle_id,odometer,recordedAt:recorded_at,createdAt:created_at,updatedAt:updated_at,serverUpdatedAt:server_updated_at,deleted'
		);
	});
});
