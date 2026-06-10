import { error, json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { runReminders } from '$lib/server/reminders';
import type { RequestHandler } from './$types';

// Vercel cron invokes this daily with `Authorization: Bearer $CRON_SECRET`.
export const GET: RequestHandler = async ({ request }) => {
	const secret = env.CRON_SECRET;
	if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
		error(401, 'unauthorized');
	}
	return json(await runReminders());
};
