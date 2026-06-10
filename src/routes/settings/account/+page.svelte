<script lang="ts">
	import { supabase } from '$lib/sync/client';
	import { authState, requestCode, signOut, verifyCode } from '$lib/sync/auth.svelte';
	import { syncNow, syncStatus } from '$lib/sync/engine.svelte';
	import {
		disablePush,
		enablePush,
		isIOSBrowserTab,
		isPushEnabled,
		pushSupported
	} from '$lib/sync/push-subscribe';
	import PageHeader from '$lib/ui/PageHeader.svelte';

	let email = $state('');
	let code = $state('');
	let stage = $state<'email' | 'code'>('email');
	let busy = $state(false);
	let error = $state('');

	async function sendCode(e: SubmitEvent) {
		e.preventDefault();
		busy = true;
		error = '';
		const res = await requestCode(email.trim());
		busy = false;
		if (res.error) error = res.error;
		else stage = 'code';
	}

	async function confirmCode(e: SubmitEvent) {
		e.preventDefault();
		busy = true;
		error = '';
		const res = await verifyCode(email.trim(), code.trim());
		busy = false;
		if (res.error) error = res.error;
	}

	async function logout() {
		busy = true;
		await signOut();
		busy = false;
		stage = 'email';
		email = '';
		code = '';
	}

	function syncLabel() {
		if (syncStatus.state === 'syncing') return 'Syncing…';
		if (syncStatus.state === 'error') return `Sync error: ${syncStatus.error}`;
		if (syncStatus.lastSyncAt)
			return `Last synced ${new Date(syncStatus.lastSyncAt).toLocaleTimeString()}`;
		return 'Not synced yet';
	}

	let pushOn = $state(false);
	let pushBusy = $state(false);
	let pushError = $state('');
	isPushEnabled().then((v) => (pushOn = v));

	async function togglePush() {
		pushBusy = true;
		pushError = '';
		if (pushOn) {
			await disablePush();
			pushOn = false;
		} else {
			const res = await enablePush();
			if (res.error) pushError = res.error;
			else pushOn = true;
		}
		pushBusy = false;
	}
</script>

<svelte:head><title>Account & sync</title></svelte:head>

<PageHeader title="Account & sync" back="/settings" />

{#if !supabase}
	<p class="rounded-xl bg-warn-soft px-3 py-2 text-sm text-warn">
		Sync isn't configured for this build (missing Supabase settings). The app works fully on this
		device.
	</p>
{:else if !authState.ready}
	<p class="text-sm text-ink-faint">Loading…</p>
{:else if authState.user}
	<section class="mb-4 rounded-2xl border border-line bg-card p-4">
		<h2 class="text-sm font-medium">Signed in</h2>
		<p class="mt-0.5 text-sm text-ink-soft">{authState.user.email}</p>
		<p class="mt-2 text-xs text-ink-faint">{syncLabel()}</p>
		<button
			onclick={() => syncNow()}
			class="mt-3 w-full rounded-full border border-teal py-2.5 text-sm font-medium text-teal active:scale-95"
		>
			Sync now
		</button>
	</section>
	<p class="mb-4 text-xs text-ink-faint">
		Your data syncs to this account. Sign in with the same email on another device to keep them in
		sync.
	</p>
	<button
		onclick={logout}
		disabled={busy}
		class="w-full rounded-full border border-danger/30 py-2.5 text-sm font-medium text-danger active:scale-95 disabled:opacity-50"
	>
		Sign out
	</button>
	<p class="mt-2 text-center text-xs text-ink-faint">Local data stays on this device.</p>
{:else if stage === 'email'}
	<p class="mb-4 text-sm text-ink-soft">
		Create a free account (or sign back in) to sync your vehicles across devices and keep push
		reminders up to date automatically. No password — we email you a 6-digit code.
	</p>
	<form onsubmit={sendCode} class="flex flex-col gap-4">
		<label class="block">
			<span class="mb-1 block text-sm font-medium text-ink-soft">Email</span>
			<input
				bind:value={email}
				type="email"
				required
				autocomplete="email"
				placeholder="you@example.com"
				class="w-full rounded-xl border border-line bg-card px-3 py-2.5 outline-none focus:border-teal"
			/>
		</label>
		{#if error}<p class="text-sm text-danger">{error}</p>{/if}
		<button
			type="submit"
			disabled={busy}
			class="rounded-full bg-teal py-3 font-medium text-teal-soft active:scale-95 disabled:opacity-50"
		>
			{busy ? 'Sending…' : 'Send code'}
		</button>
	</form>
{:else}
	<p class="mb-4 text-sm text-ink-soft">
		Enter the 6-digit code we sent to <span class="font-medium">{email}</span>.
	</p>
	<form onsubmit={confirmCode} class="flex flex-col gap-4">
		<input
			bind:value={code}
			inputmode="numeric"
			autocomplete="one-time-code"
			pattern="[0-9]*"
			maxlength="6"
			required
			placeholder="123456"
			class="w-full rounded-xl border border-line bg-card px-3 py-4 text-center text-2xl tracking-[0.5em] outline-none focus:border-teal"
		/>
		{#if error}<p class="text-sm text-danger">{error}</p>{/if}
		<button
			type="submit"
			disabled={busy}
			class="rounded-full bg-teal py-3 font-medium text-teal-soft active:scale-95 disabled:opacity-50"
		>
			{busy ? 'Checking…' : 'Sign in'}
		</button>
		<button type="button" onclick={() => (stage = 'email')} class="text-sm font-medium text-teal">
			Use a different email
		</button>
	</form>
{/if}

{#if supabase && authState.ready}
	<section class="mt-6 rounded-2xl border border-line bg-card p-4">
		<h2 class="text-sm font-medium">Push reminders</h2>
		{#if !pushSupported() && isIOSBrowserTab()}
			<p class="mt-0.5 text-xs text-ink-faint">
				To get reminders on iPhone, first install the app: tap Share → "Add to Home Screen", then
				enable notifications from the installed app.
			</p>
		{:else if !pushSupported()}
			<p class="mt-0.5 text-xs text-ink-faint">Push notifications aren't supported here.</p>
		{:else}
			<p class="mt-0.5 mb-3 text-xs text-ink-faint">
				{#if authState.user}
					A daily check notifies you when maintenance is due soon or overdue, and reminds you to log
					your mileage.
				{:else}
					Works without an account: reminder dates are scheduled from this device whenever you use
					the app — only the dates and message text leave the device. Signing in keeps them up to
					date automatically instead.
				{/if}
			</p>
			<button
				onclick={togglePush}
				disabled={pushBusy}
				class="w-full rounded-full py-2.5 text-sm font-medium active:scale-95 disabled:opacity-50 {pushOn
					? 'border border-line bg-card text-ink-soft'
					: 'bg-teal text-teal-soft'}"
			>
				{pushOn ? 'Disable notifications on this device' : 'Enable notifications'}
			</button>
			{#if pushError}<p class="mt-2 text-sm text-danger">{pushError}</p>{/if}
		{/if}
	</section>
{/if}
