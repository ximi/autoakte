import Dexie, { type Table } from 'dexie';
import type { MaintenanceItem, MileageEntry, ServiceRecord, Vehicle } from '$lib/domain/types';

/** Typed key-value settings. Device-local — never synced. */
export interface Settings {
	deviceId: string;
	mileageReminderDays: number;
	onboardingDone: boolean;
	/** Per-table sync pull cursors (max server_updated_at seen). */
	lastPullCursors: Record<string, string>;
	/** Bearer secret identifying this device's accountless push schedule. */
	pushDeviceToken: string;
}

export interface SettingRow<K extends keyof Settings = keyof Settings> {
	key: K;
	value: Settings[K];
}

export class AppDB extends Dexie {
	vehicles!: Table<Vehicle, string>;
	maintenanceItems!: Table<MaintenanceItem, string>;
	serviceRecords!: Table<ServiceRecord, string>;
	mileageEntries!: Table<MileageEntry, string>;
	settings!: Table<SettingRow, string>;

	constructor(name = 'car-maintenance') {
		super(name);
		this.version(1).stores({
			vehicles: 'id, deleted, pendingSync',
			maintenanceItems: 'id, vehicleId, deleted, pendingSync',
			serviceRecords: 'id, vehicleId, itemId, date, deleted, pendingSync',
			mileageEntries: 'id, vehicleId, recordedAt, deleted, pendingSync',
			settings: 'key'
		});
	}
}

export const db = new AppDB();

/** The four synced tables — everything except device-local settings. */
export type SyncedTableName = 'vehicles' | 'maintenanceItems' | 'serviceRecords' | 'mileageEntries';
export const SYNCED_TABLES: SyncedTableName[] = [
	'vehicles',
	'maintenanceItems',
	'serviceRecords',
	'mileageEntries'
];
