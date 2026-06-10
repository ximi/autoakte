export interface MaintenanceTemplate {
	templateId: string;
	name: string;
	intervalKm: number | null;
	intervalMonths: number | null;
	/** Provenance — 'builtin' now; fetched/model-specific schedules later. */
	source: 'builtin';
}

export const BUILTIN_TEMPLATES: MaintenanceTemplate[] = [
	{
		templateId: 'oil-filter',
		name: 'Oil & filter change',
		intervalKm: 15000,
		intervalMonths: 12,
		source: 'builtin'
	},
	{
		templateId: 'tyre-rotation',
		name: 'Tyre rotation',
		intervalKm: 10000,
		intervalMonths: null,
		source: 'builtin'
	},
	{
		templateId: 'brake-fluid',
		name: 'Brake fluid',
		intervalKm: null,
		intervalMonths: 24,
		source: 'builtin'
	},
	{
		templateId: 'inspection',
		name: 'Inspection (TÜV/MOT)',
		intervalKm: null,
		intervalMonths: 24,
		source: 'builtin'
	},
	{
		templateId: 'air-filter',
		name: 'Air filter',
		intervalKm: 30000,
		intervalMonths: 36,
		source: 'builtin'
	},
	{
		templateId: 'cabin-filter',
		name: 'Cabin filter',
		intervalKm: 15000,
		intervalMonths: 12,
		source: 'builtin'
	},
	{
		templateId: 'coolant',
		name: 'Coolant',
		intervalKm: 60000,
		intervalMonths: 60,
		source: 'builtin'
	},
	{
		templateId: 'spark-plugs',
		name: 'Spark plugs',
		intervalKm: 60000,
		intervalMonths: null,
		source: 'builtin'
	},
	{
		templateId: 'battery-check',
		name: 'Battery check',
		intervalKm: null,
		intervalMonths: 12,
		source: 'builtin'
	},
	{
		templateId: 'wiper-blades',
		name: 'Wiper blades',
		intervalKm: null,
		intervalMonths: 12,
		source: 'builtin'
	}
];
