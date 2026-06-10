import { describe, expect, it } from 'vitest';
import {
	currentOdometer,
	estimateDailyRate,
	lastMileagePointDate,
	mileageCheckDue,
	mileagePoints
} from './mileage';
import { makeEntry, makeItem, makeRecord } from './fixtures';

describe('mileagePoints', () => {
	it('merges records and entries sorted by date', () => {
		const points = mileagePoints(
			[makeRecord({ date: '2026-03-01', odometer: 52000 })],
			[
				makeEntry({ recordedAt: '2026-04-01T10:00:00.000Z', odometer: 53000 }),
				makeEntry({ recordedAt: '2026-02-01T10:00:00.000Z', odometer: 51000 })
			]
		);
		expect(points.map((p) => p.odometer)).toEqual([51000, 52000, 53000]);
	});

	it('excludes tombstoned rows', () => {
		const points = mileagePoints(
			[makeRecord({ deleted: 1 })],
			[makeEntry({ deleted: 1 }), makeEntry({ odometer: 60000 })]
		);
		expect(points).toHaveLength(1);
		expect(points[0].odometer).toBe(60000);
	});
});

describe('currentOdometer', () => {
	it('returns the max across points and item anchors', () => {
		const points = mileagePoints([], [makeEntry({ odometer: 50000 })]);
		const items = [makeItem({ anchorOdometer: 51000 })];
		expect(currentOdometer(points, items)).toBe(51000);
	});

	it('ignores anchors on deleted items', () => {
		const points = mileagePoints([], [makeEntry({ odometer: 50000 })]);
		const items = [makeItem({ anchorOdometer: 51000, deleted: 1 })];
		expect(currentOdometer(points, items)).toBe(50000);
	});

	it('is null with no data at all', () => {
		expect(currentOdometer([], [makeItem()])).toBeNull();
	});
});

describe('estimateDailyRate', () => {
	const today = '2026-06-10';

	it('uses the slope over the last 90 days', () => {
		const points = mileagePoints(
			[],
			[
				makeEntry({ recordedAt: '2026-05-01T00:00:00.000Z', odometer: 50000 }),
				makeEntry({ recordedAt: '2026-05-31T00:00:00.000Z', odometer: 51200 })
			]
		);
		expect(estimateDailyRate(points, today)).toBe(40);
	});

	it('ignores old points when the recent window has a valid slope', () => {
		const points = mileagePoints(
			[],
			[
				makeEntry({ recordedAt: '2025-01-01T00:00:00.000Z', odometer: 10000 }),
				makeEntry({ recordedAt: '2026-05-01T00:00:00.000Z', odometer: 50000 }),
				makeEntry({ recordedAt: '2026-05-31T00:00:00.000Z', odometer: 51200 })
			]
		);
		expect(estimateDailyRate(points, today)).toBe(40);
	});

	it('falls back to the lifetime slope when recent points span < 7 days', () => {
		const points = mileagePoints(
			[],
			[
				makeEntry({ recordedAt: '2025-06-10T00:00:00.000Z', odometer: 40000 }),
				makeEntry({ recordedAt: '2026-06-09T00:00:00.000Z', odometer: 47300 }),
				makeEntry({ recordedAt: '2026-06-10T00:00:00.000Z', odometer: 47300 })
			]
		);
		expect(estimateDailyRate(points, today)).toBe(20);
	});

	it('is null with a single point', () => {
		const points = mileagePoints([], [makeEntry()]);
		expect(estimateDailyRate(points, today)).toBeNull();
	});

	it('is null when the odometer never increases', () => {
		const points = mileagePoints(
			[],
			[
				makeEntry({ recordedAt: '2026-04-01T00:00:00.000Z', odometer: 50000 }),
				makeEntry({ recordedAt: '2026-05-01T00:00:00.000Z', odometer: 50000 })
			]
		);
		expect(estimateDailyRate(points, today)).toBeNull();
	});
});

describe('mileageCheckDue', () => {
	const today = '2026-06-10';

	it('is due when there are no points at all', () => {
		expect(mileageCheckDue([], today, 14)).toBe(true);
	});

	it('is not due right after an entry', () => {
		const points = mileagePoints([], [makeEntry({ recordedAt: '2026-06-08T00:00:00.000Z' })]);
		expect(mileageCheckDue(points, today, 14)).toBe(false);
	});

	it('becomes due exactly at the reminder interval', () => {
		const points = mileagePoints([], [makeEntry({ recordedAt: '2026-05-27T00:00:00.000Z' })]);
		expect(mileageCheckDue(points, today, 14)).toBe(true);
	});

	it('counts service records as mileage points', () => {
		const points = mileagePoints([makeRecord({ date: '2026-06-09' })], []);
		expect(lastMileagePointDate(points)).toBe('2026-06-09');
		expect(mileageCheckDue(points, today, 14)).toBe(false);
	});
});
