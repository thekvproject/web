import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabaseAdmin } from '$lib/server/supabase';

const DISCORD_GUILDS_URL = 'https://discord.com/api/users/@me/guilds';
const adminPermissionBit = 0x8n;

const getToken = (request: Request) => {
	const header = request.headers.get('authorization');
	if (!header?.startsWith('Bearer ')) return null;
	return header.slice('Bearer '.length);
};

const getDiscordToken = (request: Request) => request.headers.get('x-discord-token');

const ensureAdmin = async (fetchFn: typeof fetch, discordToken: string, guildId: string) => {
	const discordResponse = await fetchFn(DISCORD_GUILDS_URL, {
		headers: {
			Authorization: `Bearer ${discordToken}`
		}
	});

	if (!discordResponse.ok) return false;

	const guilds = (await discordResponse.json()) as Array<{ id: string; permissions: string }>;
	return guilds.some((guild) => {
		if (guild.id !== guildId) return false;
		const permissions = BigInt(guild.permissions ?? '0');
		return (permissions & adminPermissionBit) === adminPermissionBit;
	});
};

export const GET: RequestHandler = async ({ request, fetch, params }) => {
	const accessToken = getToken(request);
	if (!accessToken) return json({ error: 'unauthorized' }, { status: 401 });

	const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(accessToken);
	if (userError || !userData.user) {
		return json({ error: 'unauthorized' }, { status: 401 });
	}

	const discordToken = getDiscordToken(request);
	if (!discordToken) return json({ error: 'missing_discord_token' }, { status: 400 });

	const guildId = params.guildId;
	const isAdmin = await ensureAdmin(fetch, discordToken, guildId);
	if (!isAdmin) return json({ error: 'forbidden' }, { status: 403 });

	const { data, error } = await supabaseAdmin
		.from('exploiter_events')
		.select('exploiters, safe')
		.eq('guild_id', guildId)
		.single();

	if (error && error.code !== 'PGRST116') {
		return json({ error: 'stats_failed' }, { status: 500 });
	}

	const exploiters = data?.exploiters ?? 0;
	const safe = data?.safe ?? 0;
	const total = exploiters + safe;

	return json({
		counts: { exploiters, safe, total }
	});
};
