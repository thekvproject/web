<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { supabase } from '$lib/supabaseClient';
	import { PUBLIC_DISCORD_BOT_INVITE_URL } from '$env/static/public';

	let session: Awaited<ReturnType<typeof supabase.auth.getSession>>['data']['session'] = null;
	let activeTab: 'stats' | 'whitelist' | 'watchlist' = 'stats';
	let config: {
		approved: boolean;
		server_invite: string | null;
		whitelist: string[];
	} | null = null;
	let loading = true;
	let errorMessage = '';
	let newWhitelistEntry = '';
	let updating = false;
	let stats = { exploiters: 0, safe: 0, total: 0 };
	let statsLoading = false;
	let statsError = '';
	const watchlist = [
		{
			userId: '1410511669125189705',
			userTag: 'flower.head',
			guildNames: [
				'Codex Collective',
				'FluxusZ',
				'Ronix Studios Premium',
				'wearedevs.net',
				'Drift',
				'Plexystrap',
				'Water',
				'Davestrap',
				'Delta Executor',
				'solara',
				'LOWHUB',
				'AK Admin',
				'Lil baby fan club/Celex External',
				'Raptor Development LLC',
				'Seliware',
				'Kron Hub',
				'Rivet',
				'Ronix Studios Support',
				'Velostrap',
				'Xeno',
				'Ronix Studio',
				'gold',
				'Lumin Hub'
			]
		},
		{
			userId: '1407337385334800398',
			userTag: 'dimrevived',
			guildNames: ['Davestrap', 'Velostrap']
		},
		{
			userId: '1390517384564965463',
			userTag: '.runds',
			guildNames: ['Xeno']
		},
		{
			userId: '1339579865439010859',
			userTag: 'sinkwater0812',
			guildNames: ['Xeno']
		},
		{
			userId: '1317516380500922499',
			userTag: 'chips.r',
			guildNames: ['Plexystrap', 'Velostrap', 'Davestrap']
		},
		{
			userId: '1283057038351663166',
			userTag: 'lejlizzle_',
			guildNames: ['Xeno']
		},
		{
			userId: '1178436254770151514',
			userTag: 'john_sg0',
			guildNames: ['Xeno']
		},
		{
			userId: '1166005624195268709',
			userTag: 'yagixisbetter',
			guildNames: ['Davestrap']
		},
		{
			userId: '1160247885967929364',
			userTag: 'legacy.launcher',
			guildNames: ['solara']
		},
		{
			userId: '1153309671151652895',
			userTag: 'flvneur',
			guildNames: ['Xeno']
		},
		{
			userId: '1016826041102245888',
			userTag: 'asillyindividual1',
			guildNames: ['Water']
		},
		{
			userId: '999142457667227679',
			userTag: 'polover1682',
			guildNames: ['Davestrap']
		},
		{
			userId: '989559396805787668',
			userTag: 'prost5frost',
			guildNames: ['Xeno']
		},
		{
			userId: '954251297882767402',
			userTag: 'qtsuriii',
			guildNames: ['Xeno']
		},
		{
			userId: '946270807909359686',
			userTag: '_imovo_',
			guildNames: ['Xeno']
		},
		{
			userId: '917649642794147871',
			userTag: 'danscape',
			guildNames: ['Velostrap']
		},
		{
			userId: '752618127031926867',
			userTag: 'seblikeshandrolls',
			guildNames: ['Xeno']
		},
		{
			userId: '749015718216859698',
			userTag: 'scubdub2049',
			guildNames: ['Water']
		},
		{
			userId: '726548293739348118',
			userTag: 'davi123211',
			guildNames: ['solara']
		},
		{
			userId: '338450855399391232',
			userTag: 'polarzer0',
			guildNames: ['Velostrap']
		}
	];

	const loadConfig = async (guildId: string) => {
		if (!session) return;
		loading = true;
		errorMessage = '';
		try {
			const response = await fetch(`/api/guild-config/${guildId}`, {
				headers: {
					Authorization: `Bearer ${session.access_token}`,
					'x-discord-token': session.provider_token ?? ''
				}
			});
			if (!response.ok) {
				throw new Error('Failed to load server config');
			}
			const payload = await response.json();
			config = payload.config;
		} catch (error) {
			errorMessage = error instanceof Error ? error.message : 'Unknown error';
		} finally {
			loading = false;
		}
	};

	const addWhitelist = async (guildId: string) => {
		if (!newWhitelistEntry.trim() || !session) return;
		updating = true;
		errorMessage = '';
		try {
			const response = await fetch(`/api/guild-config/${guildId}`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${session.access_token}`,
					'x-discord-token': session.provider_token ?? ''
				},
				body: JSON.stringify({ entry: newWhitelistEntry })
			});
			if (!response.ok) {
				throw new Error('Could not update whitelist');
			}
			const payload = await response.json();
			if (config) {
				config = { ...config, whitelist: payload.whitelist ?? config.whitelist };
			}
			newWhitelistEntry = '';
		} catch (error) {
			errorMessage = error instanceof Error ? error.message : 'Unknown error';
		} finally {
			updating = false;
		}
	};

	const loadStats = async (guildId: string) => {
		if (!session) return;
		statsLoading = true;
		statsError = '';
		try {
			const response = await fetch(`/api/guild-stats/${guildId}`, {
				headers: {
					Authorization: `Bearer ${session.access_token}`,
					'x-discord-token': session.provider_token ?? ''
				}
			});
			if (!response.ok) {
				throw new Error('Could not load stats');
			}
			const payload = await response.json();
			stats = payload.counts ?? { exploiters: 0, safe: 0, total: 0 };
		} catch (error) {
			statsError = error instanceof Error ? error.message : 'Unknown error';
		} finally {
			statsLoading = false;
		}
	};

	const removeWhitelist = async (guildId: string, entry: string) => {
		if (!session) return;
		updating = true;
		errorMessage = '';
		try {
			const response = await fetch(`/api/guild-config/${guildId}`, {
				method: 'DELETE',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${session.access_token}`,
					'x-discord-token': session.provider_token ?? ''
				},
				body: JSON.stringify({ entry })
			});
			if (!response.ok) {
				throw new Error('Could not update whitelist');
			}
			const payload = await response.json();
			if (config) {
				config = { ...config, whitelist: payload.whitelist ?? config.whitelist };
			}
		} catch (error) {
			errorMessage = error instanceof Error ? error.message : 'Unknown error';
		} finally {
			updating = false;
		}
	};

	onMount(async () => {
		const { data } = await supabase.auth.getSession();
		session = data.session;
		const guildId = $page.params.guildId!;
		if (session) {
			await loadConfig(guildId);
			await loadStats(guildId);
		} else {
			loading = false;
		}
	});
