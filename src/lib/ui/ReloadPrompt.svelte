<script lang="ts">
	import { useRegisterSW } from 'virtual:pwa-register/svelte';
	import { t } from '$lib/i18n/index.svelte';

	const { needRefresh } = useRegisterSW({
		onRegisterError(error: unknown) {
			console.error('Service worker registration failed', error);
		}
	});

	let busy = $state(false);

	// Hand-rolled update flow: message the waiting worker directly and reload
	// only once it has actually activated (registration.waiting clears). The
	// vite-pwa helper re-fetches sw.js first, which on slow connections lets
	// any fallback reload win the race and land back on the old version.
	async function applyUpdate() {
		busy = true;
		const reg = await navigator.serviceWorker.getRegistration();
		const waiting = reg?.waiting;
		if (!reg || !waiting) {
			window.location.reload();
			return;
		}

		let reloaded = false;
		const reload = () => {
			if (reloaded) return;
			reloaded = true;
			window.location.reload();
		};

		navigator.serviceWorker.addEventListener('controllerchange', reload, { once: true });
		waiting.postMessage({ type: 'SKIP_WAITING' });

		// Fallback for browsers where controllerchange doesn't fire: the waiting
		// slot clears when the new worker activates — then a reload picks it up.
		const started = Date.now();
		const timer = setInterval(() => {
			if (!reg.waiting || Date.now() - started > 8000) {
				clearInterval(timer);
				reload();
			}
		}, 250);
	}
</script>

{#if $needRefresh}
	<div
		class="fixed inset-x-4 bottom-20 z-20 mx-auto flex max-w-md items-center justify-between gap-3 rounded-2xl border border-line bg-card p-3 shadow-lg"
		role="alert"
	>
		<p class="text-sm">{t('update_available')}</p>
		<button
			onclick={applyUpdate}
			disabled={busy}
			class="shrink-0 rounded-full bg-teal px-4 py-2 text-sm font-medium text-teal-soft active:scale-95 disabled:opacity-50"
		>
			{busy ? '…' : t('update')}
		</button>
	</div>
{/if}
