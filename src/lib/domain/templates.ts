import type { TranslationKey } from '$lib/i18n/dict';

export type TemplateCategory = 'tyres_brakes' | 'fluids_filters' | 'engine' | 'service';

/** Picker section order. */
export const TEMPLATE_CATEGORIES: TemplateCategory[] = [
	'tyres_brakes',
	'fluids_filters',
	'engine',
	'service'
];

export const CATEGORY_NAME_KEY: Record<TemplateCategory, TranslationKey> = {
	tyres_brakes: 'cat_tyres_brakes',
	fluids_filters: 'cat_fluids_filters',
	engine: 'cat_engine',
	service: 'cat_service'
};

export interface MaintenanceTemplate {
	templateId: string;
	/** i18n key — the picker renders it in the active language, and item
	 * creation stores the resolved string (like any custom item name). */
	nameKey: TranslationKey;
	category: TemplateCategory;
	intervalKm: number | null;
	intervalMonths: number | null;
	/** Provenance — 'builtin' now; fetched/model-specific schedules later. */
	source: 'builtin';
}

export const BUILTIN_TEMPLATES: MaintenanceTemplate[] = [
	// Tyres & brakes
	{
		templateId: 'tyre-rotation',
		nameKey: 'tmpl_tyre_rotation',
		category: 'tyres_brakes',
		intervalKm: 10000,
		intervalMonths: null,
		source: 'builtin'
	},
	{
		templateId: 'tyres-seasonal',
		nameKey: 'tmpl_tyres_seasonal',
		category: 'tyres_brakes',
		intervalKm: null,
		intervalMonths: 6,
		source: 'builtin'
	},
	{
		templateId: 'tyres-inspect',
		nameKey: 'tmpl_tyres_inspect',
		category: 'tyres_brakes',
		intervalKm: null,
		intervalMonths: 6,
		source: 'builtin'
	},
	{
		templateId: 'brake-pads-inspect',
		nameKey: 'tmpl_brake_pads_inspect',
		category: 'tyres_brakes',
		intervalKm: 10000,
		intervalMonths: 12,
		source: 'builtin'
	},
	{
		templateId: 'brake-discs',
		nameKey: 'tmpl_brake_discs',
		category: 'tyres_brakes',
		intervalKm: 60000,
		intervalMonths: null,
		source: 'builtin'
	},
	{
		templateId: 'brake-fluid',
		nameKey: 'tmpl_brake_fluid',
		category: 'tyres_brakes',
		intervalKm: null,
		intervalMonths: 24,
		source: 'builtin'
	},

	// Fluids & filters
	{
		templateId: 'oil-filter',
		nameKey: 'tmpl_oil_filter',
		category: 'fluids_filters',
		intervalKm: 15000,
		intervalMonths: 12,
		source: 'builtin'
	},
	{
		templateId: 'coolant',
		nameKey: 'tmpl_coolant',
		category: 'fluids_filters',
		intervalKm: 60000,
		intervalMonths: 60,
		source: 'builtin'
	},
	{
		templateId: 'transmission-fluid',
		nameKey: 'tmpl_transmission_fluid',
		category: 'fluids_filters',
		intervalKm: 60000,
		intervalMonths: null,
		source: 'builtin'
	},
	{
		templateId: 'differential-fluid',
		nameKey: 'tmpl_differential_fluid',
		category: 'fluids_filters',
		intervalKm: 60000,
		intervalMonths: null,
		source: 'builtin'
	},
	{
		templateId: 'air-filter',
		nameKey: 'tmpl_air_filter',
		category: 'fluids_filters',
		intervalKm: 30000,
		intervalMonths: 36,
		source: 'builtin'
	},
	{
		templateId: 'cabin-filter',
		nameKey: 'tmpl_cabin_filter',
		category: 'fluids_filters',
		intervalKm: 15000,
		intervalMonths: 12,
		source: 'builtin'
	},
	{
		templateId: 'fuel-filter',
		nameKey: 'tmpl_fuel_filter',
		category: 'fluids_filters',
		intervalKm: 60000,
		intervalMonths: null,
		source: 'builtin'
	},

	// Engine & drivetrain
	{
		templateId: 'timing-belt',
		nameKey: 'tmpl_timing_belt',
		category: 'engine',
		intervalKm: 100000,
		intervalMonths: 72,
		source: 'builtin'
	},
	{
		templateId: 'spark-plugs',
		nameKey: 'tmpl_spark_plugs',
		category: 'engine',
		intervalKm: 60000,
		intervalMonths: null,
		source: 'builtin'
	},
	{
		templateId: 'glow-plugs',
		nameKey: 'tmpl_glow_plugs',
		category: 'engine',
		intervalKm: 100000,
		intervalMonths: null,
		source: 'builtin'
	},

	// Checks & service
	{
		templateId: 'inspection',
		nameKey: 'tmpl_inspection',
		category: 'service',
		intervalKm: null,
		intervalMonths: 24,
		source: 'builtin'
	},
	{
		templateId: 'ac-service',
		nameKey: 'tmpl_ac_service',
		category: 'service',
		intervalKm: null,
		intervalMonths: 24,
		source: 'builtin'
	},
	{
		templateId: 'battery-check',
		nameKey: 'tmpl_battery_check',
		category: 'service',
		intervalKm: null,
		intervalMonths: 12,
		source: 'builtin'
	},
	{
		templateId: 'wiper-blades',
		nameKey: 'tmpl_wiper_blades',
		category: 'service',
		intervalKm: null,
		intervalMonths: 12,
		source: 'builtin'
	}
];
