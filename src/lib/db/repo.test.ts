import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { db, SYNCED_TABLES } from './db';
import { create, getDeviceId, getSetting, remove, removeVehicle, setSetting, update } from './repo';
import type { Vehicle } from '$lib/domain/types';

const vehicleData = { name: 'Golf VII', odometerUnit: 'km' as const };

beforeEach(async () => {
	await Promise.all([...SYNCED_TABLES.map((t) => db.table(t).clear()), db.settings.clear()]);
});

describe('create', () => {
	it('stamps id, timestamps, tombstone and pendingSync', async () => {
		const id = await create('vehicles', vehicleData);
		const row = (await db.vehicles.get(id)) as Vehicle;
		expect(row.name).toBe('Golf VII');
		expect(row.id).toBe(id);
		expect(row.createdAt).toBe(row.updatedAt);
		expect(row.deleted).toBe(0);
		expect(row.pendingSync).toBe(1);
	});
});

describe('update', () => {
	it('bumps updatedAt and re-flags pendingSync', async () => {
		const id = await create('vehicles', vehicleData);
		await db.vehicles.update(id, { pendingSync: 0 });
		const before = (await db.vehicles.get(id)) as Vehicle;

		await new Promise((r) => setTimeout(r, 5));
		await update('vehicles', id, { name: 'Golf GTI' });

		const after = (await db.vehicles.get(id)) as Vehicle;
		expect(after.name).toBe('Golf GTI');
		expect(after.pendingSync).toBe(1);
		expect(after.updatedAt > before.updatedAt).toBe(true);
		expect(after.createdAt).toBe(before.createdAt);
	});
});

describe('remove', () => {
	it('tombstones instead of deleting the row', async () => {
		const id = await create('vehicles', vehicleData);
		await remove('vehicles', id);
		const row = (await db.vehicles.get(id)) as Vehicle;
		expect(row.deleted).toBe(1);
		expect(row.pendingSync).toBe(1);
	});
});

describe('removeVehicle', () => {
	it('cascades tombstones to items, records and entries', async () => {
		const vehicleId = await create('vehicles', vehicleData);
		const itemId = await create('maintenanceItems', {
			vehicleId,
			name: 'Oil',
			intervalKm: 15000,
			intervalMonths: null,
			anchorDate: null,
			anchorOdometer: null,
			templateId: null
		});
		await create('serviceRecords', {
			vehicleId,
			itemId,
			date: '2026-06-01',
			odometer: 50000,
			cost: null,
			currency: null,
			attachments: []
		});
		await create('mileageEntries', {
			vehicleId,
			odometer: 50100,
			recordedAt: '2026-06-05T00:00:00.000Z'
		});
		const otherVehicle = await create('vehicles', { name: 'Vespa', odometerUnit: 'km' });

		await removeVehicle(vehicleId);

		for (const table of SYNCED_TABLES) {
			const rows = await db.table(table).toArray();
			for (const row of rows) {
				if (row.id === otherVehicle) expect(row.deleted).toBe(0);
				else expect(row.deleted).toBe(1);
			}
		}
	});
});

describe('settings', () => {
	it('round-trips typed values with fallback', async () => {
		expect(await getSetting('mileageReminderDays')).toBeUndefined();
		expect(await getSetting('mileageReminderDays', 14)).toBe(14);
		await setSetting('mileageReminderDays', 7);
		expect(await getSetting('mileageReminderDays')).toBe(7);
	});

	it('generates a stable deviceId once', async () => {
		const first = await getDeviceId();
		expect(first).toMatch(/[0-9a-f-]{36}/);
		expect(await getDeviceId()).toBe(first);
	});
});
