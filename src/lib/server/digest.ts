// Pure digest/state-key helpers for the reminder cron — no env or IO imports
// so they stay unit-testable.

import type { ItemDueState, OdometerUnit } from '$lib/domain/types';
import { dueLabel } from '$lib/format';

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
	mileageCheckDue: boolean
): { title: string; body: string } | null {
	const lines: string[] = [];
	for (const v of attention) {
		if (v.items.length === 0) continue;
		const parts = v.items.map(({ name, state }) =>
			state.status === 'overdue'
				? `${name} overdue (${dueLabel(state, v.unit)})`
				: `${name} due ${dueLabel(state, v.unit)}`
		);
		lines.push(`${v.vehicleName}: ${parts.join(' · ')}`);
	}
	if (mileageCheckDue) lines.push('Time to log your current mileage.');
	if (lines.length === 0) return null;
	const overdue = attention.some((v) => v.items.some((i) => i.state.status === 'overdue'));
	return {
		title: overdue ? 'Maintenance overdue' : 'Maintenance reminder',
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
