import { discordFetch } from './rest.js';

export interface ChannelDetails {
  channelId: string;
  serverId: string | null;
  channelName: string;
  channelType: number;
  slowmodeSeconds: number;
  position: number;
}

interface RawChannel {
  id: string;
  guild_id?: string;
  name: string;
  type: number;
  position: number;
  rate_limit_per_user?: number;
}

export async function getChannel(
  token: string,
  channelId: string,
  options: { timeoutMs?: number; signal?: AbortSignal } = {},
): Promise<ChannelDetails> {
  const res = await discordFetch<RawChannel>({
    method: 'GET',
    path: `/channels/${channelId}`,
    token,
    timeoutMs: options.timeoutMs,
    signal: options.signal,
  });

  if (!res.ok || !res.data) {
    throw new Error('getChannel: unexpected empty response.');
  }

  return {
    channelId: res.data.id,
    serverId: res.data.guild_id ?? null,
    channelName: res.data.name,
    channelType: res.data.type,
    slowmodeSeconds: res.data.rate_limit_per_user ?? 0,
    position: res.data.position ?? 0,
  };
}

export async function getChannelSlowmode(
  token: string,
  channelId: string,
  options: { timeoutMs?: number; signal?: AbortSignal } = {},
): Promise<number> {
  const ch = await getChannel(token, channelId, options);
  return ch.slowmodeSeconds;
}