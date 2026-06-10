<script lang="ts">
	import { goto } from '$app/navigation';
	import { create } from '$lib/db/repo';
	import PageHeader from '$lib/ui/PageHeader.svelte';
	import VehicleForm, { type VehicleFormValues } from '$lib/ui/VehicleForm.svelte';
	import { t } from '$lib/i18n/index.svelte';

	async function save(v: VehicleFormValues) {
		const vehicleId = await create('vehicles', {
			name: v.name,
			make: v.make || undefined,
			model: v.model || undefined,
			year: v.year,
			plate: v.plate || undefined,
			odometerUnit: v.odometerUnit
		});
		if (v.odometer != null) {
			await create('mileageEntries', {
				vehicleId,
				odometer: v.odometer,
				recordedAt: new Date().toISOString()
			});
		}
		goto(`/vehicle/${vehicleId}/item/new?setup=1`, { replaceState: true });
	}
</script>

<svelte:head><title>{t('add_vehicle')}</title></svelte:head>

<PageHeader title={t('add_vehicle')} back="/" />
<VehicleForm showOdometer submitLabel={t('add_vehicle')} onsubmit={save} />
