// Precomputed notification schedule for accountless push. The client runs
// this on every app use and uploads the result (dates + message text only) —
// the server never sees vehicle data. Pure module, unit-tested.

import { computeDueStates, DUE_SOON_DAYS } from './due';
import { lastMileagePointDate, mileagePoints } from './mileage';
import { addDays } from './time';
import type { MaintenanceItem, MileageEntry, ServiceRecord, Vehicle } from './types';

export interface ScheduledNotification {
	date: string; // YYYY-MM-DD — the cron sends it on the first run on/after this date
	title: string;
	body: string;
}

export const MAX_SCHEDULED = 30;
const OVERDUE_REPING_DAYS = 7;

/**
 * Upcoming notification dates for everything we can predict from today's
 * data. Time-based items are exact; mileage-based items use the projected
 * daily rate baked into daysRemaining, so they drift if driving habits
 * change — reopening the app recomputes and re-uploads.
 */
export function computeSchedule(
	vehicles: Vehicle[],
	items: MaintenanceItem[],
	records: ServiceRecord[],
	entries: MileageEntry[],
	reminderDays: number,
	today: string
): ScheduledNotification[] {
	const out: ScheduledNotification[] = [];

	for (const vehicle of vehicles.filter((v) => !v.deleted)) {
		const vItems = items.filter((i) => i.vehicleId === vehicle.id);
		const vRecords = records.filter((r) => r.vehicleId === vehicle.id);
		const vEntries = entries.filter((e) => e.vehicleId === vehicle.id);
		const states = computeDueStates(vItems, vRecords, vEntries, vehicle.odometerUnit, today);

		for (const s of states) {
			const name = vItems.find((i) => i.id === s.itemId)?.name ?? 'Maintenance';
			if (s.status === 'overdue') {
				out.push({
					date: addDays(today, OVERDUE_REPING_DAYS),
					title: 'Maintenance overdue',
					body: `${vehicle.name}: ${name} is still overdue`
				});
				continue;
			}
			if (s.daysRemaining == null) continue; // mileage-only item without a rate — unpredictable
			if (s.status === 'ok') {
				out.push({
					date: addDays(today, Math.max(s.daysRemaining - DUE_SOON_DAYS, 1)),
					title: 'Maintenance reminder',
					body: `${vehicle.name}: ${name} is due soon`
				});
			}
			out.push({
				date: addDays(today, s.daysRemaining + 1),
				title: 'Maintenance overdue',
				body: `${vehicle.name}: ${name} is now overdue`
			});
		}

		const lastPoint = lastMileagePointDate(mileagePoints(vRecords, vEntries));
		const next = lastPoint ? addDays(lastPoint, reminderDays) : addDays(today, reminderDays);
		out.push({
			date: next <= today ? addDays(today, 1) : next,
			title: 'Mileage check-in',
			body: `Time to log the current mileage of ${vehicle.name}`
		});
	}

	return out.sort((a, b) => (a.date < b.date ? -1 : 1)).slice(0, MAX_SCHEDULED);
}
