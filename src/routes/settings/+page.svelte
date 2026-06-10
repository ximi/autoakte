<script lang="ts">
	import { APP_NAME } from '$lib/constants';
	import { db, SYNCED_TABLES } from '$lib/db/db';
	import { getSetting, setSetting } from '$lib/db/repo';
	import { authState } from '$lib/sync/auth.svelte';
	import { updateReminderDays } from '$lib/sync/push-subscribe';
	import PageHeader from '$lib/ui/PageHeader.svelte';
	import { i18n, setLocale, t } from '$lib/i18n/index.svelte';
	import { LOCALE_NAMES, locales, type Locale } from '$lib/i18n/dict';
	import { syncLocaleToServer } from '$lib/sync/push-subscribe';

	let reminderDays = $state(14);
	getSetting('mileageReminderDays', 14).then((v) => (reminderDays = v));

	async function setReminder(days: number) {
		reminderDays = days;
		await setSetting('mileageReminderDays', days);
		await updateReminderDays(days);
	}

	async function exportJson() {
		const dump: Record<string, unknown> = { exportedAt: new Date().toISOString(), app: APP_NAME };
		for (const table of SYNCED_TABLES) {
			dump[table] = await db.table(table).toArray();
		}
		const blob = new Blob([JSON.stringify(dump, null, '\t')], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `${APP_NAME.toLowerCase()}-backup-${new Date().toISOString().slice(0, 10)}.json`;
		a.click();
		URL.revokeObjectURL(url);
	}

	async function pickLocale(l: Locale) {
		setLocale(l);
		await syncLocaleToServer();
	}

	async function wipe() {
		if (!confirm(t('wipe_confirm_1'))) return;
		if (!confirm(t('wipe_confirm_2'))) return;
		await db.delete();
		location.href = '/';
	}
</script>

<svelte:head><title>{t('settings')}</title></svelte:head>

<PageHeader title={t('settings')} back="/" />

<section class="mb-4 rounded-2xl border border-line bg-card p-4">
	<h2 class="text-sm font-medium">{t('mileage_checkin')}</h2>
	<p class="mt-0.5 mb-3 text-xs text-ink-faint">
		{t('mileage_checkin_sub')}
	</p>
	<div class="flex gap-2">
		{#each [{ d: 7, label: t('weekly') }, { d: 14, label: t('every_2_weeks') }, { d: 28, label: t('monthly') }] as opt (opt.d)}
			<button
				onclick={() => setReminder(opt.d)}
				class="flex-1 rounded-xl border py-2.5 text-xs font-medium active:scale-95 {reminderDays ===
				opt.d
					? 'border-teal bg-teal-soft text-teal-deep'
					: 'border-line bg-card text-ink-soft'}"
			>
				{opt.label}
			</button>
		{/each}
	</div>
</section>

<section class="mb-4 rounded-2xl border border-line bg-card p-4">
	<h2 class="mb-3 text-sm font-medium">{t('language')}</h2>
	<div class="flex gap-2">
		{#each Object.keys(locales) as Locale[] as l (l)}
			<button
				onclick={() => pickLocale(l)}
				class="flex-1 rounded-xl border py-2.5 text-xs font-medium active:scale-95 {i18n.locale ===
				l
					? 'border-teal bg-teal-soft text-teal-deep'
					: 'border-line bg-card text-ink-soft'}"
			>
				{LOCALE_NAMES[l]}
			</button>
		{/each}
	</div>
</section>

<a
	href="/settings/account"
	class="mb-4 block rounded-2xl border border-line bg-card p-4 active:scale-[0.99]"
>
	<div class="flex items-center justify-between gap-2">
		<div>
			<h2 class="text-sm font-medium">{t('account_sync')}</h2>
			<p class="mt-0.5 text-xs text-ink-faint">
				{authState.user
					? t('signed_in_as', { email: authState.user.email ?? '' })
					: t('account_card_sub')}
			</p>
		</div>
		<span class="text-ink-faint">›</span>
	</div>
</a>

<section class="rounded-2xl border border-line bg-card p-4">
	<h2 class="mb-3 text-sm font-medium">{t('your_data')}</h2>
	<button
		onclick={exportJson}
		class="mb-2 w-full rounded-full border border-teal py-2.5 text-sm font-medium text-teal active:scale-95"
	>
		{t('export_backup')}
	</button>
	<button
		onclick={wipe}
		class="w-full rounded-full border border-danger/30 py-2.5 text-sm font-medium text-danger active:scale-95"
	>
		{t('delete_all_data')}
	</button>
</section>
