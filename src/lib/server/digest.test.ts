import { describe, expect, it } from 'vitest';
import { buildDigest, stateKey, type VehicleAttention } from './digest';
import type { ItemDueState } from '$lib/domain/types';

function state(over: Partial<ItemDueState>): ItemDueState {
	return {
		itemId: 'i1',
		vehicleId: 'v1',
		status: 'due_soon',
		dueDate: null,
		dueOdometer: null,
		kmRemaining: null,
		daysRemaining: 10,
		projectedMileageDueDate: null,
		...over
	};
}

const golfOverdue: VehicleAttention = {
	vehicleName: 'Golf VII',
	unit: 'km',
	items: [
		{ name: 'Oil & filter change', state: state({ status: 'overdue', kmRemaining: -600 }) },
		{ name: 'Inspection (TÜV/MOT)', state: state({ itemId: 'i2', daysRemaining: 10 }) }
	]
};

describe('buildDigest', () => {
	it('summarises overdue and due-soon items per vehicle', () => {
		const digest = buildDigest([golfOverdue], false);
		expect(digest).not.toBeNull();
		expect(digest!.title).toBe('Maintenance overdue');
		expect(digest!.body).toContain('Golf VII:');
		expect(digest!.body).toContain('Oil & filter change overdue (600 km over)');
		expect(digest!.body).toContain('Inspection (TÜV/MOT) due in 10 days');
	});

	it('is null when nothing needs attention', () => {
		expect(buildDigest([{ vehicleName: 'Golf', unit: 'km', items: [] }], false)).toBeNull();
	});

	it('sends the mileage prompt alone when only that is due', () => {
		const digest = buildDigest([{ vehicleName: 'Golf', unit: 'km', items: [] }], true);
		expect(digest!.title).toBe('Maintenance reminder');
		expect(digest!.body).toBe('Time to log your current mileage.');
	});
});

describe('stateKey', () => {
	it('is stable under item order and changes with status', () => {
		const a: VehicleAttention = {
			vehicleName: 'A',
			unit: 'km',
			items: [
				{ name: 'x', state: state({ itemId: 'i1' }) },
				{ name: 'y', state: state({ itemId: 'i2' }) }
			]
		};
		const b: VehicleAttention = {
			vehicleName: 'A',
			unit: 'km',
			items: [
				{ name: 'y', state: state({ itemId: 'i2' }) },
				{ name: 'x', state: state({ itemId: 'i1' }) }
			]
		};
		expect(stateKey([a], false)).toBe(stateKey([b], false));
		const escalated: VehicleAttention = {
			...a,
			items: [
				{ name: 'x', state: state({ itemId: 'i1', status: 'overdue' }) },
				{ name: 'y', state: state({ itemId: 'i2' }) }
			]
		};
		expect(stateKey([escalated], false)).not.toBe(stateKey([a], false));
		expect(stateKey([a], true)).not.toBe(stateKey([a], false));
	});
});
