// Daily reminder cron core. Runs with the service-role key (bypasses RLS),
// recomputes due states with the SAME domain engine the client uses, and
// sends Web Push digests with state-hash dedup.

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import webpush from 'web-push';
import { createHash } from 'node:crypto';
import { env } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';
import { computeDueStates } from '$lib/domain/due';
import { lastMileagePointDate, mileagePoints } from '$lib/domain/mileage';
import { diffDays, todayLocal } from '$lib/domain/time';
import type { MaintenanceItem, MileageEntry, ServiceRecord, Vehicle } from '$lib/domain/types';
import { pullSelect, REMOTE_TABLE } from '$lib/sync/shape';
import { buildDigest, stateKey, type VehicleAttention } from './digest';

const OVERDUE_REPING_DAYS = 7;

interface SubscriptionRow {
	id: string;
	user_id: string;
	endpoint: string;
	p256dh: string;
	auth: string;
	enabled: boolean;
	mileage_reminder_days: number;
	last_push_at: string | null;
	last_push_state_hash: string | null;
}

export interface ReminderRunSummary {
	users: number;
	subscriptions: number;
	deviceSchedules: number;
	sent: number;
	skipped: number;
	expired: number;
	errors: number;
}

interface DeviceScheduleRow {
	device_token_hash: string;
	endpoint: string;
	p256dh: string;
	auth: string;
	schedule: { date: string; title: string; body: string }[];
}

function admin(): SupabaseClient | null {
	const url = publicEnv.PUBLIC_SUPABASE_URL;
	const key = env.SUPABASE_SERVICE_ROLE_KEY;
	return url && key ? createClient(url, key) : null;
}

async function loadUserData(client: SupabaseClient, userId: string) {
	const q = async (table: keyof typeof REMOTE_TABLE) => {
		const { data, error } = await client
			.from(REMOTE_TABLE[table])
			.select(pullSelect(table))
			.eq('user_id', userId)
			.eq('deleted', false);
		if (error) throw new Error(`load ${table}: ${error.message}`);
		// Aliased rows match the local camelCase shape; remote `deleted` is a
		// boolean but only ever read for truthiness by the domain layer.
		return (data ?? []) as unknown[];
	};
	return {
		vehicles: (await q('vehicles')) as Vehicle[],
		items: (await q('maintenanceItems')) as MaintenanceItem[],
		records: (await q('serviceRecords')) as ServiceRecord[],
		entries: (await q('mileageEntries')) as MileageEntry[]
	};
}

