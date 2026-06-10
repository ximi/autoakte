import type { ItemDueState, OdometerUnit } from '$lib/domain/types';
import { tr, type Locale } from '$lib/i18n/dict';

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
 * "in 23 days", "in 4,800 km · ~12 d". Pure — the server passes the
 * subscription's locale, the client passes i18n.locale.
 */
export function dueLabel(s: ItemDueState, unit: OdometerUnit, locale: Locale = 'en'): string {
	if (s.status === 'overdue') {
		if (s.kmRemaining != null && s.kmRemaining <= 0) {
			return tr(locale, 'distance_over', { d: formatDistance(-s.kmRemaining, unit) });
		}
		if (s.daysRemaining != null && s.daysRemaining < 0) {
			return s.daysRemaining === -1
				? tr(locale, 'days_over_one')
				: tr(locale, 'days_over', { n: -s.daysRemaining });
		}
		return tr(locale, 'n_overdue', { n: '' }).trim();
	}
	const parts: string[] = [];
	if (s.kmRemaining != null) {
		parts.push(tr(locale, 'in_distance', { d: formatDistance(s.kmRemaining, unit) }));
	}
	if (s.daysRemaining != null) {
		if (s.daysRemaining === 0) parts.push(tr(locale, 'due_today'));
		else if (parts.length === 0) {
			parts.push(
				s.daysRemaining === 1
					? tr(locale, 'in_days_one')
					: tr(locale, 'in_days', { n: s.daysRemaining })
			);
		} else parts.push(tr(locale, 'approx_days', { n: s.daysRemaining }));
	}
	return parts.join(' · ') || tr(locale, 'no_schedule');
}
