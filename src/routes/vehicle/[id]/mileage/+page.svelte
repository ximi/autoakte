<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { create } from '$lib/db/repo';
	import { live } from '$lib/db/live.svelte';
	import { currentOdometer, mileagePoints } from '$lib/domain/mileage';
	import { formatDistance } from '$lib/format';
	import { EMPTY_BUNDLE, vehicleBundle } from '$lib/queries';
	import PageHeader from '$lib/ui/PageHeader.svelte';

	const vehicleId = $derived(page.params.id!);
	const data = live(() => vehicleBundle(vehicleId), EMPTY_BUNDLE);

	let odometer = $state<number | undefined>(undefined);

	const unit = $derived(data.value.vehicle?.odometerUnit ?? 'km');
	const known = $derived(
		currentOdometer(mileagePoints(data.value.records, data.value.entries), data.value.items)
	);
	const lower = $derived(odometer != null && known != null && odometer < known);

	async function save(e: SubmitEvent) {
		e.preventDefault();
		if (odometer == null) return;
		await create('mileageEntries', {
			vehicleId,
			odometer,
			recordedAt: new Date().toISOString()
		});
		goto(`/vehicle/${vehicleId}`);
	}
</script>

<svelte:head><title>Enter mileage</title></svelte:head>

<PageHeader title="Enter mileage" back="/vehicle/{vehicleId}" />

<form onsubmit={save} class="flex flex-col gap-4">
	<label class="block">
		<span class="mb-1 block text-sm font-medium text-ink-soft">
			Current odometer of {data.value.vehicle?.name ?? 'vehicle'} ({unit})
		</span>
		<input
			bind:value={odometer}
			type="number"
			inputmode="numeric"
			min="0"
			required
			placeholder={known != null ? String(known) : '0'}
			class="w-full rounded-xl border border-line bg-card px-3 py-4 text-center text-3xl font-semibold outline-none focus:border-teal"
		/>
	</label>

	{#if known != null}
		<p class="text-center text-xs text-ink-faint">Last known: {formatDistance(known, unit)}</p>
	{/if}

	{#if lower}
		<p class="rounded-xl bg-warn-soft px-3 py-2 text-sm text-warn">
			That's lower than the last known reading — double-check before saving.
		</p>
	{/if}

	<button
		type="submit"
		class="mt-2 rounded-full bg-teal py-3 font-medium text-teal-soft active:scale-95"
	>
		Save reading
	</button>
</form>
