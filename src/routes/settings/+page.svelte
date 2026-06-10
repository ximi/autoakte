<script lang="ts">
	import { APP_NAME } from '$lib/constants';
	import { db, SYNCED_TABLES } from '$lib/db/db';
	import { getSetting, setSetting } from '$lib/db/repo';
	import PageHeader from '$lib/ui/PageHeader.svelte';

	let reminderDays = $state(14);
	getSetting('mileageReminderDays', 14).then((v) => (reminderDays = v));

	async function setReminder(days: number) {
		reminderDays = days;
		await setSetting('mileageReminderDays', days);
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

	async function wipe() {
		if (!confirm('Delete ALL local data? This cannot be undone.')) return;
		if (!confirm('Really sure? Consider exporting a backup first.')) return;
		await db.delete();
		location.href = '/';
	}
</script>

<svelte:head><title>Settings</title></svelte:head>

<PageHeader title="Settings" back="/" />

<section class="mb-4 rounded-2xl border border-line bg-card p-4">
	<h2 class="text-sm font-medium">Mileage check-in</h2>
	<p class="mt-0.5 mb-3 text-xs text-ink-faint">
		How often the app should ask for your current odometer reading.
	</p>
	<div class="flex gap-2">
		{#each [{ d: 7, label: 'Weekly' }, { d: 14, label: 'Every 2 weeks' }, { d: 28, label: 'Monthly' }] as opt (opt.d)}
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
	<h2 class="text-sm font-medium">Sync & notifications</h2>
	<p class="mt-0.5 text-xs text-ink-faint">
		Coming soon: an optional account for multi-device sync and push reminders. All data currently
		lives only on this device.
	</p>
</section>

<section class="rounded-2xl border border-line bg-card p-4">
	<h2 class="mb-3 text-sm font-medium">Your data</h2>
	<button
		onclick={exportJson}
		class="mb-2 w-full rounded-full border border-teal py-2.5 text-sm font-medium text-teal active:scale-95"
	>
		Export backup (JSON)
	</button>
	<button
		onclick={wipe}
		class="w-full rounded-full border border-danger/30 py-2.5 text-sm font-medium text-danger active:scale-95"
	>
		Delete all local data
	</button>
</section>