</script>

<main id="main" class="min-h-screen px-[6vw] pb-16 pt-10 flex flex-col gap-8">
	<div class="flex items-center justify-between gap-4 flex-wrap fade-up">
		<a class="btn-ghost" href="/dashboard">← Back to servers</a>
		<div>
			<h1 class="display text-3xl">Server control</h1>
			<p class="muted text-sm">Guild ID: {$page.params.guildId}</p>
		</div>
	</div>

	{#if !session}
		<section class="surface rounded-[var(--radius-md)] p-6 flex flex-col gap-3 fade-up">
			<h2 class="text-xl font-semibold">Sign in required</h2>
			<p class="muted text-sm">Discord auth is required to access server controls.</p>
			<button
				class="btn-primary"
				type="button"
				on:click={() =>
					supabase.auth.signInWithOAuth({
						provider: 'discord',
						options: {
							scopes: 'identify guilds',
							redirectTo: `${window.location.origin}/dashboard/${$page.params.guildId}`
						}
					})}
			>
				Sign in with Discord
			</button>
		</section>
	{:else if loading}
		<section class="surface rounded-[var(--radius-md)] p-6 fade-up flex items-center gap-3">
			<span class="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white"></span>
			<span>Loading server...</span>
		</section>
	{:else if errorMessage}
		<section class="surface rounded-[var(--radius-md)] p-6 fade-up">
			<p>Could not load server.</p>
			<p class="muted text-sm">{errorMessage}</p>
		</section>
	{:else if config}
		{#if !config.approved}
			<section class="surface rounded-[var(--radius-md)] p-6 flex items-center justify-between gap-4 flex-wrap fade-up">
				<div>
					<h2 class="text-xl font-semibold">Invite the KV bot to activate</h2>
					<p class="muted text-sm">Protection stays off until the bot is invited.</p>
				</div>
				<a class="btn-primary" href={config.server_invite || PUBLIC_DISCORD_BOT_INVITE_URL || '/dashboard'}>
					Invite bot
				</a>
			</section>
		{/if}

		<section class="fade-up grid gap-6 lg:grid-cols-[240px_1fr]">
			<aside class="surface rounded-[var(--radius-md)] p-4 flex flex-col gap-2">
				<button
					type="button"
					on:click={() => (activeTab = 'stats')}
					class={`text-left rounded-[var(--radius-sm)] px-4 py-3 border-l-4 transition-colors ${
						activeTab === 'stats'
							? 'border-white bg-white/10'
							: 'border-transparent bg-white/0 hover:bg-white/5'
					}`}
					aria-current={activeTab === 'stats' ? 'page' : undefined}
				>
					<p class="font-semibold">Statics overview</p>
					<p class="muted text-xs">Range + activity</p>
				</button>
			<button
				type="button"
				on:click={() => (activeTab = 'whitelist')}
				class={`text-left rounded-[var(--radius-sm)] px-4 py-3 border-l-4 transition-colors ${
					activeTab === 'whitelist'
						? 'border-white bg-white/10'
						: 'border-transparent bg-white/0 hover:bg-white/5'
				}`}
				aria-current={activeTab === 'whitelist' ? 'page' : undefined}
			>
				<p class="font-semibold">Whitelist</p>
				<p class="muted text-xs">Allow list controls</p>
			</button>
			<button
				type="button"
				on:click={() => (activeTab = 'watchlist')}
				class={`text-left rounded-[var(--radius-sm)] px-4 py-3 border-l-4 transition-colors ${
					activeTab === 'watchlist'
						? 'border-white bg-white/10'
						: 'border-transparent bg-white/0 hover:bg-white/5'
				}`}
				aria-current={activeTab === 'watchlist' ? 'page' : undefined}
			>
				<p class="font-semibold">Watchlist</p>
				<p class="muted text-xs">Flagged actors</p>
			</button>
		</aside>

			<div class="surface rounded-[var(--radius-md)] p-6 flex flex-col gap-6">
				{#if activeTab === 'stats'}
					<div class="flex items-center justify-between gap-4 flex-wrap">
						<div>
							<h2 class="display text-2xl">Statics overview</h2>
							<p class="muted text-sm">Latest exploiter activity totals.</p>
						</div>
					</div>
					{#if statsLoading}
						<div class="surface rounded-[var(--radius-md)] p-6 flex items-center gap-3">
							<span class="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white"></span>
							<span>Loading stats...</span>
						</div>
					{:else if statsError}
						<div class="surface rounded-[var(--radius-md)] p-6">
							<p>Could not load stats.</p>
							<p class="muted text-sm">{statsError}</p>
						</div>
					{:else}
						<div class="grid gap-4 md:grid-cols-3 stagger">
							<div class="surface-alt rounded-[var(--radius-md)] p-5 flex flex-col gap-2 hover-lift">
								<span class="pill border-black/10 text-[color:var(--text-dark)]">Flagged</span>
								<h3 class="display text-2xl text-[color:var(--text-dark)]">{stats.exploiters}</h3>
								<p class="text-sm text-[color:var(--text-dark)]/80">Exploiters flagged.</p>
							</div>
							<div class="surface-alt rounded-[var(--radius-md)] p-5 flex flex-col gap-2 hover-lift">
								<span class="pill border-black/10 text-[color:var(--text-dark)]">Safe</span>
								<h3 class="display text-2xl text-[color:var(--text-dark)]">{stats.safe}</h3>
								<p class="text-sm text-[color:var(--text-dark)]/80">Verified safe joins.</p>
							</div>
							<div class="surface-alt rounded-[var(--radius-md)] p-5 flex flex-col gap-2 hover-lift">
								<span class="pill border-black/10 text-[color:var(--text-dark)]">Total</span>
								<h3 class="display text-2xl text-[color:var(--text-dark)]">{stats.total}</h3>
								<p class="text-sm text-[color:var(--text-dark)]/80">All processed events.</p>
							</div>
						</div>
					{/if}
				{:else if activeTab === 'whitelist'}
					<div class="flex items-center justify-between gap-4 flex-wrap">
						<div>
							<h2 class="display text-2xl">Whitelist</h2>
							<p class="muted text-sm">Add IDs that should never be auto-banned.</p>
						</div>
						<div class="flex items-center gap-3 flex-wrap">
							<input
								placeholder="Discord user ID"
								class="rounded-full border border-white/20 bg-white/5 px-4 py-2"
								bind:value={newWhitelistEntry}
							/>
					<button
						class="btn-primary"
						type="button"
						on:click={() => addWhitelist($page.params.guildId!)}
						disabled={updating}
					>
								Add whitelist
							</button>
						</div>
					</div>
					<div class="grid gap-3 stagger">
						{#if config.whitelist.length === 0}
							<p class="muted text-sm">No whitelist entries yet.</p>
						{:else}
							{#each config.whitelist as entry}
								<div class="surface-alt rounded-[var(--radius-md)] p-4 flex items-center justify-between gap-4 hover-lift">
									<span class="text-[color:var(--text-dark)]">{entry}</span>
									<div class="flex items-center gap-3">
										<span class="pill border-black/10 text-[color:var(--text-dark)]">Approved</span>
							<button
								class="btn-ghost border-black/20 text-[color:var(--text-dark)]"
								type="button"
								on:click={() => removeWhitelist($page.params.guildId!, entry)}
								disabled={updating}
							>
											Remove
										</button>
									</div>
								</div>
							{/each}
						{/if}
					</div>
				{:else}
					<div class="flex items-center justify-between gap-4 flex-wrap">
						<div>
							<h2 class="display text-2xl">Guild watchlist</h2>
							<p class="muted text-sm">Flagged user accounts sourced from guild_config.</p>
						</div>
						<span class="pill border-white/20 text-sm">
							{watchlist.length} {watchlist.length === 1 ? 'entry' : 'entries'}
						</span>
					</div>
					<div class="overflow-x-auto rounded-[var(--radius-md)] border border-white/10">
						<table class="w-full text-sm">
							<thead class="bg-white/5 text-left uppercase text-xs tracking-wide">
								<tr>
									<th class="px-4 py-3 font-semibold">User</th>
									<th class="px-4 py-3 font-semibold">User ID</th>
									<th class="px-4 py-3 font-semibold">Guilds</th>
								</tr>
							</thead>
							<tbody>
								{#each watchlist as entry, idx}
									<tr class={idx % 2 === 0 ? 'bg-white/0' : 'bg-white/[0.02]'}>
										<td class="px-4 py-4">
											<div class="flex flex-col">
												<span class="font-semibold">{entry.userTag}</span>
												<span class="muted text-xs">Flagged account</span>
											</div>
										</td>
										<td class="px-4 py-4">
											<code class="text-xs bg-white/10 px-2 py-1 rounded">{entry.userId}</code>
										</td>
										<td class="px-4 py-4">
											<div class="flex flex-wrap gap-2">
												{#each entry.guildNames as guild}
													<span class="pill border-white/15">{guild}</span>
												{/each}
											</div>
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				{/if}
			</div>
		</section>
	{/if}
</main>
