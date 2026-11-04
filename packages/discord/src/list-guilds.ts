import { discordFetch } from './rest.js';

export interface DiscordGuild {
  id: string;
  name: string;
  icon: string | null;
  owner: boolean;
  permissions: string;
  features?: string[];
}

export interface GuildSummary {
  id: string;
  name: string;
  icon: string | null;
  owner: boolean;
  permissions: string;
}

export function iconUrlFor(guild: DiscordGuild, size = 64): string | null {
  if (!guild.icon) return null;
  const ext = guild.icon.startsWith('a_') ? 'gif' : 'png';
  return `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.${ext}?size=${size}`;
}

function toSummary(g: DiscordGuild): GuildSummary {
  return {
    id: g.id,
    name: g.name,
    icon: g.icon,
    owner: g.owner,
    permissions: g.permissions,
  };
}

export async function listUserGuilds(
  token: string,
  options: {
    timeoutMs?: number;
    signal?: AbortSignal;
    withCounts?: boolean;
  } = {},
): Promise<GuildSummary[]> {
  const query = new URLSearchParams();
  query.set('limit', '200');
  if (options.withCounts) query.set('with_counts', 'true');

  const res = await discordFetch<DiscordGuild[]>({
    method: 'GET',
    path: `/users/@me/guilds?${query.toString()}`,
    token,
    timeoutMs: options.timeoutMs,
    signal: options.signal,
  });

  if (!res.ok || !Array.isArray(res.data)) {
    throw new Error('listUserGuilds: unexpected response shape.');
  }

  return res.data.map(toSummary);
}