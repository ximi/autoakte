import type {
	DueStatus,
	ItemDueState,
	MaintenanceItem,
	MileageEntry,
	OdometerUnit,
	ServiceRecord
} from './types';
import { addDays, addMonths, diffDays, toDateOnly } from './time';
import { currentOdometer, estimateDailyRate, mileagePoints } from './mileage';

export const DUE_SOON_DAYS = 14;
const DUE_SOON_DISTANCE_FLOOR = { km: 500, mi: 300 } as const;
const DUE_SOON_INTERVAL_FRACTION = 0.1;

const SEVERITY: Record<DueStatus, number> = { ok: 0, due_soon: 1, overdue: 2 };

function worst(a: DueStatus, b: DueStatus): DueStatus {
	return SEVERITY[a] >= SEVERITY[b] ? a : b;
}

/**
 * The reference point a schedule counts from: the most recent service record
 * for the item, else the item's own anchor fields ("when was this last done"),
 * else the item's creation date (never-done = done-at-creation, so a fresh
 * item doesn't nag on day one).
 */
function resolveAnchor(
	item: MaintenanceItem,
	records: ServiceRecord[]
): { date: string; odometer: number | null } {
	let latest: ServiceRecord | null = null;
	for (const r of records) {
		if (r.deleted || r.itemId !== item.id) continue;
		if (!latest || r.date > latest.date || (r.date === latest.date && r.odometer > latest.odometer)) {
			latest = r;
		}
	}
	if (latest) return { date: latest.date, odometer: latest.odometer };
	return {
		date: item.anchorDate ?? toDateOnly(item.createdAt),
		odometer: item.anchorOdometer
	};
}

/**
 * Due states for all (non-deleted) items of ONE vehicle. Pure — used by both
 * the client UI and the server cron, so behaviour can never diverge.
 */
export function computeDueStates(
	items: MaintenanceItem[],
	records: ServiceRecord[],
	entries: MileageEntry[],
	unit: OdometerUnit,
	today: string
): ItemDueState[] {
	today = toDateOnly(today);
	const points = mileagePoints(records, entries);
	const odo = currentOdometer(points, items);
	const rate = estimateDailyRate(points, today);

	return items
		.filter((item) => !item.deleted)
		.map((item) => {
			const anchor = resolveAnchor(item, records);
			let status: DueStatus = 'ok';
			let dueDate: string | null = null;
			let dueOdometer: number | null = null;
			let kmRemaining: number | null = null;
			let daysRemaining: number | null = null;
			let projectedMileageDueDate: string | null = null;

			if (item.intervalMonths != null) {
				dueDate = addMonths(anchor.date, item.intervalMonths);
				const days = diffDays(today, dueDate);
				daysRemaining = days;
				if (days < 0) status = 'overdue';
				else if (days <= DUE_SOON_DAYS) status = 'due_soon';
			}

			if (item.intervalKm != null && anchor.odometer != null && odo != null) {
				dueOdometer = anchor.odometer + item.intervalKm;
				kmRemaining = dueOdometer - odo;
				const threshold = Math.max(
					DUE_SOON_DISTANCE_FLOOR[unit],
					item.intervalKm * DUE_SOON_INTERVAL_FRACTION
				);
				let mileageStatus: DueStatus = 'ok';
				if (kmRemaining <= 0) mileageStatus = 'overdue';
				else if (kmRemaining <= threshold) mileageStatus = 'due_soon';
				status = worst(status, mileageStatus);

				if (rate != null && kmRemaining > 0) {
					const projectedDays = Math.ceil(kmRemaining / rate);
					projectedMileageDueDate = addDays(today, projectedDays);
					daysRemaining =
						daysRemaining === null ? projectedDays : Math.min(daysRemaining, projectedDays);
				} else if (kmRemaining <= 0) {
					daysRemaining = daysRemaining === null ? 0 : Math.min(daysRemaining, 0);
				}
			}

			return {
				itemId: item.id,
				vehicleId: item.vehicleId,
				status,
				dueDate,
				dueOdometer,
				kmRemaining,
				daysRemaining,
				projectedMileageDueDate
			};
		});
}

/** Worst status across a set of due states — drives the per-vehicle badge. */
export function worstStatus(states: ItemDueState[]): DueStatus {
	return states.reduce<DueStatus>((acc, s) => worst(acc, s.status), 'ok');
}
