// Date helpers over YYYY-MM-DD strings. All arithmetic happens in UTC so results
// are independent of the device timezone; a "date" here is a calendar day.

const DAY_MS = 86_400_000;

export function toDateOnly(isoOrDate: string): string {
	return isoOrDate.slice(0, 10);
}

function parseUTC(date: string): number {
	const [y, m, d] = date.slice(0, 10).split('-').map(Number);
	return Date.UTC(y, m - 1, d);
}

function format(ms: number): string {
	return new Date(ms).toISOString().slice(0, 10);
}

/** Calendar days from `from` to `to` (positive when `to` is later). */
export function diffDays(from: string, to: string): number {
	return Math.round((parseUTC(to) - parseUTC(from)) / DAY_MS);
}

/** Add calendar months, clamping to the last day of the target month (Jan 31 + 1mo = Feb 28). */
export function addMonths(date: string, months: number): string {
	const [y, m, d] = date.slice(0, 10).split('-').map(Number);
	const targetMonth = m - 1 + months;
	const lastDay = new Date(Date.UTC(y, targetMonth + 1, 0)).getUTCDate();
	return format(Date.UTC(y, targetMonth, Math.min(d, lastDay)));
}

export function addDays(date: string, days: number): string {
	return format(parseUTC(date) + days * DAY_MS);
}
