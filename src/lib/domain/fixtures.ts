// Test factories — not shipped in app code paths.
import type { MaintenanceItem, MileageEntry, ServiceRecord, SyncStamps, Vehicle } from './types';

let n = 0;

function stamps(createdAt = '2026-01-01T00:00:00.000Z'): SyncStamps {
	n += 1;
	return { id: `fix-${n}`, createdAt, updatedAt: createdAt, deleted: 0, pendingSync: 0 };
}

export function makeVehicle(over: Partial<Vehicle> = {}): Vehicle {
	return { ...stamps(), name: 'Test car', odometerUnit: 'km', ...over };
}

export function makeItem(over: Partial<MaintenanceItem> = {}): MaintenanceItem {
	return {
		...stamps(),
		vehicleId: 'v1',
		name: 'Oil & filter change',
		intervalKm: 15000,
		intervalMonths: 12,
		anchorDate: null,
		anchorOdometer: null,
		templateId: null,
		...over
	};
}

export function makeRecord(over: Partial<ServiceRecord> = {}): ServiceRecord {
	return {
		...stamps(),
		vehicleId: 'v1',
		itemId: 'i1',
		title: null,
		date: '2026-01-01',
		odometer: 50000,
		cost: null,
		currency: null,
		attachments: [],
		...over
	};
}

export function makeEntry(over: Partial<MileageEntry> = {}): MileageEntry {
	return {
		...stamps(),
		vehicleId: 'v1',
		odometer: 50000,
		recordedAt: '2026-01-01T00:00:00.000Z',
		...over
	};
}
