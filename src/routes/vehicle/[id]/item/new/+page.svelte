<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { SvelteSet } from 'svelte/reactivity';
	import { create } from '$lib/db/repo';
	import { live } from '$lib/db/live.svelte';
	import { currentOdometer, mileagePoints } from '$lib/domain/mileage';
	import { todayLocal } from '$lib/domain/time';
	import { BUILTIN_TEMPLATES } from '$lib/domain/templates';
	import { EMPTY_BUNDLE, vehicleBundle } from '$lib/queries';
	import ItemForm, { type ItemFormValues } from '$lib/ui/ItemForm.svelte';
	import PageHeader from '$lib/ui/PageHeader.svelte';
	import { t } from '$lib/i18n/index.svelte';

	const vehicleId = $derived(page.params.id!);
	const isSetup = $derived(page.url.searchParams.get('setup') === '1');
	const data = live(() => vehicleBundle(vehicleId), EMPTY_BUNDLE);

	const unit = $derived(data.value.vehicle?.odometerUnit ?? 'km');
	const odometer = $derived(
		currentOdometer(mileagePoints(data.value.records, data.value.entries), data.value.items)
	);
	const usedTemplates = $derived(
		new Set(data.value.items.map((i) => i.templateId).filter(Boolean))
	);

	const selected = new SvelteSet<string>();
	let showCustom = $state(false);

	function toggle(templateId: string) {
		if (selected.has(templateId)) selected.delete(templateId);
		else selected.add(templateId);
	}

	async function addSelected() {
		const today = todayLocal();
		for (const tmpl of BUILTIN_TEMPLATES) {
			if (!selected.has(tmpl.templateId)) continue;
			await create('maintenanceItems', {
				vehicleId,
				// Stored resolved in the active language, like any custom item name.
				name: t(tmpl.nameKey),
				intervalKm: tmpl.intervalKm,
				intervalMonths: tmpl.intervalMonths,
				anchorDate: today,
				anchorOdometer: odometer,
				templateId: tmpl.templateId
			});
		}
		goto(`/vehicle/${vehicleId}`);
	}

	async function addCustom(v: ItemFormValues) {
		await create('maintenanceItems', { vehicleId, ...v, templateId: null });
		goto(`/vehicle/${vehicleId}`);
	}
</script>

<svelte:head><title>{t('add_maintenance')}</title></svelte:head>

<PageHeader
	title={isSetup ? t('what_to_track') : t('add_maintenance')}
	back="/vehicle/{vehicleId}"
/>

{#if isSetup}
	<p class="-mt-2 mb-4 text-sm text-ink-faint">{t('setup_hint')}</p>
{/if}

<div class="flex flex-wrap gap-2">
	{#each BUILTIN_TEMPLATES as tmpl (tmpl.templateId)}
		{@const used = usedTemplates.has(tmpl.templateId)}
		<button
			type="button"
			disabled={used}
			onclick={() => toggle(tmpl.templateId)}
			class="rounded-full border px-3.5 py-2 text-sm font-medium active:scale-95 disabled:opacity-40 {selected.has(
				tmpl.templateId
			)
				? 'border-teal bg-teal-soft text-teal-deep'
				: 'border-line bg-card text-ink-soft'}"
		>
			{t(tmpl.nameKey)}
		</button>
	{/each}
</div>
<p class="mt-2 text-xs text-ink-faint">
	{t('chips_anchor_hint', { at_odometer: odometer != null ? t('at_current_odometer') : '' })}
</p>

{#if selected.size > 0}
	<button
		onclick={addSelected}
		class="mt-4 w-full rounded-full bg-teal py-3 font-medium text-teal-soft active:scale-95"
	>
		{selected.size === 1 ? t('add_n_items_one') : t('add_n_items', { n: selected.size })}
	</button>
{/if}

{#if isSetup && selected.size === 0}
	<a
		href="/vehicle/{vehicleId}"
		class="mt-4 block w-full rounded-full border border-line bg-card py-3 text-center text-sm font-medium text-ink-soft active:scale-95"
	>
		{t('skip_for_now')}
	</a>
{/if}

<div class="mt-8">
	<button onclick={() => (showCustom = !showCustom)} class="mb-3 text-sm font-medium text-teal">
		{showCustom ? t('hide_custom') : t('show_custom')}
	</button>
	{#if showCustom}
		<ItemForm {unit} defaultOdometer={odometer} submitLabel={t('add_item')} onsubmit={addCustom} />
	{/if}
</div>
