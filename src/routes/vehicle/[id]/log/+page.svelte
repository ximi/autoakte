<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { create } from '$lib/db/repo';
	import { live } from '$lib/db/live.svelte';
	import { currentOdometer, mileagePoints } from '$lib/domain/mileage';
	import { todayLocal } from '$lib/domain/time';
	import { EMPTY_BUNDLE, vehicleBundle } from '$lib/queries';
	import PageHeader from '$lib/ui/PageHeader.svelte';

	const vehicleId = $derived(page.params.id!);
	const data = live(() => vehicleBundle(vehicleId), EMPTY_BUNDLE);

	let itemId = $state(page.url.searchParams.get('item') ?? '');
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
			itemId,
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

<svelte:head><title>Log service</title></svelte:head>

<PageHeader title="Log service" back="/vehicle/{vehicleId}" />

{#if data.value.items.length === 0}
	<p class="text-sm text-ink-faint">
		No maintenance items yet —
		<a href="/vehicle/{vehicleId}/item/new" class="font-medium text-teal">add one first</a>.
	</p>
{:else}
	<form onsubmit={save} class="flex flex-col gap-4">
		<label class="block">
			<span class="mb-1 block text-sm font-medium text-ink-soft">What was done?</span>
			<select
				bind:value={itemId}
				required
				class="w-full appearance-none rounded-xl border border-line bg-card px-3 py-2.5 outline-none focus:border-teal"
			>
				<option value="" disabled>Choose…</option>
				{#each data.value.items as item (item.id)}
					<option value={item.id}>{item.name}</option>
				{/each}
			</select>
		</label>

		<div class="grid grid-cols-2 gap-3">
			<label class="block">
				<span class="mb-1 block text-sm font-medium text-ink-soft">Date</span>
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
					Odometer ({data.value.vehicle?.odometerUnit ?? 'km'})
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
				>Cost <span class="font-normal text-ink-faint">(optional, €)</span></span
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
				>Notes <span class="font-normal text-ink-faint">(optional)</span></span
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
			Save service
		</button>
	</form>
{/if}
