<script lang="ts">
	import type { MaintenanceItem, OdometerUnit } from '$lib/domain/types';
	import { todayLocal } from '$lib/domain/time';

	export interface ItemFormValues {
		name: string;
		intervalKm: number | null;
		intervalMonths: number | null;
		anchorDate: string | null;
		anchorOdometer: number | null;
	}

	let {
		item = null,
		unit,
		defaultOdometer = null,
		submitLabel,
		onsubmit
	}: {
		item?: MaintenanceItem | null;
		unit: OdometerUnit;
		defaultOdometer?: number | null;
		submitLabel: string;
		onsubmit: (values: ItemFormValues) => void;
	} = $props();

	// Form state is intentionally seeded from the initial prop value; callers
	// re-mount the form with {#key} when the item changes.
	/* svelte-ignore state_referenced_locally */
	let name = $state(item?.name ?? '');
	/* svelte-ignore state_referenced_locally */
	let intervalKm = $state<number | undefined>(item?.intervalKm ?? undefined);
	/* svelte-ignore state_referenced_locally */
	let intervalMonths = $state<number | undefined>(item?.intervalMonths ?? undefined);
	/* svelte-ignore state_referenced_locally */
	let anchorDate = $state(item?.anchorDate ?? todayLocal());
	/* svelte-ignore state_referenced_locally */
	let anchorOdometer = $state<number | undefined>(
		item?.anchorOdometer ?? defaultOdometer ?? undefined
	);
	let error = $state('');

	function submit(e: SubmitEvent) {
		e.preventDefault();
		if (intervalKm == null && intervalMonths == null) {
			error = 'Set a distance interval, a time interval, or both.';
			return;
		}
		error = '';
		onsubmit({
			name: name.trim(),
			intervalKm: intervalKm ?? null,
			intervalMonths: intervalMonths ?? null,
			anchorDate: anchorDate || null,
			anchorOdometer: anchorOdometer ?? null
		});
	}
</script>

<form onsubmit={submit} class="flex flex-col gap-4">
	<label class="block">
		<span class="mb-1 block text-sm font-medium text-ink-soft">Name</span>
		<input
			bind:value={name}
			required
			placeholder="e.g. Oil & filter change"
			class="w-full rounded-xl border border-line bg-card px-3 py-2.5 outline-none focus:border-teal"
		/>
	</label>

	<div class="grid grid-cols-2 gap-3">
		<label class="block">
			<span class="mb-1 block text-sm font-medium text-ink-soft">Every … {unit}</span>
			<input
				bind:value={intervalKm}
				type="number"
				inputmode="numeric"
				min="1"
				placeholder="15000"
				class="w-full rounded-xl border border-line bg-card px-3 py-2.5 outline-none focus:border-teal"
			/>
		</label>
		<label class="block">
			<span class="mb-1 block text-sm font-medium text-ink-soft">Every … months</span>
			<input
				bind:value={intervalMonths}
				type="number"
				inputmode="numeric"
				min="1"
				placeholder="12"
				class="w-full rounded-xl border border-line bg-card px-3 py-2.5 outline-none focus:border-teal"
			/>
		</label>
	</div>
	<p class="-mt-2 text-xs text-ink-faint">With both set, whichever comes first applies.</p>

	<div class="grid grid-cols-2 gap-3">
		<label class="block">
			<span class="mb-1 block text-sm font-medium text-ink-soft">Last done on</span>
			<input
				bind:value={anchorDate}
				type="date"
				class="w-full rounded-xl border border-line bg-card px-3 py-2.5 outline-none focus:border-teal"
			/>
		</label>
		<label class="block">
			<span class="mb-1 block text-sm font-medium text-ink-soft">… at ({unit})</span>
			<input
				bind:value={anchorOdometer}
				type="number"
				inputmode="numeric"
				min="0"
				class="w-full rounded-xl border border-line bg-card px-3 py-2.5 outline-none focus:border-teal"
			/>
		</label>
	</div>
	<p class="-mt-2 text-xs text-ink-faint">
		If you're not sure, leave today's values — tracking starts from now.
	</p>

	{#if error}
		<p class="text-sm text-danger">{error}</p>
	{/if}

	<button
		type="submit"
		class="mt-1 rounded-full bg-teal py-3 font-medium text-teal-soft active:scale-95"
	>
		{submitLabel}
	</button>
</form>
