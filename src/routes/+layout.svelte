<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { pwaInfo } from 'virtual:pwa-info';
	import ReloadPrompt from '$lib/ui/ReloadPrompt.svelte';

	let { children } = $props();

	const webManifestLink = $derived(pwaInfo ? pwaInfo.webManifest.linkTag : '');
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<!-- eslint-disable-next-line svelte/no-at-html-tags -- linkTag is plugin-generated, not user input -->
	{@html webManifestLink}
</svelte:head>

<div class="mx-auto min-h-dvh w-full max-w-md px-4 pb-24">
	{@render children()}
</div>

<ReloadPrompt />
