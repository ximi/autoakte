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
		for (const t of BUILTIN_TEMPLATES) {
			if (!selected.has(t.templateId)) continue;
			await create('maintenanceItems', {
				vehicleId,
				name: t.name,
				intervalKm: t.intervalKm,
				intervalMonths: t.intervalMonths,
				anchorDate: today,
				anchorOdometer: odometer,
				templateId: t.templateId
			});
		}
		goto(`/vehicle/${vehicleId}`);
	}

	async function addCustom(v: ItemFormValues) {
		await create('maintenanceItems', { vehicleId, ...v, templateId: null });
		goto(`/vehicle/${vehicleId}`);
	}
</script>

<svelte:head><title>Add maintenance</title></svelte:head>

<PageHeader
	title={isSetup ? 'What do you want to track?' : 'Add maintenance'}
	back="/vehicle/{vehicleId}"
/>

{#if isSetup}
	<p class="-mt-2 mb-4 text-sm text-ink-faint">
		Pick the maintenance you want reminders for — intervals are editable later.
	</p>
{/if}

<div class="flex flex-wrap gap-2">
	{#each BUILTIN_TEMPLATES as t (t.templateId)}
		{@const used = usedTemplates.has(t.templateId)}
		<button
			type="button"
			disabled={used}
			onclick={() => toggle(t.templateId)}
			class="rounded-full border px-3.5 py-2 text-sm font-medium active:scale-95 disabled:opacity-40 {selected.has(
				t.templateId
			)
				? 'border-teal bg-teal-soft text-teal-deep'
				: 'border-line bg-card text-ink-soft'}"
		>
			{t.name}
		</button>
	{/each}
</div>
<p class="mt-2 text-xs text-ink-faint">
	Selected items count as done today{odometer != null ? ` at the current odometer` : ''} — log a service
	or edit the item to backdate.
</p>

{#if selected.size > 0}
	<button
		onclick={addSelected}
		class="mt-4 w-full rounded-full bg-teal py-3 font-medium text-teal-soft active:scale-95"
	>
		Add {selected.size}
		{selected.size === 1 ? 'item' : 'items'}
	</button>
{/if}

{#if isSetup && selected.size === 0}
	<a
		href="/vehicle/{vehicleId}"
		class="mt-4 block w-full rounded-full border border-line bg-card py-3 text-center text-sm font-medium text-ink-soft active:scale-95"
	>
		Skip for now
	</a>
{/if}

<div class="mt-8">
	<button onclick={() => (showCustom = !showCustom)} class="mb-3 text-sm font-medium text-teal">
		{showCustom ? '− Hide custom item' : '+ Custom item'}
	</button>
	{#if showCustom}
		<ItemForm {unit} defaultOdometer={odometer} submitLabel="Add item" onsubmit={addCustom} />
	{/if}
</div>
