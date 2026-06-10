<script lang="ts">
	import { page } from '$app/state';
	import { live } from '$lib/db/live.svelte';
	import { computeDueStates } from '$lib/domain/due';
	import { currentOdometer, estimateDailyRate, mileagePoints } from '$lib/domain/mileage';
	import { todayLocal } from '$lib/domain/time';
	import { dueLabel, formatDate, formatDistance } from '$lib/format';
	import { toDateOnly } from '$lib/domain/time';
	import { EMPTY_BUNDLE, vehicleBundle } from '$lib/queries';
	import PageHeader from '$lib/ui/PageHeader.svelte';
	import StatusBadge from '$lib/ui/StatusBadge.svelte';
	import { i18n, t } from '$lib/i18n/index.svelte';

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
	const itemName = $derived(new Map(data.value.items.map((i) => [i.id, i.name])));
	const history = $derived(
		[
			...data.value.records.map((r) => ({
				id: r.id,
				kind: 'service' as const,
				date: r.date,
				sortKey: `${r.date}~${r.createdAt}`,
				label: r.itemId
					? (itemName.get(r.itemId) ?? t('service_fallback'))
					: (r.title ?? t('service_fallback')),
				odometer: r.odometer,
				cost: r.cost,
				currency: r.currency
			})),
			...data.value.entries.map((e) => ({
				id: e.id,
				kind: 'mileage' as const,
				date: toDateOnly(e.recordedAt),
				sortKey: `${toDateOnly(e.recordedAt)}~${e.createdAt}`,
				label: t('odometer_reading'),
				odometer: e.odometer,
				cost: null,
				currency: null
			}))
		]
			.sort((a, b) => (a.sortKey < b.sortKey ? 1 : -1))
			.slice(0, 12)
	);
	const sortedItems = $derived(
		[...data.value.items].sort((a, b) => {
			const sa = states.get(a.id)?.daysRemaining ?? Infinity;
			const sb = states.get(b.id)?.daysRemaining ?? Infinity;
			return sa - sb;
		})
	);
</script>

<svelte:head><title>{vehicle?.name ?? t('vehicle_fallback')}</title></svelte:head>

{#if vehicle}
	<PageHeader title={vehicle.name} back="/">
		{#snippet action()}
			<a href="/vehicle/{vehicleId}/edit" class="text-sm font-medium text-teal">{t('edit')}</a>
		{/snippet}
	</PageHeader>

	<div class="mb-4 rounded-2xl border border-line bg-card p-4">
		<p class="text-xs text-ink-faint">
			{[vehicle.make, vehicle.model, vehicle.year].filter(Boolean).join(' ') || t('odometer')}
		</p>
		<p class="mt-1 text-2xl font-semibold">
			{odometer != null ? formatDistance(odometer, vehicle.odometerUnit) : '—'}
		</p>
		{#if rate != null}
			<p class="mt-0.5 text-xs text-ink-faint">
				{t('per_day', { n: Math.round(rate), unit: vehicle.odometerUnit })}
			</p>
		{/if}
		<div class="mt-3 grid grid-cols-2 gap-2">
			<a
				href="/vehicle/{vehicleId}/mileage"
				class="rounded-full border border-teal py-2 text-center text-sm font-medium text-teal active:scale-95"
			>
				{t('enter_mileage')}
			</a>
			<a
				href="/vehicle/{vehicleId}/log"
				class="rounded-full bg-teal py-2 text-center text-sm font-medium text-teal-soft active:scale-95"
			>
				{t('log_service')}
			</a>
		</div>
	</div>

	<section class="mb-4 rounded-2xl border border-line bg-card p-4">
		<div class="mb-1 flex items-center justify-between">
			<h2 class="text-xs font-medium tracking-wide text-ink-faint uppercase">{t('maintenance')}</h2>
			<a href="/vehicle/{vehicleId}/item/new" class="text-sm font-medium text-teal"
				>{t('add_short')}</a
			>
		</div>
		{#if sortedItems.length === 0}
			<p class="py-3 text-sm text-ink-faint">
				{t('no_items_yet')}
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
								<StatusBadge
									status={s.status}
									label={dueLabel(s, vehicle.odometerUnit, i18n.locale)}
								/>
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
				{t('history')}
			</h2>
			<ul class="divide-y divide-line-soft">
				{#each history as entry (entry.id)}
					<li class="py-3">
						<div class="flex items-center justify-between gap-2 text-sm">
							<span
								class="min-w-0 truncate {entry.kind === 'mileage' ? 'text-ink-faint italic' : ''}"
								>{entry.label}</span
							>
							<span class="shrink-0 text-ink-faint">{formatDate(entry.date)}</span>
						</div>
						<p class="mt-0.5 text-xs text-ink-faint">
							{formatDistance(entry.odometer, vehicle.odometerUnit)}
							{#if entry.cost != null}
								· {entry.cost.toLocaleString()} {entry.currency ?? '€'}
							{/if}
						</p>
					</li>
				{/each}
			</ul>
		</section>
	{/if}
{:else}
	<PageHeader title={t('vehicle_fallback')} back="/" />
	<p class="text-sm text-ink-faint">{t('vehicle_not_found')}</p>
{/if}
