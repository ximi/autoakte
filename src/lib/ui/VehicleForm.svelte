<script lang="ts">
	import { BRAND_NAMES, modelsForBrand } from '$lib/domain/car-data';
	import type { OdometerUnit, Vehicle } from '$lib/domain/types';
	import Autocomplete from './Autocomplete.svelte';

	export interface VehicleFormValues {
		name: string;
		make: string;
		model: string;
		year: number | undefined;
		plate: string;
		odometerUnit: OdometerUnit;
		odometer: number | undefined;
	}

	let {
		vehicle = null,
		showOdometer = false,
		submitLabel,
		onsubmit
	}: {
		vehicle?: Vehicle | null;
		showOdometer?: boolean;
		submitLabel: string;
		onsubmit: (values: VehicleFormValues) => void;
	} = $props();

	// Form state is intentionally seeded from the initial prop value; callers
	// re-mount the form with {#key} when the vehicle changes.
	/* svelte-ignore state_referenced_locally */
	let name = $state(vehicle?.name ?? '');
	/* svelte-ignore state_referenced_locally */
	let make = $state(vehicle?.make ?? '');
	/* svelte-ignore state_referenced_locally */
	let model = $state(vehicle?.model ?? '');
	/* svelte-ignore state_referenced_locally */
	let year = $state<number | undefined>(vehicle?.year);
	/* svelte-ignore state_referenced_locally */
	let plate = $state(vehicle?.plate ?? '');
	/* svelte-ignore state_referenced_locally */
	let odometerUnit = $state<OdometerUnit>(vehicle?.odometerUnit ?? 'km');
	let odometer = $state<number | undefined>(undefined);

	function submit(e: SubmitEvent) {
		e.preventDefault();
		onsubmit({
			name: name.trim(),
			make: make.trim(),
			model: model.trim(),
			year,
			plate: plate.trim(),
			odometerUnit,
			odometer
		});
	}
</script>

<form onsubmit={submit} class="flex flex-col gap-4">
	<label class="block">
		<span class="mb-1 block text-sm font-medium text-ink-soft">Name</span>
		<input
			bind:value={name}
			required
			placeholder="e.g. Golf VII"
			class="w-full rounded-xl border border-line bg-card px-3 py-2.5 outline-none focus:border-teal"
		/>
	</label>

	<div class="grid grid-cols-2 gap-3">
		<div>
			<span class="mb-1 block text-sm font-medium text-ink-soft">Make</span>
			<Autocomplete bind:value={make} options={BRAND_NAMES} placeholder="Volkswagen" />
		</div>
		<div>
			<span class="mb-1 block text-sm font-medium text-ink-soft">Model</span>
			<Autocomplete bind:value={model} options={modelsForBrand(make)} placeholder="Golf" />
		</div>
	</div>

	<div class="grid grid-cols-2 gap-3">
		<label class="block">
			<span class="mb-1 block text-sm font-medium text-ink-soft">Year</span>
			<input
				bind:value={year}
				type="number"
				inputmode="numeric"
				min="1900"
				max="2100"
				placeholder="2017"
				class="w-full rounded-xl border border-line bg-card px-3 py-2.5 outline-none focus:border-teal"
			/>
		</label>
		<label class="block">
			<span class="mb-1 block text-sm font-medium text-ink-soft"
				>Plate <span class="font-normal text-ink-faint">(optional)</span></span
			>
			<input
				bind:value={plate}
				class="w-full rounded-xl border border-line bg-card px-3 py-2.5 outline-none focus:border-teal"
			/>
		</label>
	</div>

	<fieldset>
		<legend class="mb-1 block text-sm font-medium text-ink-soft">Odometer unit</legend>
		<div class="flex gap-2">
			{#each ['km', 'mi'] as const as unit (unit)}
				<button
					type="button"
					onclick={() => (odometerUnit = unit)}
					class="flex-1 rounded-xl border py-2.5 text-sm font-medium active:scale-95 {odometerUnit ===
					unit
						? 'border-teal bg-teal-soft text-teal-deep'
						: 'border-line bg-card text-ink-soft'}"
				>
					{unit}
				</button>
			{/each}
		</div>
	</fieldset>

	{#if showOdometer}
		<label class="block">
			<span class="mb-1 block text-sm font-medium text-ink-soft"
				>Current odometer ({odometerUnit})</span
			>
			<input
				bind:value={odometer}
				type="number"
				inputmode="numeric"
				min="0"
				required
				placeholder="89240"
				class="w-full rounded-xl border border-line bg-card px-3 py-2.5 outline-none focus:border-teal"
			/>
		</label>
	{/if}

	<button
		type="submit"
		class="mt-2 rounded-full bg-teal py-3 font-medium text-teal-soft active:scale-95"
	>
		{submitLabel}
	</button>
</form>
