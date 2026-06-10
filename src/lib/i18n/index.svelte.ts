// Reactive i18n runtime. The locale is a device preference stored in
// localStorage (synchronous, so there's no English flash on load).

import { isLocale, tr, type Locale, type TranslationKey } from './dict';

const STORAGE_KEY = 'locale';

function initialLocale(): Locale {
	if (typeof window === 'undefined') return 'en';
	const stored = localStorage.getItem(STORAGE_KEY);
	if (isLocale(stored)) return stored;
	return navigator.language?.toLowerCase().startsWith('de') ? 'de' : 'en';
}

export const i18n = $state({ locale: initialLocale() });

if (typeof document !== 'undefined') {
	document.documentElement.lang = i18n.locale;
}

/** Reactive translate — components re-render on locale change. */
export function t(key: TranslationKey, params?: Record<string, string | number>): string {
	return tr(i18n.locale, key, params);
}

export function setLocale(locale: Locale): void {
	i18n.locale = locale;
	localStorage.setItem(STORAGE_KEY, locale);
	document.documentElement.lang = locale;
}
