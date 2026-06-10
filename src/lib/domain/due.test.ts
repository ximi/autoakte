import { describe, expect, it } from 'vitest';
import { computeDueStates, worstStatus } from './due';
import { makeEntry, makeItem, makeRecord } from './fixtures';

const TODAY = '2026-06-10';

function single(
	item = makeItem(),
	records: ReturnType<typeof makeRecord>[] = [],
	entries: ReturnType<typeof makeEntry>[] = [],
	unit: 'km' | 'mi' = 'km'
) {
	const states = computeDueStates([item], records, entries, unit, TODAY);
	expect(states).toHaveLength(1);
	return states[0];
}

describe('time-based scheduling', () => {
	const item = (anchorDate: string) =>
		makeItem({ id: 'i1', intervalKm: null, intervalMonths: 12, anchorDate });

	it('is ok well before the due date', () => {
		const s = single(item('2026-01-01'));
		expect(s.status).toBe('ok');
		expect(s.dueDate).toBe('2027-01-01');
		expect(s.daysRemaining).toBe(205);
	});

	it('becomes due_soon exactly 14 days out', () => {
		const s = single(item('2025-06-24'));
		expect(s.dueDate).toBe('2026-06-24');
		expect(s.daysRemaining).toBe(14);
		expect(s.status).toBe('due_soon');
	});

	it('stays ok 15 days out', () => {
		expect(single(item('2025-06-25')).status).toBe('ok');
	});

	it('is due_soon on the due date itself', () => {
		const s = single(item('2025-06-10'));
		expect(s.daysRemaining).toBe(0);
		expect(s.status).toBe('due_soon');
	});

	it('is overdue the day after the due date', () => {
		const s = single(item('2025-06-09'));
		expect(s.daysRemaining).toBe(-1);
		expect(s.status).toBe('overdue');
	});
});

describe('mileage-based scheduling', () => {
	const item = (anchorOdometer: number, intervalKm = 15000) =>
		makeItem({ id: 'i1', intervalKm, intervalMonths: null, anchorOdometer });
	const at = (odometer: number) => [
		makeEntry({ odometer, recordedAt: '2026-06-09T00:00:00.000Z' })
	];

	it('is ok far from the due odometer', () => {
		const s = single(item(50000), [], at(55000));
		expect(s.status).toBe('ok');
		expect(s.dueOdometer).toBe(65000);
		expect(s.kmRemaining).toBe(10000);
	});

	it('becomes due_soon at 10% of the interval remaining', () => {
		const s = single(item(50000), [], at(63500));
		expect(s.kmRemaining).toBe(1500);
		expect(s.status).toBe('due_soon');
	});

	it('uses the 500 km floor for small intervals', () => {
		const small = makeItem({
			id: 'i1',
			intervalKm: 3000,
			intervalMonths: null,
			anchorOdometer: 50000
		});
		expect(single(small, [], at(52500)).status).toBe('due_soon');
		expect(single(small, [], at(52400)).status).toBe('ok');
	});

	it('uses the 300 mi floor for mi vehicles', () => {
		const small = makeItem({
			id: 'i1',
			intervalKm: 2000,
			intervalMonths: null,
			anchorOdometer: 10000
		});
		expect(single(small, [], at(11700), 'mi').status).toBe('due_soon');
		expect(single(small, [], at(11650), 'mi').status).toBe('ok');
	});

	it('is overdue at and past the due odometer', () => {
		expect(single(item(50000), [], at(65000)).status).toBe('overdue');
		expect(single(item(50000), [], at(66000)).status).toBe('overdue');
		expect(single(item(50000), [], at(66000)).kmRemaining).toBe(-1000);
	});

	it('skips the mileage component without any odometer reading', () => {
		const s = single(
			makeItem({ id: 'i1', intervalKm: 15000, intervalMonths: null, anchorOdometer: null })
		);
		expect(s.status).toBe('ok');
		expect(s.dueOdometer).toBeNull();
		expect(s.kmRemaining).toBeNull();
	});
});

describe('combined intervals (whichever comes first)', () => {
	it('takes the worse of the two components', () => {
		const item = makeItem({
			id: 'i1',
			intervalKm: 15000,
			intervalMonths: 12,
			anchorDate: '2026-01-01',
			anchorOdometer: 50000
		});
		const s = single(
			item,
			[],
			[makeEntry({ odometer: 65500, recordedAt: '2026-06-09T00:00:00.000Z' })]
		);
		expect(s.status).toBe('overdue');
		expect(s.dueDate).toBe('2027-01-01');
	});
});

