<script lang="ts">
	import { goto } from '$app/navigation';
	import { APP_NAME } from '$lib/constants';
	import { live } from '$lib/db/live.svelte';
	import { computeDueStates, worstStatus } from '$lib/domain/due';
	import { currentOdometer, estimateDailyRate, mileagePoints } from '$lib/domain/mileage';
	import { todayLocal } from '$lib/domain/time';
	import type { DueStatus, ItemDueState } from '$lib/domain/types';
	import { dueLabel, formatDistance } from '$lib/format';
	import { i18n, t } from '$lib/i18n/index.svelte';
	import { allData, EMPTY_DATA } from '$lib/queries';
	import StatusBadge from '$lib/ui/StatusBadge.svelte';

	const data = live(allData, EMPTY_DATA);
	const today = todayLocal();

	const cards = $derived(
		data.value.vehicles.map((vehicle) => {
			const items = data.value.items.filter((i) => i.vehicleId === vehicle.id);
			const records = data.value.records.filter((r) => r.vehicleId === vehicle.id);
			const entries = data.value.entries.filter((e) => e.vehicleId === vehicle.id);
			const points = mileagePoints(records, entries);
			const states = computeDueStates(items, records, entries, vehicle.odometerUnit, today);
			return {
				vehicle,
				odometer: currentOdometer(points, items),
				rate: estimateDailyRate(points, today),
				states,
				worst: worstStatus(states)
			};
		})
	);

	const itemName = $derived(new Map(data.value.items.map((i) => [i.id, i.name])));
	const attention = $derived(
		cards
			.flatMap((c) =>
				c.states.filter((s) => s.status !== 'ok').map((s) => ({ ...s, vehicle: c.vehicle }))
			)
			.sort((a, b) => (a.status === b.status ? 0 : a.status === 'overdue' ? -1 : 1))
	);

	function badgeFor(states: ItemDueState[], worst: DueStatus): string {
		if (worst === 'overdue')
			return t('n_overdue', { n: states.filter((s) => s.status === 'overdue').length });
		if (worst === 'due_soon')
			return t('n_due_soon', { n: states.filter((s) => s.status === 'due_soon').length });
		return t('all_good');
	}

	let pickerOpen = $state(false);

	function logMileage() {
		if (cards.length === 1) goto(`/vehicle/${cards[0].vehicle.id}/mileage`);
		else pickerOpen = true;
	}
</script>

<svelte:head><title>{APP_NAME}</title></svelte:head>

<header class="flex items-center justify-between pt-5 pb-4">
	<div class="flex items-center gap-2.5">
		<img src="/icons/logo-128.png" alt="" class="h-16 w-16" />
		<h1 class="text-xl font-semibold">{APP_NAME}</h1>
	</div>
	<a
		href="/settings"
		aria-label={t('settings')}
		class="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-card text-ink-soft active:scale-95"
	>
		<svg
			width="17"
			height="17"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
			aria-hidden="true"
		>
			<circle cx="12" cy="12" r="3" />
			<path
				d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"
			/>
		</svg>
	</a>
</header>

