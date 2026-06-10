<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { create } from '$lib/db/repo';
	import { live } from '$lib/db/live.svelte';
	import { currentOdometer, mileagePoints } from '$lib/domain/mileage';
	import { todayLocal } from '$lib/domain/time';
	import { EMPTY_BUNDLE, vehicleBundle } from '$lib/queries';
	import PageHeader from '$lib/ui/PageHeader.svelte';
	import { t } from '$lib/i18n/index.svelte';

	const ONE_OFF = '__one-off';

	const vehicleId = $derived(page.params.id!);
	const data = live(() => vehicleBundle(vehicleId), EMPTY_BUNDLE);

	let itemId = $state(page.url.searchParams.get('item') ?? '');
	let title = $state('');
	let date = $state(todayLocal());
	let odometer = $state<number | undefined>(undefined);
	let cost = $state<number | undefined>(undefined);
	let notes = $state('');

	const knownOdometer = $derived(
		currentOdometer(mileagePoints(data.value.records, data.value.entries), data.value.items)
	);

	async function save(e: SubmitEvent) {
		e.preventDefault();
		if (!itemId) return;
		await create('serviceRecords', {
			vehicleId,
			itemId: itemId === ONE_OFF ? null : itemId,
			title: itemId === ONE_OFF ? title.trim() : null,
			date,
			odometer: odometer ?? knownOdometer ?? 0,
			cost: cost ?? null,
			currency: cost != null ? '€' : null,
			notes: notes.trim() || undefined,
			attachments: []
		});
		goto(`/vehicle/${vehicleId}`);
	}
</script>

<svelte:head><title>{t('log_service')}</title></svelte:head>

<PageHeader title={t('log_service')} back="/vehicle/{vehicleId}" />

<form onsubmit={save} class="flex flex-col gap-4">
	<label class="block">
		<span class="mb-1 block text-sm font-medium text-ink-soft">{t('what_was_done')}</span>
		<select
			bind:value={itemId}
			required
			class="w-full appearance-none rounded-xl border border-line bg-card px-3 py-2.5 outline-none focus:border-teal"
		>
			<option value="" disabled>{t('choose')}</option>
			{#each data.value.items as item (item.id)}
				<option value={item.id}>{item.name}</option>
			{/each}
			<option value={ONE_OFF}>{t('one_off_option')}</option>
		</select>
	</label>

	{#if itemId === ONE_OFF}
		<label class="block">
			<span class="mb-1 block text-sm font-medium text-ink-soft">{t('describe_service')}</span>
			<input
				bind:value={title}
				required
				placeholder={t('describe_placeholder')}
				class="w-full rounded-xl border border-line bg-card px-3 py-2.5 outline-none focus:border-teal"
			/>
		</label>
	{/if}

	<div class="grid grid-cols-2 gap-3">
		<label class="block">
			<span class="mb-1 block text-sm font-medium text-ink-soft">{t('field_date')}</span>
			<input
				bind:value={date}
				type="date"
				required
				max={todayLocal()}
				class="w-full rounded-xl border border-line bg-card px-3 py-2.5 outline-none focus:border-teal"
			/>
		</label>
		<label class="block">
			<span class="mb-1 block text-sm font-medium text-ink-soft">
				{t('odometer_with_unit', { unit: data.value.vehicle?.odometerUnit ?? 'km' })}
			</span>
			<input
				bind:value={odometer}
				type="number"
				inputmode="numeric"
				min="0"
				placeholder={knownOdometer != null ? String(knownOdometer) : ''}
				class="w-full rounded-xl border border-line bg-card px-3 py-2.5 outline-none focus:border-teal"
			/>
		</label>
	</div>

	<label class="block">
		<span class="mb-1 block text-sm font-medium text-ink-soft"
			>{t('field_cost')} <span class="font-normal text-ink-faint">{t('cost_unit_hint')}</span></span
		>
		<input
			bind:value={cost}
			type="number"
			inputmode="decimal"
			min="0"
			step="0.01"
			class="w-full rounded-xl border border-line bg-card px-3 py-2.5 outline-none focus:border-teal"
		/>
	</label>

	<label class="block">
		<span class="mb-1 block text-sm font-medium text-ink-soft"
			>{t('field_notes')} <span class="font-normal text-ink-faint">{t('optional')}</span></span
		>
		<textarea
			bind:value={notes}
			rows="2"
			class="w-full rounded-xl border border-line bg-card px-3 py-2.5 outline-none focus:border-teal"
		></textarea>
	</label>

	<button
		type="submit"
		class="mt-2 rounded-full bg-teal py-3 font-medium text-teal-soft active:scale-95"
	>
		{t('save_service')}
	</button>
</form>
