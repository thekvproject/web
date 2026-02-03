<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.png';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<a class="skip" href="#main">Skip to content</a>
<div class="app-shell">
	{@render children()}
	<footer class="px-[6vw] py-10 border-t border-white/10 text-sm fade-in">
		<div class="flex items-center justify-between gap-4 flex-wrap">
			<div class="flex items-center gap-3">
				<img src="/K.png" alt="KV logo" class="h-8 w-8 rounded-xl object-cover border border-white/10" />
				<span class="font-semibold">KV</span>
			</div>
			<div class="flex flex-col gap-2">
				<p class="muted">for a better community.</p>
			</div>
			<dir class="flex flex-col gap-2 items-end">
				<a class="w-fit muted" href="https://discord.gg/mS5UaMtTg6">join our discord</a>
				<p class="muted">© 2026 by the KV devs</p>
			</dir>
		</div>
	</footer>
</div>
