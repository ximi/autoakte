import type { ItemDueState, OdometerUnit } from '$lib/domain/types';

export function formatDistance(n: number, unit: OdometerUnit): string {
	return `${Math.round(n).toLocaleString()} ${unit}`;
}

export function formatDate(date: string): string {
	return new Date(`${date.slice(0, 10)}T12:00:00`).toLocaleDateString(undefined, {
		day: 'numeric',
		month: 'short',
		year: 'numeric'
	});
}

/**
 * Short human label for an item's due state, e.g. "1,200 km over",
 * "in 23 days", "in 4,800 km · ~12 Oct".
 */
export function dueLabel(s: ItemDueState, unit: OdometerUnit): string {
	if (s.status === 'overdue') {
		if (s.kmRemaining != null && s.kmRemaining <= 0) {
			return `${formatDistance(-s.kmRemaining, unit)} over`;
		}
		if (s.daysRemaining != null && s.daysRemaining < 0) {
			return `${-s.daysRemaining} ${s.daysRemaining === -1 ? 'day' : 'days'} over`;
		}
		return 'overdue';
	}
	const parts: string[] = [];
	if (s.kmRemaining != null) parts.push(`in ${formatDistance(s.kmRemaining, unit)}`);
	if (s.daysRemaining != null) {
		if (s.daysRemaining === 0) parts.push('due today');
		else if (parts.length === 0)
			parts.push(`in ${s.daysRemaining} ${s.daysRemaining === 1 ? 'day' : 'days'}`);
		else parts.push(`~${s.daysRemaining} d`);
	}
	return parts.join(' · ') || 'no schedule';
}
