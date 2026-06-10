<script lang="ts">
	import { useRegisterSW } from 'virtual:pwa-register/svelte';
	import { t } from '$lib/i18n/index.svelte';

	const { needRefresh, updateServiceWorker } = useRegisterSW({
		onRegisterError(error: unknown) {
			console.error('Service worker registration failed', error);
		}
	});
</script>

{#if $needRefresh}
	<div
		class="fixed inset-x-4 bottom-20 z-20 mx-auto flex max-w-md items-center justify-between gap-3 rounded-2xl border border-line bg-card p-3 shadow-lg"
		role="alert"
	>
		<p class="text-sm">{t('update_available')}</p>
		<button
			onclick={() => updateServiceWorker(true)}
			class="shrink-0 rounded-full bg-teal px-4 py-2 text-sm font-medium text-teal-soft active:scale-95"
		>
			{t('update')}
		</button>
	</div>
{/if}
