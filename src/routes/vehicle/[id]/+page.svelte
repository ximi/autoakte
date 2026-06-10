<script lang="ts">
	import { page } from '$app/state';
	import { live } from '$lib/db/live.svelte';
	import { computeDueStates } from '$lib/domain/due';
	import { currentOdometer, estimateDailyRate, mileagePoints } from '$lib/domain/mileage';
	import { todayLocal } from '$lib/domain/time';
	import { dueLabel, formatDate, formatDistance } from '$lib/format';
	import { EMPTY_BUNDLE, vehicleBundle } from '$lib/queries';
	import PageHeader from '$lib/ui/PageHeader.svelte';
	import StatusBadge from '$lib/ui/StatusBadge.svelte';

	const vehicleId = $derived(page.params.id!);
	const data = live(() => vehicleBundle(vehicleId), EMPTY_BUNDLE);
	const today = todayLocal();

	const vehicle = $derived(data.value.vehicle);
	const points = $derived(mileagePoints(data.value.records, data.value.entries));
	const odometer = $derived(currentOdometer(points, data.value.items));
	const rate = $derived(estimateDailyRate(points, today));
	const states = $derived(
		vehicle
			? new Map(
					computeDueStates(
						data.value.items,
						data.value.records,
						data.value.entries,
						vehicle.odometerUnit,
						today
					).map((s) => [s.itemId, s])
				)
			: new Map()
	);
	const history = $derived(
		[...data.value.records].sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 8)
	);
	const itemName = $derived(new Map(data.value.items.map((i) => [i.id, i.name])));
	const sortedItems = $derived(
		[...data.value.items].sort((a, b) => {
			const sa = states.get(a.id)?.daysRemaining ?? Infinity;
			const sb = states.get(b.id)?.daysRemaining ?? Infinity;
			return sa - sb;
		})
	);
</script>

<svelte:head><title>{vehicle?.name ?? 'Vehicle'}</title></svelte:head>

{#if vehicle}
	<PageHeader title={vehicle.name} back="/">
		{#snippet action()}
			<a href="/vehicle/{vehicleId}/edit" class="text-sm font-medium text-teal">Edit</a>
		{/snippet}
	</PageHeader>

	<div class="mb-4 rounded-2xl border border-line bg-card p-4">
		<p class="text-xs text-ink-faint">
			{[vehicle.make, vehicle.model, vehicle.year].filter(Boolean).join(' ') || 'Odometer'}
		</p>
		<p class="mt-1 text-2xl font-semibold">
			{odometer != null ? formatDistance(odometer, vehicle.odometerUnit) : '—'}
		</p>
		{#if rate != null}
			<p class="mt-0.5 text-xs text-ink-faint">~{Math.round(rate)} {vehicle.odometerUnit}/day</p>
		{/if}
		<div class="mt-3 grid grid-cols-2 gap-2">
			<a
				href="/vehicle/{vehicleId}/mileage"
				class="rounded-full border border-teal py-2 text-center text-sm font-medium text-teal active:scale-95"
			>
				Enter mileage
			</a>
			<a
				href="/vehicle/{vehicleId}/log"
				class="rounded-full bg-teal py-2 text-center text-sm font-medium text-teal-soft active:scale-95"
			>
				Log service
			</a>
		</div>
	</div>

	<section class="mb-4 rounded-2xl border border-line bg-card p-4">
		<div class="mb-1 flex items-center justify-between">
			<h2 class="text-xs font-medium tracking-wide text-ink-faint uppercase">Maintenance</h2>
			<a href="/vehicle/{vehicleId}/item/new" class="text-sm font-medium text-teal">+ Add</a>
		</div>
		{#if sortedItems.length === 0}
			<p class="py-3 text-sm text-ink-faint">
				No maintenance items yet — add what you want to track.
			</p>
		{:else}
			<ul class="divide-y divide-line-soft">
				{#each sortedItems as item (item.id)}
					{@const s = states.get(item.id)}
					<li>
						<a
							href="/vehicle/{vehicleId}/item/{item.id}"
							class="flex items-center justify-between gap-2 py-3"
						>
							<span class="min-w-0 truncate text-sm">{item.name}</span>
							{#if s}
								<StatusBadge status={s.status} label={dueLabel(s, vehicle.odometerUnit)} />
							{/if}
						</a>
					</li>
				{/each}
			</ul>
		{/if}
	</section>

	{#if history.length > 0}
		<section class="rounded-2xl border border-line bg-card p-4">
			<h2 class="mb-1 text-xs font-medium tracking-wide text-ink-faint uppercase">
				Recent services
			</h2>
			<ul class="divide-y divide-line-soft">
				{#each history as record (record.id)}
					<li class="py-3">
						<div class="flex items-center justify-between gap-2 text-sm">
							<span class="min-w-0 truncate">{itemName.get(record.itemId) ?? 'Service'}</span>
							<span class="shrink-0 text-ink-faint">{formatDate(record.date)}</span>
						</div>
						<p class="mt-0.5 text-xs text-ink-faint">
							{formatDistance(record.odometer, vehicle.odometerUnit)}
							{#if record.cost != null}
								· {record.cost.toLocaleString()} {record.currency ?? '€'}
							{/if}
						</p>
					</li>
				{/each}
			</ul>
		</section>
	{/if}
{:else}
	<PageHeader title="Vehicle" back="/" />
	<p class="text-sm text-ink-faint">Vehicle not found.</p>
{/if}
