<script lang="ts">
	let {
		value = $bindable(''),
		options,
		placeholder = ''
	}: { value?: string; options: string[]; placeholder?: string } = $props();

	let open = $state(false);

	const filtered = $derived.by(() => {
		const q = value.trim().toLowerCase();
		if (!q) return options.slice(0, 8);
		const starts = options.filter((o) => o.toLowerCase().startsWith(q));
		const contains = options.filter(
			(o) => !o.toLowerCase().startsWith(q) && o.toLowerCase().includes(q)
		);
		return [...starts, ...contains].slice(0, 8);
	});

	const showList = $derived(
		open && filtered.length > 0 && !(filtered.length === 1 && filtered[0] === value)
	);

	const listId = `ac-${crypto.randomUUID().slice(0, 8)}`;

	function pick(option: string) {
		value = option;
		open = false;
	}
</script>

<div class="relative">
	<input
		bind:value
		{placeholder}
		role="combobox"
		aria-expanded={showList}
		aria-controls={listId}
		aria-autocomplete="list"
		autocomplete="off"
		autocapitalize="words"
		onfocus={() => (open = true)}
		oninput={() => (open = true)}
		onblur={() => (open = false)}
		class="w-full rounded-xl border border-line bg-card px-3 py-2.5 outline-none focus:border-teal"
	/>
	{#if showList}
		<ul
			role="listbox"
			id={listId}
			class="absolute top-full right-0 left-0 z-10 mt-1 max-h-56 overflow-y-auto rounded-xl border border-line bg-card py-1 shadow-lg"
		>
			{#each filtered as option (option)}
				<li role="option" aria-selected={option === value}>
					<button
						type="button"
						tabindex="-1"
						onpointerdown={(e) => {
							e.preventDefault();
							pick(option);
						}}
						class="w-full px-3 py-2 text-left text-sm active:bg-teal-soft {option === value
							? 'text-teal-deep'
							: ''}"
					>
						{option}
					</button>
				</li>
			{/each}
		</ul>
	{/if}
</div>
