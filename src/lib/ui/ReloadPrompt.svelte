<script lang="ts">
	import { useRegisterSW } from 'virtual:pwa-register/svelte';
	import { t } from '$lib/i18n/index.svelte';

	const { needRefresh } = useRegisterSW({
		onRegisterError(error: unknown) {
			console.error('Service worker registration failed', error);
		}
	});

	let busy = $state(false);

	// Hand-rolled update flow: message the waiting worker and reload only once
	// it has actually activated. WebKit (iOS) can silently drop messages sent
	// to a worker that isn't running, so we keep re-sending while we wait; if
	// it still won't activate, we replace the registration wholesale — the
	// reload re-registers the new version, and ensurePushSubscription() on the
	// next launch restores the push subscription that unregister() discards.
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
		waiting.addEventListener('statechange', () => {
			if (waiting.state === 'activated') reload();
		});
		waiting.postMessage({ type: 'SKIP_WAITING' });

		const started = Date.now();
		const timer = setInterval(async () => {
			if (reloaded) {
				clearInterval(timer);
				return;
			}
			if (!reg.waiting || waiting.state === 'activated') {
				clearInterval(timer);
				reload();
				return;
			}
			if (Date.now() - started > 6000) {
				clearInterval(timer);
				await reg.unregister();
				reload();
				return;
			}
			waiting.postMessage({ type: 'SKIP_WAITING' });
		}, 750);
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
