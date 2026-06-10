import type { MaintenanceItem, MileageEntry, MileagePoint, ServiceRecord } from './types';
import { diffDays, toDateOnly } from './time';

const RATE_WINDOW_DAYS = 90;
const MIN_SPAN_DAYS = 7;

/** Unified, deletion-filtered odometer readings for one vehicle, sorted by date. */
export function mileagePoints(records: ServiceRecord[], entries: MileageEntry[]): MileagePoint[] {
	const points: MileagePoint[] = [];
	for (const r of records) {
		if (!r.deleted) points.push({ odometer: r.odometer, date: toDateOnly(r.date) });
	}
	for (const e of entries) {
		if (!e.deleted) points.push({ odometer: e.odometer, date: toDateOnly(e.recordedAt) });
	}
	return points.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
}

/**
 * Best known current odometer: the max reading across mileage entries, service
 * records and item anchors. Derived, never stored — cannot drift out of sync.
 */
export function currentOdometer(points: MileagePoint[], items: MaintenanceItem[]): number | null {
	let max: number | null = null;
	for (const p of points) {
		if (max === null || p.odometer > max) max = p.odometer;
	}
	for (const item of items) {
		if (item.deleted) continue;
		if (item.anchorOdometer != null && (max === null || item.anchorOdometer > max)) {
			max = item.anchorOdometer;
		}
	}
	return max;
}

/**
 * Estimated distance driven per day. Prefers the slope over the last 90 days
 * (needs ≥2 points ≥7 days apart); falls back to the lifetime slope; else null.
 */
export function estimateDailyRate(points: MileagePoint[], today: string): number | null {
	const recent = points.filter((p) => diffDays(p.date, today) <= RATE_WINDOW_DAYS);
	return slope(recent) ?? slope(points);
}

function slope(points: MileagePoint[]): number | null {
	if (points.length < 2) return null;
	const first = points[0];
	const last = points[points.length - 1];
	const span = diffDays(first.date, last.date);
	if (span < MIN_SPAN_DAYS) return null;
	const distance = last.odometer - first.odometer;
	if (distance <= 0) return null;
	return distance / span;
}

/** The latest dated odometer reading — basis for the "log your mileage" reminder. */
export function lastMileagePointDate(points: MileagePoint[]): string | null {
	return points.length ? points[points.length - 1].date : null;
}

export function mileageCheckDue(
	points: MileagePoint[],
	today: string,
	reminderDays: number
): boolean {
	const last = lastMileagePointDate(points);
	if (last === null) return true;
	return diffDays(last, today) >= reminderDays;
}
