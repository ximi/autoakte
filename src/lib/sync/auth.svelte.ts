import type { User } from '@supabase/supabase-js';
import { supabase } from './client';
import { resetSyncCheckpoint, syncNow } from './engine.svelte';
import { migrateAnonymousPushToAccount } from './push-subscribe';

export const authState = $state({
	user: null as User | null,
	ready: false
});

/** Call once per app load; returns a cleanup function. */
export function startAuthListener(): () => void {
	if (!supabase) {
		authState.ready = true;
		return () => {};
	}
	const {
		data: { subscription }
	} = supabase.auth.onAuthStateChange((_event, session) => {
		authState.user = session?.user ?? null;
		authState.ready = true;
	});
	return () => subscription.unsubscribe();
}

/** Sends a 6-digit code to the email; creates the account on first use. */
export async function requestCode(email: string): Promise<{ error: string | null }> {
	if (!supabase) return { error: 'Sync is not configured.' };
	const { error } = await supabase.auth.signInWithOtp({
		email,
		options: { shouldCreateUser: true }
	});
	return { error: error?.message ?? null };
}

export async function verifyCode(email: string, token: string): Promise<{ error: string | null }> {
	if (!supabase) return { error: 'Sync is not configured.' };
	// Full bidirectional merge on (re-)sign-in: local rows may predate the
	// account, or the previous session may have synced to a different one.
	await resetSyncCheckpoint();
	const { error } = await supabase.auth.verifyOtp({ email, token, type: 'email' });
	if (!error) {
		void syncNow();
		void migrateAnonymousPushToAccount();
	}
	return { error: error?.message ?? null };
}

export async function signOut(): Promise<void> {
	if (!supabase) return;
	await supabase.auth.signOut();
	await resetSyncCheckpoint();
}
