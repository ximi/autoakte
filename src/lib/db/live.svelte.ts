import { liveQuery } from 'dexie';

/**
 * Wraps a Dexie liveQuery into Svelte 5 reactive state. Must be called during
 * component initialisation (it uses $effect for subscription lifecycle).
 * The querier re-runs automatically whenever the tables it read change.
 */
export function live<T>(querier: () => Promise<T> | T, initial: T): { readonly value: T } {
	let value = $state.raw(initial);
	$effect(() => {
		const subscription = liveQuery(querier).subscribe({
			next: (v) => (value = v),
			error: (err) => console.error('liveQuery failed', err)
		});
		return () => subscription.unsubscribe();
	});
	return {
		get value() {
			return value;
		}
	};
}
