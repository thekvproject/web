import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabaseAdmin } from '$lib/server/supabase';

const DISCORD_GUILDS_URL = 'https://discord.com/api/users/@me/guilds';
const DISCORD_ME_URL = 'https://discord.com/api/users/@me';
const adminPermissionBit = 0x8n;

const getToken = (request: Request) => {
	const header = request.headers.get('authorization');
	if (!header?.startsWith('Bearer ')) return null;
	return header.slice('Bearer '.length);
};

const getDiscordToken = (request: Request) => request.headers.get('x-discord-token');

const getOwnerId = (userData: NonNullable<Awaited<ReturnType<typeof supabaseAdmin.auth.getUser>>['data']>['user']) => {
	const rawId =
		(userData.user_metadata?.provider_id as string | undefined) ||
		(userData.user_metadata?.sub as string | undefined) ||
		(userData.identities?.[0]?.id as string | undefined);
	if (!rawId || !/^[0-9]+$/.test(rawId)) return null;
	return rawId;
};

const getDiscordUserId = async (fetchFn: typeof fetch, discordToken: string) => {
	const response = await fetchFn(DISCORD_ME_URL, {
		headers: {
			Authorization: `Bearer ${discordToken}`
		}
	});
	if (!response.ok) return null;
	const payload = (await response.json()) as { id?: string };
	return payload.id && /^[0-9]+$/.test(payload.id) ? payload.id : null;
};

const ensureAdmin = async (fetch: typeof globalThis.fetch, discordToken: string, guildId: string) => {
	const discordResponse = await fetch(DISCORD_GUILDS_URL, {
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

	const ownerId = (await getDiscordUserId(fetch, discordToken)) ?? getOwnerId(userData.user);
	if (!ownerId) return json({ error: 'missing_owner_id' }, { status: 400 });

	const guildId = params.guildId;
	const isAdmin = await ensureAdmin(fetch, discordToken, guildId);
	if (!isAdmin) return json({ error: 'forbidden' }, { status: 403 });

	const { data: row } = await supabaseAdmin
		.from('guild_config')
		.select('guild_id, approved, server_invite, whitelist, blacklisted, default_channel')
		.eq('guild_id', guildId)
		.eq('owner_id', ownerId)
		.maybeSingle();

	return json({
		config: {
			guild_id: guildId,
			approved: row?.approved ?? false,
			server_invite: row?.server_invite ?? null,
			whitelist: (row?.whitelist as string[] | null) ?? [],
			blacklisted: (row?.blacklisted as string[] | null) ?? [],
			default_channel: row?.default_channel ?? null
		}
	});
};

export const POST: RequestHandler = async ({ request, fetch, params }) => {
	const accessToken = getToken(request);
	if (!accessToken) return json({ error: 'unauthorized' }, { status: 401 });

	const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(accessToken);
	if (userError || !userData.user) {
		return json({ error: 'unauthorized' }, { status: 401 });
	}

	const discordToken = getDiscordToken(request);
	if (!discordToken) return json({ error: 'missing_discord_token' }, { status: 400 });

	const ownerId = (await getDiscordUserId(fetch, discordToken)) ?? getOwnerId(userData.user);
	if (!ownerId) return json({ error: 'missing_owner_id' }, { status: 400 });

	const guildId = params.guildId;
	const isAdmin = await ensureAdmin(fetch, discordToken, guildId);
	if (!isAdmin) return json({ error: 'forbidden' }, { status: 403 });

	const payload = (await request.json()) as { entry?: string };
	const entry = payload.entry?.trim();
	if (!entry) return json({ error: 'missing_entry' }, { status: 400 });

	const { data: existing } = await supabaseAdmin
		.from('guild_config')
		.select('whitelist')
		.eq('guild_id', guildId)
		.eq('owner_id', ownerId)
		.maybeSingle();

	const whitelist = (existing?.whitelist as string[] | null) ?? [];
	const nextWhitelist = Array.from(new Set([...whitelist, entry]));

	const { error: upsertError } = await supabaseAdmin
		.from('guild_config')
		.upsert(
			{ guild_id: guildId, owner_id: ownerId, whitelist: nextWhitelist },
			{ onConflict: 'guild_id,owner_id' }
		);

	if (upsertError) {
		return json({ error: 'update_failed' }, { status: 500 });
	}

	return json({ whitelist: nextWhitelist });
};

export const DELETE: RequestHandler = async ({ request, fetch, params }) => {
	const accessToken = getToken(request);
	if (!accessToken) return json({ error: 'unauthorized' }, { status: 401 });

	const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(accessToken);
	if (userError || !userData.user) {
		return json({ error: 'unauthorized' }, { status: 401 });
	}

	const discordToken = getDiscordToken(request);
	if (!discordToken) return json({ error: 'missing_discord_token' }, { status: 400 });

	const ownerId = (await getDiscordUserId(fetch, discordToken)) ?? getOwnerId(userData.user);
	if (!ownerId) return json({ error: 'missing_owner_id' }, { status: 400 });

	const guildId = params.guildId;
	const isAdmin = await ensureAdmin(fetch, discordToken, guildId);
	if (!isAdmin) return json({ error: 'forbidden' }, { status: 403 });

	const payload = (await request.json()) as { entry?: string };
	const entry = payload.entry?.trim();
	if (!entry) return json({ error: 'missing_entry' }, { status: 400 });

	const { data: existing } = await supabaseAdmin
		.from('guild_config')
		.select('whitelist')
		.eq('guild_id', guildId)
		.eq('owner_id', ownerId)
		.maybeSingle();

	const whitelist = (existing?.whitelist as string[] | null) ?? [];
	const nextWhitelist = whitelist.filter((item) => item !== entry);

	const { error: upsertError } = await supabaseAdmin
		.from('guild_config')
		.upsert(
			{ guild_id: guildId, owner_id: ownerId, whitelist: nextWhitelist },
			{ onConflict: 'guild_id,owner_id' }
		);

	if (upsertError) {
		return json({ error: 'update_failed' }, { status: 500 });
	}

	return json({ whitelist: nextWhitelist });
};
