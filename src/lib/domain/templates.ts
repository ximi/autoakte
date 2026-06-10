import type { TranslationKey } from '$lib/i18n/dict';

export interface MaintenanceTemplate {
	templateId: string;
	/** i18n key — the picker renders it in the active language, and item
	 * creation stores the resolved string (like any custom item name). */
	nameKey: TranslationKey;
	intervalKm: number | null;
	intervalMonths: number | null;
	/** Provenance — 'builtin' now; fetched/model-specific schedules later. */
	source: 'builtin';
}

export const BUILTIN_TEMPLATES: MaintenanceTemplate[] = [
	{
		templateId: 'oil-filter',
		nameKey: 'tmpl_oil_filter',
		intervalKm: 15000,
		intervalMonths: 12,
		source: 'builtin'
	},
	{
		templateId: 'tyre-rotation',
		nameKey: 'tmpl_tyre_rotation',
		intervalKm: 10000,
		intervalMonths: null,
		source: 'builtin'
	},
	{
		templateId: 'tyres-inspect',
		nameKey: 'tmpl_tyres_inspect',
		intervalKm: null,
		intervalMonths: 6,
		source: 'builtin'
	},
	{
		templateId: 'brake-pads-inspect',
		nameKey: 'tmpl_brake_pads_inspect',
		intervalKm: 10000,
		intervalMonths: 12,
		source: 'builtin'
	},
	{
		templateId: 'brake-fluid',
		nameKey: 'tmpl_brake_fluid',
		intervalKm: null,
		intervalMonths: 24,
		source: 'builtin'
	},
	{
		templateId: 'transmission-fluid',
		nameKey: 'tmpl_transmission_fluid',
		intervalKm: 60000,
		intervalMonths: null,
		source: 'builtin'
	},
	{
		templateId: 'timing-belt',
		nameKey: 'tmpl_timing_belt',
		intervalKm: 100000,
		intervalMonths: 72,
		source: 'builtin'
	},
	{
		templateId: 'inspection',
		nameKey: 'tmpl_inspection',
		intervalKm: null,
		intervalMonths: 24,
		source: 'builtin'
	},
	{
		templateId: 'air-filter',
		nameKey: 'tmpl_air_filter',
		intervalKm: 30000,
		intervalMonths: 36,
		source: 'builtin'
	},
	{
		templateId: 'cabin-filter',
		nameKey: 'tmpl_cabin_filter',
		intervalKm: 15000,
		intervalMonths: 12,
		source: 'builtin'
	},
	{
		templateId: 'coolant',
		nameKey: 'tmpl_coolant',
		intervalKm: 60000,
		intervalMonths: 60,
		source: 'builtin'
	},
	{
		templateId: 'spark-plugs',
		nameKey: 'tmpl_spark_plugs',
		intervalKm: 60000,
		intervalMonths: null,
		source: 'builtin'
	},
	{
		templateId: 'battery-check',
		nameKey: 'tmpl_battery_check',
		intervalKm: null,
		intervalMonths: 12,
		source: 'builtin'
	},
	{
		templateId: 'wiper-blades',
		nameKey: 'tmpl_wiper_blades',
		intervalKm: null,
		intervalMonths: 12,
		source: 'builtin'
	}
];
