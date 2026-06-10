<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { db } from '$lib/db/db';
	import { live } from '$lib/db/live.svelte';
	import { removeVehicle, update } from '$lib/db/repo';
	import PageHeader from '$lib/ui/PageHeader.svelte';
	import VehicleForm, { type VehicleFormValues } from '$lib/ui/VehicleForm.svelte';
	import { t } from '$lib/i18n/index.svelte';

	const vehicleId = $derived(page.params.id!);
	const vehicle = live(() => db.vehicles.get(vehicleId), undefined);

	async function save(v: VehicleFormValues) {
		await update('vehicles', vehicleId, {
			name: v.name,
			make: v.make || undefined,
			model: v.model || undefined,
			year: v.year,
			plate: v.plate || undefined,
			odometerUnit: v.odometerUnit
		});
		goto(`/vehicle/${vehicleId}`);
	}

	async function deleteVehicle() {
		if (!confirm(t('delete_vehicle_confirm', { name: vehicle.value?.name ?? '' }))) return;
		await removeVehicle(vehicleId);
		goto('/');
	}
</script>

<svelte:head><title>{t('edit_vehicle')}</title></svelte:head>

<PageHeader title={t('edit_vehicle')} back="/vehicle/{vehicleId}" />

{#if vehicle.value}
	{#key vehicle.value.id}
		<VehicleForm vehicle={vehicle.value} submitLabel={t('save_changes')} onsubmit={save} />
	{/key}

	<button
		onclick={deleteVehicle}
		class="mt-8 w-full rounded-full border border-danger/30 py-3 text-sm font-medium text-danger active:scale-95"
	>
		{t('delete_vehicle')}
	</button>
{/if}
