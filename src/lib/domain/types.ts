// Pure domain types. This module (and everything in src/lib/domain/) must not
// import from the DOM, Dexie, or Supabase — it is shared with the server cron.

export type OdometerUnit = 'km' | 'mi';

/** Stamps present on every persisted row; written exclusively by db/repo.ts. */
export interface SyncStamps {
	id: string;
	createdAt: string; // ISO timestamp
	updatedAt: string; // ISO timestamp, client clock — LWW comparator
	deleted: 0 | 1; // tombstone (Dexie indexes need numbers, not booleans)
	pendingSync: 0 | 1;
}

export interface Vehicle extends SyncStamps {
	name: string;
	make?: string;
	model?: string;
	year?: number;
	plate?: string;
	/** Device-local in MVP — never synced. */
	photo?: Blob;
	odometerUnit: OdometerUnit;
}

export interface MaintenanceItem extends SyncStamps {
	vehicleId: string;
	name: string;
	/** At least one of intervalKm / intervalMonths must be set; both = whichever comes first. */
	intervalKm: number | null;
	intervalMonths: number | null;
	/** "When was this last done" seed; superseded by any service record for this item. */
	anchorDate: string | null; // YYYY-MM-DD
	anchorOdometer: number | null;
	/** Provenance hook for future fetched/model-specific schedules. */
	templateId: string | null;
	notes?: string;
}

export interface ServiceRecord extends SyncStamps {
	vehicleId: string;
	/** Null for one-off services that aren't tied to a maintenance item. */
	itemId: string | null;
	/** Free-text description for one-off services (itemId null). */
	title: string | null;
	date: string; // YYYY-MM-DD
	odometer: number;
	cost: number | null;
	currency: string | null;
	notes?: string;
	/** Always empty in MVP — future invoice photos / AI extraction. */
	attachments: string[];
}

export interface MileageEntry extends SyncStamps {
	vehicleId: string;
	odometer: number;
	recordedAt: string; // ISO timestamp
}

export type DueStatus = 'ok' | 'due_soon' | 'overdue';

export interface ItemDueState {
	itemId: string;
	vehicleId: string;
	status: DueStatus;
	/** Calendar due date from the time interval, if any. */
	dueDate: string | null; // YYYY-MM-DD
	/** Odometer reading at which the mileage interval is due, if any. */
	dueOdometer: number | null;
	kmRemaining: number | null;
	/** Days until due — min of the calendar component and the projected mileage component. */
	daysRemaining: number | null;
	/** Projected calendar date for the mileage component (needs a daily driving rate). */
	projectedMileageDueDate: string | null; // YYYY-MM-DD
}

/** A dated odometer reading — unified view over mileage entries and service records. */
export interface MileagePoint {
	odometer: number;
	date: string; // YYYY-MM-DD
}
