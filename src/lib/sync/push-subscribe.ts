import { PUBLIC_VAPID_PUBLIC_KEY } from '$env/static/public';
import { supabase } from './client';

export function pushSupported(): boolean {
	return (
		typeof window !== 'undefined' &&
		'serviceWorker' in navigator &&
		'PushManager' in window &&
		'Notification' in window &&
		!!PUBLIC_VAPID_PUBLIC_KEY
	);
}

/** iOS Safari only exposes PushManager once the PWA runs from the home screen. */
export function isIOSBrowserTab(): boolean {
	if (typeof window === 'undefined') return false;
	const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
	const standalone =
		(navigator as unknown as { standalone?: boolean }).standalone === true ||
		window.matchMedia('(display-mode: standalone)').matches;
	return ios && !standalone;
}

function applicationServerKey(): Uint8Array {
	const base64 = PUBLIC_VAPID_PUBLIC_KEY.replace(/-/g, '+').replace(/_/g, '/');
	const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
	const raw = atob(padded);
	return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

export async function isPushEnabled(): Promise<boolean> {
	if (!pushSupported()) return false;
	const reg = await navigator.serviceWorker.getRegistration();
	return !!(await reg?.pushManager.getSubscription());
}

/** Must be called from a user gesture (iOS requirement). */
export async function enablePush(reminderDays: number): Promise<{ error: string | null }> {
	if (!supabase) return { error: 'Sync is not configured.' };
	if (!pushSupported()) return { error: 'Push is not supported here.' };
	const permission = await Notification.requestPermission();
	if (permission !== 'granted') return { error: 'Notification permission was denied.' };

	const reg = await navigator.serviceWorker.ready;
	const sub = await reg.pushManager.subscribe({
		userVisibleOnly: true,
		applicationServerKey: applicationServerKey() as BufferSource
	});
	const keys = sub.toJSON().keys;
	if (!keys?.p256dh || !keys.auth) return { error: 'Subscription is missing keys.' };

	const { error } = await supabase.from('push_subscriptions').upsert(
		{
			endpoint: sub.endpoint,
			p256dh: keys.p256dh,
			auth: keys.auth,
			device_label: navigator.userAgent.slice(0, 120),
			enabled: true,
			mileage_reminder_days: reminderDays
		},
		{ onConflict: 'endpoint' }
	);
	return { error: error?.message ?? null };
}

export async function disablePush(): Promise<void> {
	const reg = await navigator.serviceWorker.getRegistration();
	const sub = await reg?.pushManager.getSubscription();
	if (!sub) return;
	if (supabase) await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
	await sub.unsubscribe();
}

/** Best-effort: keep the server-side reminder interval in step with settings. */
export async function updateReminderDays(days: number): Promise<void> {
	if (!supabase) return;
	const reg = await navigator.serviceWorker.getRegistration().catch(() => null);
	const sub = await reg?.pushManager.getSubscription();
	if (!sub) return;
	await supabase
		.from('push_subscriptions')
		.update({ mileage_reminder_days: days })
		.eq('endpoint', sub.endpoint);
}