export async function runReminders(): Promise<ReminderRunSummary | { skipped: string }> {
	const client = admin();
	if (!client) return { skipped: 'supabase not configured' };
	if (!env.VAPID_PRIVATE_KEY || !publicEnv.PUBLIC_VAPID_PUBLIC_KEY) {
		return { skipped: 'vapid keys not configured' };
	}
	webpush.setVapidDetails(
		env.VAPID_SUBJECT || 'mailto:admin@example.com',
		publicEnv.PUBLIC_VAPID_PUBLIC_KEY,
		env.VAPID_PRIVATE_KEY
	);

	const { data, error } = await client.from('push_subscriptions').select('*').eq('enabled', true);
	if (error) throw new Error(`load subscriptions: ${error.message}`);
	const subs = (data ?? []) as SubscriptionRow[];

	const byUser = new Map<string, SubscriptionRow[]>();
	for (const s of subs) {
		byUser.set(s.user_id, [...(byUser.get(s.user_id) ?? []), s]);
	}

	const summary: ReminderRunSummary = {
		users: byUser.size,
		subscriptions: subs.length,
		deviceSchedules: 0,
		sent: 0,
		skipped: 0,
		expired: 0,
		errors: 0
	};
	const today = todayLocal();

	for (const [userId, userSubs] of byUser) {
		let attention: VehicleAttention[];
		let staleDaysPerVehicle: number[];
		let overdueExists: boolean;
		try {
			const { vehicles, items, records, entries } = await loadUserData(client, userId);
			attention = vehicles.map((vehicle) => {
				const vItems = items.filter((i) => i.vehicleId === vehicle.id);
				const vRecords = records.filter((r) => r.vehicleId === vehicle.id);
				const vEntries = entries.filter((e) => e.vehicleId === vehicle.id);
				const states = computeDueStates(vItems, vRecords, vEntries, vehicle.odometerUnit, today);
				return {
					vehicleName: vehicle.name,
					unit: vehicle.odometerUnit,
					items: states
						.filter((s) => s.status !== 'ok')
						.map((s) => ({
							name: vItems.find((i) => i.id === s.itemId)?.name ?? 'Maintenance',
							state: s
						}))
				};
			});
			staleDaysPerVehicle = vehicles.map((vehicle) => {
				const points = mileagePoints(
					records.filter((r) => r.vehicleId === vehicle.id),
					entries.filter((e) => e.vehicleId === vehicle.id)
				);
				const last = lastMileagePointDate(points);
				return last === null ? Number.MAX_SAFE_INTEGER : diffDays(last, today);
			});
			overdueExists = attention.some((v) => v.items.some((i) => i.state.status === 'overdue'));
		} catch (e) {
			console.error(`reminders: loading data for user failed`, e);
			summary.errors += userSubs.length;
			continue;
		}

		for (const sub of userSubs) {
			const mileageDue = staleDaysPerVehicle.some((d) => d >= sub.mileage_reminder_days);
			const hash = createHash('sha256').update(stateKey(attention, mileageDue)).digest('hex');
			const digest = buildDigest(attention, mileageDue);

			const lastPushAge = sub.last_push_at
				? (Date.now() - new Date(sub.last_push_at).getTime()) / 86_400_000
				: Infinity;
			const shouldSend =
				digest !== null &&
				(hash !== sub.last_push_state_hash ||
					(overdueExists && lastPushAge >= OVERDUE_REPING_DAYS));

			if (!shouldSend) {
				// Keep the stored hash current so a resolved state doesn't re-fire later.
				if (hash !== sub.last_push_state_hash) {
					await client
						.from('push_subscriptions')
						.update({ last_push_state_hash: hash })
						.eq('id', sub.id);
				}
				summary.skipped += 1;
				continue;
			}

			try {
				await webpush.sendNotification(
					{ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
					JSON.stringify({ title: digest.title, body: digest.body, url: '/' })
				);
				await client
					.from('push_subscriptions')
					.update({ last_push_state_hash: hash, last_push_at: new Date().toISOString() })
					.eq('id', sub.id);
				summary.sent += 1;
			} catch (e) {
				const status = (e as { statusCode?: number }).statusCode;
				if (status === 404 || status === 410) {
					// Subscription is gone (PWA uninstalled etc.) — clean up.
					await client.from('push_subscriptions').delete().eq('id', sub.id);
					summary.expired += 1;
				} else {
					console.error('reminders: push failed', e);
					summary.errors += 1;
				}
			}
		}
	}

	await runDeviceSchedules(client, today, summary);
	return summary;
}

/**
 * Accountless devices: send everything whose precomputed fire date has
 * arrived, then prune those entries. The server holds no vehicle data here —
 * just dates and message text the client uploaded.
 */
async function runDeviceSchedules(
	client: SupabaseClient,
	today: string,
	summary: ReminderRunSummary
): Promise<void> {
	const { data, error } = await client.from('device_schedules').select('*');
	if (error) throw new Error(`load device schedules: ${error.message}`);
	const devices = (data ?? []) as DeviceScheduleRow[];
	summary.deviceSchedules = devices.length;

	for (const device of devices) {
		const due = device.schedule.filter((e) => e.date <= today);
		if (due.length === 0) {
			summary.skipped += 1;
			continue;
		}
		const remaining = device.schedule.filter((e) => e.date > today);
		const title = due.length === 1 ? due[0].title : 'Maintenance reminders';
		const body = due.map((e) => e.body).join('\n');

		try {
			await webpush.sendNotification(
				{ endpoint: device.endpoint, keys: { p256dh: device.p256dh, auth: device.auth } },
				JSON.stringify({ title, body, url: '/' })
			);
			await client
				.from('device_schedules')
				.update({ schedule: remaining, updated_at: new Date().toISOString() })
				.eq('device_token_hash', device.device_token_hash);
			summary.sent += 1;
		} catch (e) {
			const status = (e as { statusCode?: number }).statusCode;
			if (status === 404 || status === 410) {
				await client
					.from('device_schedules')
					.delete()
					.eq('device_token_hash', device.device_token_hash);
				summary.expired += 1;
			} else {
				console.error('reminders: device push failed', e);
				summary.errors += 1;
			}
		}
	}
}
