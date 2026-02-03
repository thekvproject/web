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

const rangeToMs = (range: string) => {
	switch (range) {
		case '1h':
			return 60 * 60 * 1000;
		case '24h':
			return 24 * 60 * 60 * 1000;
		case '7d':
			return 7 * 24 * 60 * 60 * 1000;
		case '30d':
			return 30 * 24 * 60 * 60 * 1000;
		default:
			return 60 * 60 * 1000;
	}
};

export const GET: RequestHandler = async ({ request, fetch, params, url }) => {
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

	const range = url.searchParams.get('range') ?? '1h';
	const since = new Date(Date.now() - rangeToMs(range)).toISOString();

	const { count: banCount, error: banError } = await supabaseAdmin
		.from('exploiter_events')
		.select('guild_id', { count: 'exact', head: true })
		.eq('guild_id', guildId)
		.eq('action', 'ban')
		.gte('created_at', since);

	if (banError) {
		return json({ error: 'stats_failed' }, { status: 500 });
	}

	const { count: safeCount, error: safeError } = await supabaseAdmin
		.from('exploiter_events')
		.select('guild_id', { count: 'exact', head: true })
		.eq('guild_id', guildId)
		.eq('action', 'safe')
		.gte('created_at', since);

	if (safeError) {
		return json({ error: 'stats_failed' }, { status: 500 });
	}

	const { count: totalCount, error: totalError } = await supabaseAdmin
		.from('exploiter_events')
		.select('guild_id', { count: 'exact', head: true })
		.eq('guild_id', guildId)
		.gte('created_at', since);

	if (totalError) {
		return json({ error: 'stats_failed' }, { status: 500 });
	}

	return json({
		range,
		counts: {
			ban: banCount ?? 0,
			safe: safeCount ?? 0,
			total: totalCount ?? 0
		}
	});
};