{#if cards.length === 0}
	<div class="mt-16 flex flex-col items-center gap-4 text-center">
		<div class="flex h-16 w-16 items-center justify-center rounded-full bg-teal-soft text-teal">
			<svg
				width="28"
				height="28"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
				aria-hidden="true"
			>
				<path
					d="M14 16H9m10 0h3v-3.15a1 1 0 0 0-.84-.99L16 11l-2.7-3.6a1 1 0 0 0-.8-.4H5.24a2 2 0 0 0-1.8 1.1l-.8 1.63A6 6 0 0 0 2 12.42V16h2"
				/>
				<circle cx="6.5" cy="16.5" r="2.5" /><circle cx="16.5" cy="16.5" r="2.5" />
			</svg>
		</div>
		<div>
			<p class="font-medium">{t('no_vehicles_title')}</p>
			<p class="mt-1 text-sm text-ink-faint">{t('no_vehicles_sub')}</p>
		</div>
		<a
			href="/vehicle/new"
			class="rounded-full bg-teal px-6 py-2.5 text-sm font-medium text-teal-soft active:scale-95"
		>
			{t('add_first_vehicle')}
		</a>
	</div>
{:else}
	{#if attention.length > 0}
		{@const hasOverdue = attention.some((s) => s.status === 'overdue')}
		<section
			class="mb-4 rounded-2xl border p-4 {hasOverdue
				? 'border-danger/25 bg-danger-soft/60'
				: 'border-warn-strong/25 bg-warn-soft/60'}"
		>
			<h2
				class="mb-2 flex items-center gap-1.5 text-xs font-medium tracking-wide uppercase {hasOverdue
					? 'text-danger'
					: 'text-warn'}"
			>
				<svg
					width="14"
					height="14"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2.5"
					stroke-linecap="round"
					stroke-linejoin="round"
					aria-hidden="true"
				>
					<path
						d="M10.3 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.7 3.86a2 2 0 0 0-3.4 0z"
					/>
					<line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
				</svg>
				{t('needs_attention')}
			</h2>
			<ul class="divide-y {hasOverdue ? 'divide-danger/10' : 'divide-warn-strong/15'}">
				{#each attention as s (s.itemId)}
					<li>
						<a
							href="/vehicle/{s.vehicle.id}/item/{s.itemId}"
							class="flex items-center justify-between gap-2 py-2.5"
						>
							<span class="min-w-0">
								<span class="block truncate text-sm">{itemName.get(s.itemId)}</span>
								<span class="block text-xs text-ink-faint">{s.vehicle.name}</span>
							</span>
							<StatusBadge
								status={s.status}
								label={dueLabel(s, s.vehicle.odometerUnit, i18n.locale)}
							/>
						</a>
					</li>
				{/each}
			</ul>
		</section>
	{/if}

	<div class="flex flex-col gap-3">
		{#each cards as card (card.vehicle.id)}
			<a
				href="/vehicle/{card.vehicle.id}"
				class="block rounded-2xl border border-line bg-card p-4 active:scale-[0.99]"
			>
				<div class="flex items-center justify-between gap-2">
					<div class="min-w-0">
						<p class="truncate font-medium">{card.vehicle.name}</p>
						<p class="mt-0.5 text-xs text-ink-faint">
							{#if card.odometer != null}
								{formatDistance(card.odometer, card.vehicle.odometerUnit)}
								{#if card.rate != null}
									· {t('per_day', { n: Math.round(card.rate), unit: card.vehicle.odometerUnit })}
								{/if}
							{:else}
								{t('no_mileage_yet')}
							{/if}
						</p>
					</div>
					<StatusBadge status={card.worst} label={badgeFor(card.states, card.worst)} />
				</div>
			</a>
		{/each}
	</div>

	<a href="/vehicle/new" class="mt-3 block py-2 text-center text-sm font-medium text-teal">
		+ {t('add_vehicle')}
	</a>

	<div class="fixed inset-x-0 bottom-6 flex justify-center">
		<button
			onclick={logMileage}
			class="rounded-full bg-teal px-6 py-3 text-sm font-medium text-teal-soft shadow-lg active:scale-95"
		>
			{t('log_mileage')}
		</button>
	</div>

	{#if pickerOpen}
		<div
			class="fixed inset-0 z-10 flex items-end bg-black/30"
			role="presentation"
			onclick={() => (pickerOpen = false)}
		>
			<div
				class="mx-auto w-full max-w-md rounded-t-2xl bg-card p-4 pb-8"
				role="dialog"
				aria-label="Choose vehicle"
			>
				<p class="mb-2 text-sm font-medium text-ink-soft">{t('log_mileage_for')}</p>
				{#each cards as card (card.vehicle.id)}
					<a
						href="/vehicle/{card.vehicle.id}/mileage"
						class="block border-b border-line-soft py-3 last:border-0"
					>
						{card.vehicle.name}
					</a>
				{/each}
			</div>
		</div>
	{/if}
{/if}
