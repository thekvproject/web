import { json } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/server/supabase';
import type { RequestHandler } from './$types';

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

export const GET: RequestHandler = async ({ request, fetch }) => {
	const accessToken = getToken(request);
	if (!accessToken) {
		return json({ error: 'unauthorized' }, { status: 401 });
	}

	const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(accessToken);
	if (userError || !userData.user) {
		return json({ error: 'unauthorized' }, { status: 401 });
	}

	const discordToken = getDiscordToken(request);
	if (!discordToken) {
		return json({ error: 'missing_discord_token' }, { status: 400 });
	}

	const ownerId = (await getDiscordUserId(fetch, discordToken)) ?? getOwnerId(userData.user);
	if (!ownerId) {
		return json({ error: 'missing_owner_id' }, { status: 400 });
	}

	const discordResponse = await fetch(DISCORD_GUILDS_URL, {
		headers: {
			Authorization: `Bearer ${discordToken}`
		}
	});

	if (!discordResponse.ok) {
		return json({ error: 'discord_fetch_failed' }, { status: 502 });
	}

	const guilds = (await discordResponse.json()) as Array<{
		id: string;
		name: string;
		icon: string | null;
		permissions: string;
	}>;

	const adminGuilds = guilds.filter((guild) => {
		const permissions = BigInt(guild.permissions ?? '0');
		return (permissions & adminPermissionBit) === adminPermissionBit;
	});

	const guildIds = adminGuilds.map((guild) => guild.id);
	let configs: Record<string, { approved: boolean | null; server_invite: string | null; whitelist: string[] | null }> = {};

	if (guildIds.length > 0) {
		const { data: configRows } = await supabaseAdmin
			.from('guild_config')
			.select('guild_id, approved, server_invite, whitelist')
			.eq('owner_id', ownerId)
			.in('guild_id', guildIds);

		configs = (configRows ?? []).reduce((acc, row) => {
			acc[String(row.guild_id)] = {
				approved: row.approved,
				server_invite: row.server_invite,
				whitelist: row.whitelist as string[] | null
			};
			return acc;
		}, {} as Record<string, { approved: boolean | null; server_invite: string | null; whitelist: string[] | null }>);
	}

	return json({
		guilds: adminGuilds.map((guild) => {
			const config = configs[guild.id];
			return {
				id: guild.id,
				name: guild.name,
				icon: guild.icon,
				approved: config?.approved ?? false,
				server_invite: config?.server_invite ?? null,
				whitelist: config?.whitelist ?? []
			};
		})
	});
};
