<script lang="ts">
	import './layout.css';
	import { pwaInfo } from 'virtual:pwa-info';
	import ReloadPrompt from '$lib/ui/ReloadPrompt.svelte';
	import { startAuthListener } from '$lib/sync/auth.svelte';
	import { startSyncTriggers } from '$lib/sync/engine.svelte';

	let { children } = $props();

	const webManifestLink = $derived(pwaInfo ? pwaInfo.webManifest.linkTag : '');

	$effect(() => {
		const stopAuth = startAuthListener();
		const stopSync = startSyncTriggers();
		return () => {
			stopAuth();
			stopSync();
		};
	});
</script>

<svelte:head>
	<link rel="icon" type="image/png" href="/icons/favicon-96.png" />
	<!-- eslint-disable-next-line svelte/no-at-html-tags -- linkTag is plugin-generated, not user input -->
	{@html webManifestLink}
</svelte:head>

<div class="mx-auto min-h-dvh w-full max-w-md px-4 pb-24">
	{@render children()}
</div>

<ReloadPrompt />
