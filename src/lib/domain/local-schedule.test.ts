import { describe, expect, it } from 'vitest';
import { computeSchedule, MAX_SCHEDULED } from './local-schedule';
import { makeEntry, makeItem, makeRecord, makeVehicle } from './fixtures';

const TODAY = '2026-06-10';

function schedule(over: {
	items?: ReturnType<typeof makeItem>[];
	records?: ReturnType<typeof makeRecord>[];
	entries?: ReturnType<typeof makeEntry>[];
	reminderDays?: number;
}) {
	const vehicle = makeVehicle({ id: 'v1', name: 'Golf' });
	return computeSchedule(
		[vehicle],
		(over.items ?? []).map((i) => ({ ...i, vehicleId: 'v1' })),
		(over.records ?? []).map((r) => ({ ...r, vehicleId: 'v1' })),
		(over.entries ?? []).map((e) => ({ ...e, vehicleId: 'v1' })),
		over.reminderDays ?? 14,
		TODAY
	);
}

describe('computeSchedule', () => {
	it('schedules due-soon and overdue transitions for an ok time-based item', () => {
		// anchored 2026-01-01 + 12mo → due 2027-01-01 → 205 days remaining
		const items = [
			makeItem({ id: 'i1', intervalKm: null, intervalMonths: 12, anchorDate: '2026-01-01' })
		];
		const s = schedule({ items });
		const dueSoon = s.find((e) => e.title === 'Maintenance reminder');
		const overdue = s.find((e) => e.title === 'Maintenance overdue');
		expect(dueSoon?.date).toBe('2026-12-18'); // 205 - 14 days out
		expect(dueSoon?.body).toBe('Golf: Oil & filter change is due soon');
		expect(overdue?.date).toBe('2027-01-02'); // day after the due date
	});

	it('schedules only the overdue transition for an already due-soon item', () => {
		const items = [
			makeItem({ id: 'i1', intervalKm: null, intervalMonths: 12, anchorDate: '2025-06-20' })
		];
		const s = schedule({ items });
		expect(s.filter((e) => e.title === 'Maintenance reminder')).toHaveLength(0);
		const overdue = s.find((e) => e.title === 'Maintenance overdue');
		expect(overdue?.date).toBe('2026-06-21');
	});

	it('schedules a weekly re-ping for an overdue item', () => {
		const items = [
			makeItem({ id: 'i1', intervalKm: null, intervalMonths: 12, anchorDate: '2025-01-01' })
		];
		const s = schedule({ items });
		const reping = s.find((e) => e.title === 'Maintenance overdue');
		expect(reping?.date).toBe('2026-06-17');
		expect(reping?.body).toContain('still overdue');
	});

	it('skips mileage-only items without a driving rate', () => {
		const items = [
			makeItem({ id: 'i1', intervalKm: 15000, intervalMonths: null, anchorOdometer: 50000 })
		];
		const entries = [makeEntry({ odometer: 51000, recordedAt: '2026-06-01T00:00:00.000Z' })];
		const s = schedule({ items, entries });
		expect(s.filter((e) => e.title !== 'Mileage check-in')).toHaveLength(0);
	});

	it('schedules the mileage check-in from the last odometer point', () => {
		const entries = [makeEntry({ recordedAt: '2026-06-04T00:00:00.000Z' })];
		const s = schedule({ entries, reminderDays: 14 });
		const checkin = s.find((e) => e.title === 'Mileage check-in');
		expect(checkin?.date).toBe('2026-06-18');
	});

	it('pushes an overdue mileage check-in to tomorrow, never the past', () => {
		const entries = [makeEntry({ recordedAt: '2026-01-01T00:00:00.000Z' })];
		const s = schedule({ entries });
		expect(s.find((e) => e.title === 'Mileage check-in')?.date).toBe('2026-06-11');
	});

	it('sorts by date and caps the schedule size', () => {
		const items = Array.from({ length: 40 }, (_, n) =>
			makeItem({
				id: `i${n}`,
				intervalKm: null,
				intervalMonths: 12,
				anchorDate: '2026-01-01'
			})
		);
		const s = schedule({ items });
		expect(s.length).toBeLessThanOrEqual(MAX_SCHEDULED);
		const dates = s.map((e) => e.date);
		expect([...dates].sort()).toEqual(dates);
	});

	it('uses service records as the mileage check-in anchor too', () => {
		const records = [makeRecord({ itemId: null, title: 'One-off', date: '2026-06-08' })];
		const s = schedule({ records });
		expect(s.find((e) => e.title === 'Mileage check-in')?.date).toBe('2026-06-22');
	});
});
