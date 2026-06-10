import { db } from '$lib/db/db';
import type { MaintenanceItem, MileageEntry, ServiceRecord, Vehicle } from '$lib/domain/types';

export interface AllData {
	vehicles: Vehicle[];
	items: MaintenanceItem[];
	records: ServiceRecord[];
	entries: MileageEntry[];
}

export const EMPTY_DATA: AllData = { vehicles: [], items: [], records: [], entries: [] };

/** Everything non-deleted — the dashboard works on the full (small) dataset. */
export async function allData(): Promise<AllData> {
	const [vehicles, items, records, entries] = await Promise.all([
		db.vehicles.where('deleted').equals(0).toArray(),
		db.maintenanceItems.where('deleted').equals(0).toArray(),
		db.serviceRecords.where('deleted').equals(0).toArray(),
		db.mileageEntries.where('deleted').equals(0).toArray()
	]);
	return { vehicles, items, records, entries };
}

export interface VehicleBundle {
	vehicle: Vehicle | null;
	items: MaintenanceItem[];
	records: ServiceRecord[];
	entries: MileageEntry[];
}

export const EMPTY_BUNDLE: VehicleBundle = { vehicle: null, items: [], records: [], entries: [] };

export async function vehicleBundle(vehicleId: string): Promise<VehicleBundle> {
	const [vehicle, items, records, entries] = await Promise.all([
		db.vehicles.get(vehicleId),
		db.maintenanceItems.where('vehicleId').equals(vehicleId).toArray(),
		db.serviceRecords.where('vehicleId').equals(vehicleId).toArray(),
		db.mileageEntries.where('vehicleId').equals(vehicleId).toArray()
	]);
	return {
		vehicle: vehicle && !vehicle.deleted ? vehicle : null,
		items: items.filter((i) => !i.deleted),
		records: records.filter((r) => !r.deleted),
		entries: entries.filter((e) => !e.deleted)
	};
}
