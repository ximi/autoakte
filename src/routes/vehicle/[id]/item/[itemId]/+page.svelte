<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { remove, update } from '$lib/db/repo';
	import { live } from '$lib/db/live.svelte';
	import { computeDueStates } from '$lib/domain/due';
	import { todayLocal } from '$lib/domain/time';
	import { dueLabel, formatDate, formatDistance } from '$lib/format';
	import { EMPTY_BUNDLE, vehicleBundle } from '$lib/queries';
	import ItemForm, { type ItemFormValues } from '$lib/ui/ItemForm.svelte';
	import PageHeader from '$lib/ui/PageHeader.svelte';
	import StatusBadge from '$lib/ui/StatusBadge.svelte';
	import { i18n, t } from '$lib/i18n/index.svelte';

	const vehicleId = $derived(page.params.id!);
	const itemId = $derived(page.params.itemId!);
	const data = live(() => vehicleBundle(vehicleId), EMPTY_BUNDLE);
	const today = todayLocal();

	const item = $derived(data.value.items.find((i) => i.id === itemId) ?? null);
	const vehicle = $derived(data.value.vehicle);
	const state = $derived(
		vehicle && item
			? computeDueStates(
					[item],
					data.value.records,
					data.value.entries,
					vehicle.odometerUnit,
					today
				)[0]
			: null
	);
	const history = $derived(
		data.value.records.filter((r) => r.itemId === itemId).sort((a, b) => (a.date < b.date ? 1 : -1))
	);

	async function save(v: ItemFormValues) {
		await update('maintenanceItems', itemId, v);
		goto(`/vehicle/${vehicleId}`);
	}

	async function deleteItem() {
		if (!confirm(t('delete_item_confirm', { name: item?.name ?? '' }))) return;
		await remove('maintenanceItems', itemId);
		goto(`/vehicle/${vehicleId}`);
	}
</script>

<svelte:head><title>{item?.name ?? t('maintenance_item')}</title></svelte:head>

{#if item && vehicle}
	<PageHeader title={item.name} back="/vehicle/{vehicleId}">
		{#snippet action()}
			{#if state}
				<StatusBadge
					status={state.status}
					label={dueLabel(state, vehicle.odometerUnit, i18n.locale)}
				/>
			{/if}
		{/snippet}
	</PageHeader>

	<a
		href="/vehicle/{vehicleId}/log?item={itemId}"
		class="mb-6 block rounded-full bg-teal py-3 text-center font-medium text-teal-soft active:scale-95"
	>
		{t('log_this_service')}
	</a>

	{#key item.id}
		<ItemForm {item} unit={vehicle.odometerUnit} submitLabel={t('save_changes')} onsubmit={save} />
	{/key}

	{#if history.length > 0}
		<section class="mt-6 rounded-2xl border border-line bg-card p-4">
			<h2 class="mb-1 text-xs font-medium tracking-wide text-ink-faint uppercase">
				{t('history')}
			</h2>
			<ul class="divide-y divide-line-soft">
				{#each history as record (record.id)}
					<li class="py-3">
						<div class="flex items-center justify-between gap-2 text-sm">
							<span>{formatDate(record.date)}</span>
							<span class="text-ink-faint"
								>{formatDistance(record.odometer, vehicle.odometerUnit)}</span
							>
						</div>
						{#if record.cost != null || record.notes}
							<p class="mt-0.5 text-xs text-ink-faint">
								{[
									record.cost != null
										? `${record.cost.toLocaleString()} ${record.currency ?? '€'}`
										: null,
									record.notes
								]
									.filter(Boolean)
									.join(' · ')}
							</p>
						{/if}
					</li>
				{/each}
			</ul>
		</section>
	{/if}

	<button
		onclick={deleteItem}
		class="mt-8 w-full rounded-full border border-danger/30 py-3 text-sm font-medium text-danger active:scale-95"
	>
		{t('delete_item')}
	</button>
{:else}
	<PageHeader title={t('maintenance_item')} back="/vehicle/{vehicleId}" />
	<p class="text-sm text-ink-faint">{t('item_not_found')}</p>
{/if}
