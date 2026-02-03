<script lang="ts">
	import { PUBLIC_DISCORD_BOT_INVITE_URL } from '$env/static/public';

	const inviteUrl = PUBLIC_DISCORD_BOT_INVITE_URL || '/dashboard';
</script>

<main id="main" class="min-h-screen px-[6vw] pb-20 pt-10 flex flex-col gap-16">
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
			<a class="btn-ghost" href="/dashboard">Dashboard</a>
			<a class="btn-primary" href={inviteUrl}>Invite to your Discord server</a>
		</div>
	</header>

	<section class="flex flex-col gap-6 items-center text-center fade-up">
		<div class="flex flex-col gap-6 items-center">
			<h1 class="display text-[clamp(2.4rem,4vw,4.4rem)] leading-tight">
				sick of roblox skid/exploiters joining your discord server? we got you
			</h1>
			<p class="muted text-lg max-w-2xl">
				yeah, KV born to be banning skid/exploiters on join so your mods dont have to.
			</p>
			<div class="flex items-center gap-4 flex-wrap">
				<a class="btn-primary" href={inviteUrl}>Invite to your Discord server</a>
				<a class="btn-ghost" href="/dashboard">Open dashboard</a>
			</div>
		</div>

	</section>

	<section class="flex flex-col gap-10 fade-up">
		<div class="flex flex-col gap-3">
			<h2 class="display text-3xl">ban skid now!!!!</h2>
			<p class="muted">prrrrrrrrrrrr</p>
		</div>
		<div class="grid gap-6 md:grid-cols-3 stagger">
			<div class="surface-alt rounded-[var(--radius-md)] p-6 flex flex-col gap-4 hover-lift">
				<h3 class="font-semibold">Whitelist</h3>
				<p class="text-sm text-[color:var(--text-dark)]/80">
					i dont think u need explanation for this one lol
				</p>
				<span class="pill border-black/10 text-[color:var(--text-dark)]">Reversible</span>
			</div>
			<div class="surface-alt rounded-[var(--radius-md)] p-6 flex flex-col gap-4 hover-lift">
				<h3 class="font-semibold">Auto ban when joined server</h3>
				<p class="text-sm text-[color:var(--text-dark)]/80">
					kill them when they try to join your server
				</p>
				<span class="pill border-black/10 text-[color:var(--text-dark)]">Guardrail: no role edits</span>
			</div>
		</div>

	</section>

	<section class="flex flex-col gap-8 fade-up">
		<div class="text-center flex flex-col gap-2">
			<h2 class="display text-3xl">when your server go big, the time for the dectection gonna get longer</h2>
			<p class="muted">so we talk about plans</p>
		</div>
		<div class="grid gap-6 md:grid-cols-3 stagger">
			<div class="surface rounded-[var(--radius-md)] p-6 flex flex-col gap-4 hover-lift">
				<div>
					<p class="text-xs uppercase tracking-[0.2em] text-white/70">For small servers</p>
					<p class="display text-3xl">@everyone</p>
				</div>
				<ul class="text-sm text-white/80 list-disc pl-5">
					<li>join-time exploit scan</li>
					<li>auto-ban on signatures</li>
					<li>whitelist</li>
				</ul>
				<button class="btn-ghost w-fit" type="button">Invite KV to your server</button>
			</div>
			<div class="surface rounded-[var(--radius-md)] p-6 flex flex-col gap-4 border border-white/30 shadow-[0_0_0_1px_rgba(255,255,255,0.15)] hover-lift">
				<div class="flex items-center justify-between">
					<div>
						<p class="text-xs uppercase tracking-[0.2em] text-white/70">more than 1k members</p>
						<p class="display text-3xl">serious</p>
					</div>
					<span class="pill border-white/30">pick if u are big</span>
				</div>
				<ul class="text-sm text-white/80 list-disc pl-5">
					<li>no boring rate limit</li>
					<li>more comming soon!!!</li>
				</ul>
				<button class="btn-primary w-fit" type="button">ask kv team</button>
			</div>
			<div class="surface rounded-[var(--radius-md)] p-6 flex flex-col gap-4 hover-lift">
				<div>
					<p class="text-xs uppercase tracking-[0.2em] text-white/70">self-hosted</p>
					<p class="display text-3xl">OPEN SOURCE!???!</p>
				</div>
				<ul class="text-sm text-white/80 list-disc pl-5">
					<li>requirements are high</li>
					<li>but you got custom features</li>
					<li>condos server dectection (experimental)</li>
				</ul>
				<button class="btn-ghost w-fit" type="button">serious talk</button>
			</div>
		</div>
	</section>

	<section class="surface rounded-[var(--radius-lg)] p-8 flex items-center justify-between gap-6 flex-wrap fade-up">
		<div>
			<p class="text-xs uppercase tracking-[0.2em] text-white/70">ready?</p>
			<h2 class="display text-3xl">Invite KV bot to your server</h2>
			<p class="muted">pls speed i need this</p>
		</div>
		<a class="btn-primary" href={inviteUrl}>Invite to your Discord server</a>
	</section>

	<div class="flex items-center justify-between gap-4 flex-wrap">
		<p class="muted text-sm">Built for WCAG 2.2 accessibility and reduced motion by default.</p>
	</div>

</main>
