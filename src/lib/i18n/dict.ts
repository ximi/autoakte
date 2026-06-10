// Pure translation data — no runes, no DOM — so the server cron can localize
// notification digests too. EN is canonical and drives the TranslationKey
// type; every other language must mirror it exactly. Adding a language =
// adding one entry to `locales`.

export const en = {
	// general
	back: 'Back',

	// dashboard
	needs_attention: 'Needs attention',
	no_vehicles_title: 'No vehicles yet',
	no_vehicles_sub: 'Add your car to start tracking maintenance.',
	add_first_vehicle: 'Add your first vehicle',
	add_vehicle: 'Add vehicle',
	log_mileage: 'Log mileage',
	log_mileage_for: 'Log mileage for…',
	all_good: 'all good',
	n_overdue: '{n} overdue',
	n_due_soon: '{n} due soon',
	no_mileage_yet: 'no mileage yet',
	per_day: '~{n} {unit}/day',
	settings: 'Settings',

	// due labels
	due_today: 'due today',
	in_days_one: 'in 1 day',
	in_days: 'in {n} days',
	days_over_one: '1 day over',
	days_over: '{n} days over',
	in_distance: 'in {d}',
	distance_over: '{d} over',
	approx_days: '~{n} d',
	no_schedule: 'no schedule',

	// vehicle detail
	edit: 'Edit',
	maintenance: 'Maintenance',
	add_short: '+ Add',
	no_items_yet: 'No maintenance items yet — add what you want to track.',
	enter_mileage: 'Enter mileage',
	log_service: 'Log service',
	history: 'History',
	odometer: 'Odometer',
	odometer_reading: 'Odometer reading',
	vehicle_not_found: 'Vehicle not found.',
	service_fallback: 'Service',

	// vehicle form
	field_name: 'Name',
	vehicle_name_placeholder: 'e.g. Golf VII',
	field_make: 'Make',
	field_model: 'Model',
	field_year: 'Year',
	field_plate: 'Plate',
	optional: '(optional)',
	odometer_unit: 'Odometer unit',
	current_odometer: 'Current odometer ({unit})',
	edit_vehicle: 'Edit vehicle',
	save_changes: 'Save changes',
	delete_vehicle: 'Delete vehicle',
	delete_vehicle_confirm: 'Delete {name} and all its history? This cannot be undone.',

	// item form / screens
	item_name_placeholder: 'e.g. Oil & filter change',
	every_distance: 'Every … {unit}',
	every_months: 'Every … months',
	whichever_first: 'With both set, whichever comes first applies.',
	last_done_on: 'Last done on',
	at_unit: '… at ({unit})',
	anchor_hint: "If you're not sure, leave today's values — tracking starts from now.",
	interval_required: 'Set a distance interval, a time interval, or both.',
	add_item: 'Add item',
	add_maintenance: 'Add maintenance',
	what_to_track: 'What do you want to track?',
	setup_hint: 'Pick the maintenance you want reminders for — intervals are editable later.',
	chips_anchor_hint:
		'Selected items count as done today{at_odometer} — log a service or edit the item to backdate.',
	at_current_odometer: ' at the current odometer',
	add_n_items_one: 'Add 1 item',
	add_n_items: 'Add {n} items',
	skip_for_now: 'Skip for now',
	show_custom: '+ Custom item',
	hide_custom: '− Hide custom item',
	log_this_service: 'Log this service',
	delete_item: 'Delete item',
	delete_item_confirm: 'Delete "{name}"? Its service history stays on the vehicle.',
	item_not_found: 'Item not found.',
	maintenance_item: 'Maintenance item',

	// log service
	what_was_done: 'What was done?',
	choose: 'Choose…',
	one_off_option: 'Something else (one-off service)',
	describe_service: 'Describe the service',
	describe_placeholder: 'e.g. Replaced windscreen',
	field_date: 'Date',
	odometer_with_unit: 'Odometer ({unit})',
	field_cost: 'Cost',
	cost_unit_hint: '(optional, €)',
	field_notes: 'Notes',
	save_service: 'Save service',
	no_items_for_log: 'No maintenance items yet —',
	add_one_first: 'add one first',

	// mileage entry
	current_odometer_of: 'Current odometer of {name} ({unit})',
	last_known: 'Last known: {d}',
	lower_warning: "That's lower than the last known reading — double-check before saving.",
	save_reading: 'Save reading',
	vehicle_fallback: 'vehicle',

	// settings
	mileage_checkin: 'Mileage check-in',
	mileage_checkin_sub: 'How often the app should ask for your current odometer reading.',
	weekly: 'Weekly',
	every_2_weeks: 'Every 2 weeks',
	monthly: 'Monthly',
	language: 'Language',
	account_sync: 'Account & sync',
	signed_in_as: 'Signed in as {email}',
	account_card_sub: 'Optional — sync across devices and enable push reminders.',
	your_data: 'Your data',
	export_backup: 'Export backup (JSON)',
	delete_all_data: 'Delete all local data',
	wipe_confirm_1: 'Delete ALL local data? This cannot be undone.',
	wipe_confirm_2: 'Really sure? Consider exporting a backup first.',

	// account & sync
	sync_not_configured:
		"Sync isn't configured for this build (missing Supabase settings). The app works fully on this device.",
	loading: 'Loading…',
	signed_in: 'Signed in',
	sync_now: 'Sync now',
	syncing: 'Syncing…',
	sync_error: 'Sync error: {e}',
	last_synced: 'Last synced {time}',
	not_synced_yet: 'Not synced yet',
	sync_explainer:
		'Your data syncs to this account. Sign in with the same email on another device to keep them in sync.',
	account_pitch:
		'Create a free account (or sign back in) to sync your vehicles across devices and keep push reminders up to date automatically. No password — we email you a 6-digit code.',
	field_email: 'Email',
	send_code: 'Send code',
	sending: 'Sending…',
	enter_code_sent: 'Enter the 6-digit code we sent to',
	sign_in: 'Sign in',
	checking: 'Checking…',
	use_different_email: 'Use a different email',
	sign_out: 'Sign out',
	local_data_stays: 'Local data stays on this device.',
	push_reminders: 'Push reminders',
	push_ios_hint:
		'To get reminders on iPhone, first install the app: tap Share → "Add to Home Screen", then enable notifications from the installed app.',
	push_unsupported: "Push notifications aren't supported here.",
	push_sub_account:
		'A daily check notifies you when maintenance is due soon or overdue, and reminds you to log your mileage.',
	push_sub_anon:
		'Works without an account: reminder dates are scheduled from this device whenever you use the app — only the dates and message text leave the device. Signing in keeps them up to date automatically instead.',
	enable_notifications: 'Enable notifications',
	disable_notifications: 'Disable notifications on this device',
	err_not_configured: 'Sync is not configured.',
	err_push_unsupported: 'Push is not supported here.',
	err_permission_denied: 'Notification permission was denied.',
	err_missing_keys: 'Subscription is missing keys.',

	// update prompt
	update_available: 'A new version is available.',
	update: 'Update',

	// notifications (client-rendered for anonymous devices, server for accounts)
	notif_overdue_title: 'Maintenance overdue',
	notif_reminder_title: 'Maintenance reminder',
	notif_reminders_title: 'Maintenance reminders',
	notif_mileage_title: 'Mileage check-in',
	notif_still_overdue: '{vehicle}: {item} is still overdue',
	notif_due_soon: '{vehicle}: {item} is due soon',
	notif_now_overdue: '{vehicle}: {item} is now overdue',
	notif_log_mileage: 'Time to log the current mileage of {vehicle}',
	digest_overdue: '{item} overdue ({label})',
	digest_due: '{item} due {label}',
	digest_log_mileage: 'Time to log your current mileage.',
	maintenance_fallback: 'Maintenance',

	// maintenance templates
	tmpl_oil_filter: 'Oil & filter change',
	tmpl_tyre_rotation: 'Tyre rotation',
	tmpl_tyres_inspect: 'Tyres (inspect tread & pressure)',
	tmpl_brake_pads_inspect: 'Brake pads (inspect)',
	tmpl_brake_fluid: 'Brake fluid',
	tmpl_transmission_fluid: 'Transmission fluid',
	tmpl_timing_belt: 'Timing belt',
	tmpl_inspection: 'Inspection (TÜV/MOT)',
	tmpl_air_filter: 'Air filter',
	tmpl_cabin_filter: 'Cabin filter',
	tmpl_coolant: 'Coolant',
	tmpl_spark_plugs: 'Spark plugs',
	tmpl_battery_check: 'Battery check',
	tmpl_wiper_blades: 'Wiper blades'
} as const;