describe('anchor resolution', () => {
	it('prefers the latest service record over item anchors', () => {
		const item = makeItem({
			id: 'i1',
			intervalKm: null,
			intervalMonths: 12,
			anchorDate: '2024-01-01'
		});
		const records = [
			makeRecord({ itemId: 'i1', date: '2025-09-01', odometer: 48000 }),
			makeRecord({ itemId: 'i1', date: '2026-03-01', odometer: 55000 })
		];
		const s = single(item, records);
		expect(s.dueDate).toBe('2027-03-01');
		expect(s.status).toBe('ok');
	});

	it('breaks same-date ties by higher odometer', () => {
		const item = makeItem({ id: 'i1', intervalKm: 10000, intervalMonths: null });
		const records = [
			makeRecord({ itemId: 'i1', date: '2026-03-01', odometer: 55000 }),
			makeRecord({ itemId: 'i1', date: '2026-03-01', odometer: 56000 })
		];
		const s = single(item, records, [
			makeEntry({ odometer: 57000, recordedAt: '2026-06-01T00:00:00.000Z' })
		]);
		expect(s.dueOdometer).toBe(66000);
	});

	it('ignores records of other items and deleted records', () => {
		const item = makeItem({
			id: 'i1',
			intervalKm: null,
			intervalMonths: 12,
			anchorDate: '2025-01-01'
		});
		const records = [
			makeRecord({ itemId: 'other', date: '2026-05-01' }),
			makeRecord({ itemId: 'i1', date: '2026-05-01', deleted: 1 })
		];
		expect(single(item, records).dueDate).toBe('2026-01-01');
	});

	it('treats a never-done item as done at creation (no day-one nagging)', () => {
		const item = makeItem({
			id: 'i1',
			createdAt: '2026-06-01T00:00:00.000Z',
			intervalKm: null,
			intervalMonths: 12,
			anchorDate: null
		});
		const s = single(item);
		expect(s.dueDate).toBe('2027-06-01');
		expect(s.status).toBe('ok');
	});

	it('logging a service resets an overdue item', () => {
		const item = makeItem({
			id: 'i1',
			intervalKm: null,
			intervalMonths: 12,
			anchorDate: '2025-01-01'
		});
		expect(single(item).status).toBe('overdue');
		const fixed = single(item, [makeRecord({ itemId: 'i1', date: '2026-06-09', odometer: 60000 })]);
		expect(fixed.status).toBe('ok');
	});
});

describe('projected mileage due date', () => {
	it('projects from the estimated daily rate', () => {
		const item = makeItem({
			id: 'i1',
			intervalKm: 15000,
			intervalMonths: null,
			anchorOdometer: 50000
		});
		const entries = [
			makeEntry({ odometer: 56000, recordedAt: '2026-04-01T00:00:00.000Z' }),
			makeEntry({ odometer: 59000, recordedAt: '2026-06-10T00:00:00.000Z' })
		];
		const s = single(item, [], entries);
		expect(s.kmRemaining).toBe(6000);
		// rate ≈ 3000 km / 70 d ≈ 42.86 km/d → ceil(6000 / 42.86) = 140 days
		expect(s.projectedMileageDueDate).toBe('2026-10-28');
		expect(s.daysRemaining).toBe(140);
	});

	it('lets a near mileage projection tighten daysRemaining below the calendar component', () => {
		const item = makeItem({
			id: 'i1',
			intervalKm: 15000,
			intervalMonths: 12,
			anchorDate: '2026-06-01',
			anchorOdometer: 50000
		});
		const entries = [
			makeEntry({ odometer: 60000, recordedAt: '2026-03-12T00:00:00.000Z' }),
			makeEntry({ odometer: 64000, recordedAt: '2026-06-10T00:00:00.000Z' })
		];
		const s = single(item, [], entries);
		// calendar: due 2027-06-01 (356 d); mileage: 1000 km left at ~44.4 km/d → 23 d
		expect(s.daysRemaining).toBe(23);
		expect(s.status).toBe('due_soon');
	});

	it('has no projection without a rate', () => {
		const item = makeItem({
			id: 'i1',
			intervalKm: 15000,
			intervalMonths: null,
			anchorOdometer: 50000
		});
		const s = single(
			item,
			[],
			[makeEntry({ odometer: 55000, recordedAt: '2026-06-01T00:00:00.000Z' })]
		);
		expect(s.projectedMileageDueDate).toBeNull();
		expect(s.daysRemaining).toBeNull();
	});
});

describe('computeDueStates housekeeping', () => {
	it('excludes deleted items', () => {
		const states = computeDueStates([makeItem({ deleted: 1 })], [], [], 'km', TODAY);
		expect(states).toHaveLength(0);
	});

	it('worstStatus aggregates across items', () => {
		const ok = makeItem({
			id: 'a',
			intervalKm: null,
			intervalMonths: 12,
			anchorDate: '2026-06-01'
		});
		const overdue = makeItem({
			id: 'b',
			intervalKm: null,
			intervalMonths: 12,
			anchorDate: '2025-01-01'
		});
		const states = computeDueStates([ok, overdue], [], [], 'km', TODAY);
		expect(worstStatus(states)).toBe('overdue');
		expect(worstStatus([])).toBe('ok');
	});
});
