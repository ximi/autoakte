// Tiny write-notification bus: repo emits after every local write, the sync
// engine listens with a debounce. Keeps db/ and sync/ decoupled.

type Listener = () => void;
const listeners = new Set<Listener>();

export function onLocalWrite(listener: Listener): () => void {
	listeners.add(listener);
	return () => listeners.delete(listener);
}

export function emitLocalWrite(): void {
	for (const l of listeners) l();
}