export type TranslationKey = keyof typeof en;

export const de: Record<TranslationKey, string> = {
	back: 'Zurück',

	needs_attention: 'Braucht Aufmerksamkeit',
	no_vehicles_title: 'Noch keine Fahrzeuge',
	no_vehicles_sub: 'Füge dein Auto hinzu, um Wartungen zu verfolgen.',
	add_first_vehicle: 'Erstes Fahrzeug hinzufügen',
	add_vehicle: 'Fahrzeug hinzufügen',
	log_mileage: 'Kilometerstand erfassen',
	log_mileage_for: 'Kilometerstand erfassen für…',
	all_good: 'alles gut',
	n_overdue: '{n} überfällig',
	n_due_soon: '{n} bald fällig',
	no_mileage_yet: 'noch kein Kilometerstand',
	per_day: '~{n} {unit}/Tag',
	settings: 'Einstellungen',

	due_today: 'heute fällig',
	in_days_one: 'in 1 Tag',
	in_days: 'in {n} Tagen',
	days_over_one: '1 Tag überfällig',
	days_over: '{n} Tage überfällig',
	in_distance: 'in {d}',
	distance_over: '{d} drüber',
	approx_days: '~{n} T',
	no_schedule: 'kein Intervall',

	edit: 'Bearbeiten',
	maintenance: 'Wartung',
	add_short: '+ Neu',
	no_items_yet: 'Noch keine Wartungspunkte — füge hinzu, was du verfolgen möchtest.',
	enter_mileage: 'Kilometerstand',
	log_service: 'Wartung erfassen',
	history: 'Verlauf',
	odometer: 'Kilometerstand',
	odometer_reading: 'Kilometerstand erfasst',
	vehicle_not_found: 'Fahrzeug nicht gefunden.',
	service_fallback: 'Wartung',

	field_name: 'Name',
	vehicle_name_placeholder: 'z. B. Golf VII',
	field_make: 'Marke',
	field_model: 'Modell',
	field_year: 'Baujahr',
	field_plate: 'Kennzeichen',
	optional: '(optional)',
	odometer_unit: 'Einheit',
	current_odometer: 'Aktueller Kilometerstand ({unit})',
	edit_vehicle: 'Fahrzeug bearbeiten',
	save_changes: 'Änderungen speichern',
	delete_vehicle: 'Fahrzeug löschen',
	delete_vehicle_confirm:
		'{name} und den gesamten Verlauf löschen? Das kann nicht rückgängig gemacht werden.',

	item_name_placeholder: 'z. B. Öl- & Filterwechsel',
	every_distance: 'Alle … {unit}',
	every_months: 'Alle … Monate',
	whichever_first: 'Sind beide gesetzt, gilt was zuerst eintritt.',
	last_done_on: 'Zuletzt gemacht am',
	at_unit: '… bei ({unit})',
	anchor_hint: 'Im Zweifel die heutigen Werte lassen — die Erfassung startet ab jetzt.',
	interval_required: 'Lege ein Distanz-Intervall, ein Zeit-Intervall oder beides fest.',
	add_item: 'Punkt hinzufügen',
	add_maintenance: 'Wartung hinzufügen',
	what_to_track: 'Was möchtest du verfolgen?',
	setup_hint:
		'Wähle die Wartungen, an die erinnert werden soll — Intervalle sind später anpassbar.',
	chips_anchor_hint:
		'Ausgewählte Punkte gelten als heute erledigt{at_odometer} — erfasse eine Wartung oder bearbeite den Punkt zum Rückdatieren.',
	at_current_odometer: ' beim aktuellen Kilometerstand',
	add_n_items_one: '1 Punkt hinzufügen',
	add_n_items: '{n} Punkte hinzufügen',
	skip_for_now: 'Später',
	show_custom: '+ Eigener Punkt',
	hide_custom: '− Eigenen Punkt ausblenden',
	log_this_service: 'Diese Wartung erfassen',
	delete_item: 'Punkt löschen',
	delete_item_confirm: '"{name}" löschen? Der Wartungsverlauf bleibt beim Fahrzeug.',
	item_not_found: 'Punkt nicht gefunden.',
	maintenance_item: 'Wartungspunkt',

	what_was_done: 'Was wurde gemacht?',
	choose: 'Auswählen…',
	one_off_option: 'Etwas anderes (einmalige Arbeit)',
	describe_service: 'Beschreibe die Arbeit',
	describe_placeholder: 'z. B. Windschutzscheibe ersetzt',
	field_date: 'Datum',
	odometer_with_unit: 'Kilometerstand ({unit})',
	field_cost: 'Kosten',
	cost_unit_hint: '(optional, €)',
	field_notes: 'Notizen',
	save_service: 'Wartung speichern',
	no_items_for_log: 'Noch keine Wartungspunkte —',
	add_one_first: 'erst einen anlegen',

	current_odometer_of: 'Aktueller Kilometerstand von {name} ({unit})',
	last_known: 'Zuletzt bekannt: {d}',
	lower_warning: 'Das ist weniger als der letzte bekannte Stand — bitte vor dem Speichern prüfen.',
	save_reading: 'Stand speichern',
	vehicle_fallback: 'Fahrzeug',

	mileage_checkin: 'Kilometerstand-Erinnerung',
	mileage_checkin_sub: 'Wie oft die App nach dem aktuellen Kilometerstand fragen soll.',
	weekly: 'Wöchentlich',
	every_2_weeks: 'Alle 2 Wochen',
	monthly: 'Monatlich',
	language: 'Sprache',
	account_sync: 'Konto & Sync',
	signed_in_as: 'Angemeldet als {email}',
	account_card_sub: 'Optional — Geräte synchronisieren und Push-Erinnerungen aktivieren.',
	your_data: 'Deine Daten',
	export_backup: 'Backup exportieren (JSON)',
	delete_all_data: 'Alle lokalen Daten löschen',
	wipe_confirm_1: 'ALLE lokalen Daten löschen? Das kann nicht rückgängig gemacht werden.',
	wipe_confirm_2: 'Wirklich sicher? Exportiere vorher besser ein Backup.',

	sync_not_configured:
		'Sync ist in diesem Build nicht konfiguriert (Supabase-Einstellungen fehlen). Die App funktioniert vollständig auf diesem Gerät.',
	loading: 'Lädt…',
	signed_in: 'Angemeldet',
	sync_now: 'Jetzt synchronisieren',
	syncing: 'Synchronisiert…',
	sync_error: 'Sync-Fehler: {e}',
	last_synced: 'Zuletzt synchronisiert {time}',
	not_synced_yet: 'Noch nicht synchronisiert',
	sync_explainer:
		'Deine Daten werden mit diesem Konto synchronisiert. Melde dich auf einem anderen Gerät mit derselben E-Mail an, um beide aktuell zu halten.',
	account_pitch:
		'Erstelle ein kostenloses Konto (oder melde dich wieder an), um Fahrzeuge zwischen Geräten zu synchronisieren und Push-Erinnerungen automatisch aktuell zu halten. Kein Passwort — wir schicken dir einen 6-stelligen Code per E-Mail.',
	field_email: 'E-Mail',
	send_code: 'Code senden',
	sending: 'Wird gesendet…',
	enter_code_sent: 'Gib den 6-stelligen Code ein, den wir geschickt haben an',
	sign_in: 'Anmelden',
	checking: 'Wird geprüft…',
	use_different_email: 'Andere E-Mail verwenden',
	sign_out: 'Abmelden',
	local_data_stays: 'Lokale Daten bleiben auf diesem Gerät.',
	push_reminders: 'Push-Erinnerungen',
	push_ios_hint:
		'Für Erinnerungen auf dem iPhone installiere zuerst die App: Teilen → „Zum Home-Bildschirm", dann Benachrichtigungen in der installierten App aktivieren.',
	push_unsupported: 'Push-Benachrichtigungen werden hier nicht unterstützt.',
	push_sub_account:
		'Eine tägliche Prüfung benachrichtigt dich, wenn Wartung bald fällig oder überfällig ist, und erinnert an den Kilometerstand.',
	push_sub_anon:
		'Funktioniert ohne Konto: Erinnerungstermine werden bei jeder Nutzung von diesem Gerät geplant — nur Termine und Nachrichtentext verlassen das Gerät. Mit Anmeldung bleiben sie stattdessen automatisch aktuell.',
	enable_notifications: 'Benachrichtigungen aktivieren',
	disable_notifications: 'Benachrichtigungen auf diesem Gerät deaktivieren',
	err_not_configured: 'Sync ist nicht konfiguriert.',
	err_push_unsupported: 'Push wird hier nicht unterstützt.',
	err_permission_denied: 'Benachrichtigungen wurden nicht erlaubt.',
	err_missing_keys: 'Der Subscription fehlen Schlüssel.',

	update_available: 'Eine neue Version ist verfügbar.',
	update: 'Aktualisieren',

	notif_overdue_title: 'Wartung überfällig',
	notif_reminder_title: 'Wartungserinnerung',
	notif_reminders_title: 'Wartungserinnerungen',
	notif_mileage_title: 'Kilometerstand-Erinnerung',
	notif_still_overdue: '{vehicle}: {item} ist weiterhin überfällig',
	notif_due_soon: '{vehicle}: {item} ist bald fällig',
	notif_now_overdue: '{vehicle}: {item} ist jetzt überfällig',
	notif_log_mileage: 'Zeit, den Kilometerstand von {vehicle} zu erfassen',
	digest_overdue: '{item} überfällig ({label})',
	digest_due: '{item} fällig {label}',
	digest_log_mileage: 'Zeit, den aktuellen Kilometerstand zu erfassen.',
	maintenance_fallback: 'Wartung',

	tmpl_oil_filter: 'Öl- & Filterwechsel',
	tmpl_tyre_rotation: 'Räder tauschen (Rotation)',
	tmpl_tyres_inspect: 'Reifen (Profil & Druck prüfen)',
	tmpl_brake_pads_inspect: 'Bremsbeläge (prüfen)',
	tmpl_brake_fluid: 'Bremsflüssigkeit',
	tmpl_transmission_fluid: 'Getriebeöl',
	tmpl_timing_belt: 'Zahnriemen',
	tmpl_inspection: 'HU/TÜV',
	tmpl_air_filter: 'Luftfilter',
	tmpl_cabin_filter: 'Innenraumfilter',
	tmpl_coolant: 'Kühlmittel',
	tmpl_spark_plugs: 'Zündkerzen',
	tmpl_battery_check: 'Batterie prüfen',
	tmpl_wiper_blades: 'Scheibenwischer'
};

export const locales = { en, de } as const;
export type Locale = keyof typeof locales;
export const LOCALE_NAMES: Record<Locale, string> = { en: 'English', de: 'Deutsch' };

/** Pure lookup with {placeholder} interpolation — usable on the server. */
export function tr(
	locale: Locale,
	key: TranslationKey,
	params?: Record<string, string | number>
): string {
	let s: string = locales[locale][key] ?? en[key];
	if (params) {
		for (const [k, v] of Object.entries(params)) s = s.replaceAll(`{${k}}`, String(v));
	}
	return s;
}

export function isLocale(value: unknown): value is Locale {
	return typeof value === 'string' && value in locales;
}
