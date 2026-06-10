<script lang="ts">
	import type { DueStatus } from '$lib/domain/types';

	let { status, label }: { status: DueStatus; label: string } = $props();

	const styles: Record<DueStatus, string> = {
		ok: 'bg-teal-soft text-teal-deep',
		due_soon: 'bg-warn-soft text-warn',
		overdue: 'bg-danger-soft text-danger'
	};
</script>

<span class="rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap {styles[status]}">
	{label}
</span>
