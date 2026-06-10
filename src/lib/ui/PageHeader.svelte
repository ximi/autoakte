<script lang="ts">
	import type { Snippet } from 'svelte';
	import { t } from '$lib/i18n/index.svelte';

	let { title, back, action }: { title: string; back?: string; action?: Snippet } = $props();
</script>

<header class="flex items-center gap-3 pt-5 pb-4">
	{#if back}
		<a
			href={back}
			aria-label={t('back')}
			class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-line bg-card text-ink-soft active:scale-95"
		>
			<svg
				width="16"
				height="16"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2.5"
				stroke-linecap="round"
				stroke-linejoin="round"
				aria-hidden="true"
			>
				<path d="M15 18l-6-6 6-6" />
			</svg>
		</a>
	{/if}
	<h1 class="min-w-0 flex-1 truncate text-xl font-semibold">{title}</h1>
	{#if action}{@render action()}{/if}
</header>
