<script lang="ts">
	import { onMount } from 'svelte';
	import { supabase } from '$lib/supabaseClient';
	import { goto } from '$app/navigation';

	let session: Awaited<ReturnType<typeof supabase.auth.getSession>>['data']['session'] = null;
	let loading = true;
	let guilds: Array<{
		id: string;
		name: string;
		icon: string | null;
		approved: boolean;
		server_invite: string | null;
		whitelist: string[];
	}> = [];
	let errorMessage = '';
	let density: 'comfortable' | 'compact' = 'comfortable';

	const refreshSession = async () => {
		const { data } = await supabase.auth.getSession();
		session = data.session;
	};

	const fetchGuilds = async () => {
		if (!session) return;
		loading = true;
		errorMessage = '';
		try {
			const response = await fetch('/api/guilds', {
				headers: {
					Authorization: `Bearer ${session.access_token}`,
					'x-discord-token': session.provider_token ?? ''
				}
			});
			if (!response.ok) {
				throw new Error('Failed to load servers');
			}
			const payload = await response.json();
			guilds = payload.guilds ?? [];
		} catch (error) {
			errorMessage = error instanceof Error ? error.message : 'Unknown error';
		} finally {
			loading = false;
		}
	};

	const signIn = async () => {
		await supabase.auth.signInWithOAuth({
			provider: 'discord',
			options: {
				scopes: 'identify guilds',
				redirectTo: `${window.location.origin}/dashboard`
			}
		});
	};

	const signOut = async () => {
		await supabase.auth.signOut();
		session = null;
		guilds = [];
	};

	onMount(async () => {
		await refreshSession();
		if (session) {
			await fetchGuilds();
		}
		loading = false;

		supabase.auth.onAuthStateChange(async (_event, nextSession) => {
			session = nextSession;
			if (session) {
				await fetchGuilds();
			} else {
				guilds = [];
			}
		});
	});
</script>

<main id="main" class="min-h-screen px-[6vw] pb-16 pt-10 flex flex-col gap-10">
	<header class="flex items-center justify-between gap-6 flex-wrap fade-up">
		<div class="flex items-center gap-4">
			<img
				src="/K.png"
				alt="KV logo"
				class="h-12 w-12 rounded-2xl object-cover border border-white/10 shadow-[0_12px_30px_rgba(0,0,0,0.35)]"
			/>
			<div>
				<p class="font-semibold">KV</p>
				<p class="muted text-sm">for a better community</p>
			</div>
		</div>
		<div class="flex items-center gap-3 flex-wrap">
			<button
				class="btn-ghost"
				type="button"
				on:click={() => (density = density === 'compact' ? 'comfortable' : 'compact')}
			>
				Density: {density}
			</button>
			{#if session}
				<button class="btn-ghost" type="button" on:click={signOut}>Sign out</button>
			{:else}
				<button class="btn-primary" type="button" on:click={signIn}>Sign in with Discord</button>
			{/if}
		</div>
	</header>



	<section class="flex flex-col gap-6 fade-up">
		<div class="flex flex-col gap-2">
			<h2 class="display text-2xl">Your servers</h2>
			<p class="muted">Only servers where you are an admin are shown.</p>
		</div>

		{#if !session}
			<div class="surface rounded-[var(--radius-md)] p-6 flex flex-col gap-3">
				<h3 class="text-lg font-semibold">Sign in to view servers</h3>
				<p class="muted text-sm">Discord auth is required to list your admin servers.</p>
				<button class="btn-primary" type="button" on:click={signIn}>Sign in with Discord</button>
			</div>
		{:else if loading}
			<div class="surface rounded-[var(--radius-md)] p-6 flex items-center gap-3">
				<span class="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white"></span>
				<span>Loading servers...</span>
			</div>
		{:else if errorMessage}
			<div class="surface rounded-[var(--radius-md)] p-6">
				<p>Could not load servers.</p>
				<p class="muted text-sm">{errorMessage}</p>
			</div>
		{:else if guilds.length === 0}
			<div class="surface rounded-[var(--radius-md)] p-6">
				<p>No admin servers found.</p>
				<p class="muted text-sm">Check your Discord permissions or try again later.</p>
			</div>
		{:else}
			<div
				class={`grid gap-5 ${density === 'compact' ? 'md:grid-cols-3' : 'md:grid-cols-2'} lg:grid-cols-3 stagger`}
			>
				{#each guilds as guild}
					<button
						class="surface rounded-[var(--radius-md)] p-5 flex items-center gap-4 text-left hover-lift"
						on:click={() => goto(`/dashboard/${guild.id}`)}
						type="button"
					>
						<div class="h-12 w-12 rounded-2xl bg-white text-black grid place-items-center font-semibold">
							{guild.name.slice(0, 2).toUpperCase()}
						</div>
						<div class="flex-1">
							<p class="font-semibold">{guild.name}</p>
							<p class="muted text-sm">
								{guild.approved ? 'Protection active' : 'Invite bot to activate'}
							</p>
						</div>
						<span class="pill border-white/30 text-white/80">
							{guild.approved ? 'Active' : 'Invite'}
						</span>
					</button>
				{/each}
			</div>
		{/if}
	</section>
</main>
