// Pure digest/state-key helpers for the reminder cron — no env or IO imports
// so they stay unit-testable.

import type { ItemDueState, OdometerUnit } from '$lib/domain/types';
import { dueLabel } from '$lib/format';
import { tr, type Locale } from '$lib/i18n/dict';

export interface VehicleAttention {
	vehicleName: string;
	unit: OdometerUnit;
	items: { name: string; state: ItemDueState }[];
}

/**
 * One push payload summarising everything that needs attention, or null when
 * there is nothing to say (never send "all good" pushes).
 */
export function buildDigest(
	attention: VehicleAttention[],
	mileageCheckDue: boolean,
	locale: Locale = 'en'
): { title: string; body: string } | null {
	const lines: string[] = [];
	for (const v of attention) {
		if (v.items.length === 0) continue;
		const parts = v.items.map(({ name, state }) =>
			state.status === 'overdue'
				? tr(locale, 'digest_overdue', { item: name, label: dueLabel(state, v.unit, locale) })
				: tr(locale, 'digest_due', { item: name, label: dueLabel(state, v.unit, locale) })
		);
		lines.push(`${v.vehicleName}: ${parts.join(' · ')}`);
	}
	if (mileageCheckDue) lines.push(tr(locale, 'digest_log_mileage'));
	if (lines.length === 0) return null;
	const overdue = attention.some((v) => v.items.some((i) => i.state.status === 'overdue'));
	return {
		title: tr(locale, overdue ? 'notif_overdue_title' : 'notif_reminder_title'),
		body: lines.join('\n')
	};
}

/**
 * Canonical key of the current reminder state; the cron only re-sends when it
 * changes (or as a weekly re-ping while something is overdue).
 */
export function stateKey(attention: VehicleAttention[], mileageCheckDue: boolean): string {
	const parts = attention
		.flatMap((v) => v.items.map((i) => `${i.state.itemId}:${i.state.status}`))
		.sort();
	if (mileageCheckDue) parts.push('mileage-check');
	return parts.join('|');
}
