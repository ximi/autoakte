import { PUBLIC_VAPID_PUBLIC_KEY } from '$env/static/public';
import { getSetting, setSetting } from '$lib/db/repo';
import { computeSchedule } from '$lib/domain/local-schedule';
import { todayLocal } from '$lib/domain/time';
import { allData } from '$lib/queries';
import { onLocalWrite } from './bus';
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

async function getSubscription(): Promise<PushSubscription | null> {
	const reg = await navigator.serviceWorker.getRegistration().catch(() => null);
	return (await reg?.pushManager.getSubscription()) ?? null;
}

export async function isPushEnabled(): Promise<boolean> {
	if (!pushSupported()) return false;
	return !!(await getSubscription());
}

async function isSignedIn(): Promise<boolean> {
	if (!supabase) return false;
	const {
		data: { session }
	} = await supabase.auth.getSession();
	return !!session;
}

async function getOrCreateDeviceToken(): Promise<string> {
	const existing = await getSetting('pushDeviceToken');
	if (existing) return existing;
	const token = crypto.randomUUID() + crypto.randomUUID();
	await setSetting('pushDeviceToken', token);
	return token;
}

interface SubscriptionKeys {
	endpoint: string;
	p256dh: string;
	auth: string;
}

function subscriptionKeys(sub: PushSubscription): SubscriptionKeys | null {
	const keys = sub.toJSON().keys;
	if (!keys?.p256dh || !keys.auth) return null;
	return { endpoint: sub.endpoint, p256dh: keys.p256dh, auth: keys.auth };
}

/**
 * Accountless path: precompute upcoming notifications from local data and
 * upload only dates + message text, keyed by the device token.
 */
async function uploadDeviceSchedule(keys: SubscriptionKeys): Promise<{ error: string | null }> {
	if (!supabase) return { error: 'Sync is not configured.' };
	const token = await getOrCreateDeviceToken();
	const reminderDays = await getSetting('mileageReminderDays', 14);
	const { vehicles, items, records, entries } = await allData();
	const schedule = computeSchedule(vehicles, items, records, entries, reminderDays, todayLocal());
	const { error } = await supabase.rpc('upsert_device_schedule', {
		device_token: token,
		endpoint: keys.endpoint,
		p256dh: keys.p256dh,
		auth: keys.auth,
		schedule
	});
	return { error: error?.message ?? null };
}

/** Account path: store the subscription; the cron recomputes from synced data. */
async function uploadAccountSubscription(
	keys: SubscriptionKeys
): Promise<{ error: string | null }> {
	const reminderDays = await getSetting('mileageReminderDays', 14);
	const { error } = await supabase!.from('push_subscriptions').upsert(
		{
			...keys,
			device_label: navigator.userAgent.slice(0, 120),
			enabled: true,
			mileage_reminder_days: reminderDays
		},
		{ onConflict: 'endpoint' }
	);
	return { error: error?.message ?? null };
}

/** Must be called from a user gesture (iOS requirement). Works signed-out. */
export async function enablePush(): Promise<{ error: string | null }> {
	if (!supabase) return { error: 'Sync is not configured.' };
	if (!pushSupported()) return { error: 'Push is not supported here.' };
	const permission = await Notification.requestPermission();
	if (permission !== 'granted') return { error: 'Notification permission was denied.' };

	const reg = await navigator.serviceWorker.ready;
	const sub = await reg.pushManager.subscribe({
		userVisibleOnly: true,
		applicationServerKey: applicationServerKey() as BufferSource
	});
	const keys = subscriptionKeys(sub);
	if (!keys) return { error: 'Subscription is missing keys.' };

	return (await isSignedIn()) ? uploadAccountSubscription(keys) : uploadDeviceSchedule(keys);
}

export async function disablePush(): Promise<void> {
	const sub = await getSubscription();
	if (!sub) return;
	if (supabase) {
		await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
		const token = await getSetting('pushDeviceToken');
		if (token) await supabase.rpc('delete_device_schedule', { device_token: token });
	}
	await sub.unsubscribe();
}

/**
 * Re-upload the precomputed schedule so it tracks the latest local data.
 * No-op when push is off or the device is signed in (the cron handles that).
 */
export async function refreshDeviceSchedule(): Promise<void> {
	if (!supabase || !pushSupported()) return;
	if (await isSignedIn()) return;
	const sub = await getSubscription();
	if (!sub) return;
	const keys = subscriptionKeys(sub);
	if (!keys) return;
	const { error } = await uploadDeviceSchedule(keys);
	if (error) console.error('device schedule refresh failed', error);
}

/**
 * On sign-in, an anonymous schedule becomes redundant — replace it with an
 * account subscription so the cron recomputes from synced data.
 */
export async function migrateAnonymousPushToAccount(): Promise<void> {
	if (!supabase || !pushSupported()) return;
	const sub = await getSubscription();
	if (!sub) return;
	const keys = subscriptionKeys(sub);
	if (!keys) return;
	const token = await getSetting('pushDeviceToken');
	if (token) await supabase.rpc('delete_device_schedule', { device_token: token });
	await uploadAccountSubscription(keys);
}

/** Best-effort: keep the server-side reminder interval in step with settings. */
export async function updateReminderDays(days: number): Promise<void> {
	if (!supabase) return;
	const sub = await getSubscription();
	if (!sub) return;
	if (await isSignedIn()) {
		await supabase
			.from('push_subscriptions')
			.update({ mileage_reminder_days: days })
			.eq('endpoint', sub.endpoint);
	} else {
		await refreshDeviceSchedule();
	}
}

/** Wire schedule refreshes; returns a cleanup function. Call once per app load. */
export function startDeviceScheduleTriggers(): () => void {
	if (!supabase) return () => {};
	void refreshDeviceSchedule();

	let debounce: ReturnType<typeof setTimeout> | undefined;
	const offWrite = onLocalWrite(() => {
		clearTimeout(debounce);
		debounce = setTimeout(() => void refreshDeviceSchedule(), 3000);
	});
	const onVisible = () => {
		if (document.visibilityState === 'visible') void refreshDeviceSchedule();
	};
	document.addEventListener('visibilitychange', onVisible);

	return () => {
		clearTimeout(debounce);
		offWrite();
		document.removeEventListener('visibilitychange', onVisible);
	};
}
