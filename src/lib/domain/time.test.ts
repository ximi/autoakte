import { describe, expect, it } from 'vitest';
import { addDays, addMonths, diffDays, toDateOnly } from './time';

describe('diffDays', () => {
	it('counts forward days', () => {
		expect(diffDays('2026-06-01', '2026-06-15')).toBe(14);
	});

	it('is negative when the target is in the past', () => {
		expect(diffDays('2026-06-15', '2026-06-01')).toBe(-14);
	});

	it('is zero for the same day', () => {
		expect(diffDays('2026-06-10', '2026-06-10')).toBe(0);
	});

	it('crosses month and year boundaries', () => {
		expect(diffDays('2025-12-31', '2026-01-01')).toBe(1);
		expect(diffDays('2026-02-28', '2026-03-01')).toBe(1);
	});

	it('accepts full ISO timestamps', () => {
		expect(diffDays('2026-06-01T23:59:00.000Z', '2026-06-03T00:01:00.000Z')).toBe(2);
	});
});

describe('addMonths', () => {
	it('adds within a year', () => {
		expect(addMonths('2026-03-15', 2)).toBe('2026-05-15');
	});

	it('rolls over the year', () => {
		expect(addMonths('2026-11-20', 3)).toBe('2027-02-20');
	});

	it('clamps to the last day of shorter months', () => {
		expect(addMonths('2026-01-31', 1)).toBe('2026-02-28');
		expect(addMonths('2024-01-31', 1)).toBe('2024-02-29');
		expect(addMonths('2026-08-31', 1)).toBe('2026-09-30');
	});

	it('handles 12 and 24 month intervals', () => {
		expect(addMonths('2026-06-10', 12)).toBe('2027-06-10');
		expect(addMonths('2026-06-10', 24)).toBe('2028-06-10');
	});
});

describe('addDays', () => {
	it('adds days across boundaries', () => {
		expect(addDays('2026-06-28', 5)).toBe('2026-07-03');
		expect(addDays('2026-12-30', 3)).toBe('2027-01-02');
	});
});

describe('toDateOnly', () => {
	it('truncates ISO timestamps', () => {
		expect(toDateOnly('2026-06-10T08:30:00.000Z')).toBe('2026-06-10');
		expect(toDateOnly('2026-06-10')).toBe('2026-06-10');
	});
});
