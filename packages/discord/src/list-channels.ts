import { discordFetch } from './rest.js';

export const ChannelType = {
  GUILD_TEXT: 0,
  DM: 1,
  GUILD_VOICE: 2,
  GROUP_DM: 3,
  GUILD_CATEGORY: 4,
  GUILD_ANNOUNCEMENT: 5,
  ANNOUNCEMENT_THREAD: 10,
  PUBLIC_THREAD: 11,
  PRIVATE_THREAD: 12,
  GUILD_STAGE_VOICE: 13,
  GUILD_FORUM: 15,
  GUILD_MEDIA: 16,
} as const;

export type ChannelType = (typeof ChannelType)[keyof typeof ChannelType];

export interface DiscordChannel {
  id: string;
  name: string;
  type: number;
  position: number;
  parent_id: string | null;
  rate_limit_per_user?: number;
  permission_overwrites?: Array<{
    id: string;
    type: number;
    allow: string;
    deny: string;
  }>;
}

export interface ChannelSummary {
  channelId: string;
  channelName: string;
  channelType: number;
  position: number;
  parentId: string | null;
  slowmodeSeconds: number;
  canSend: boolean;
}

function canSendMessage(channel: DiscordChannel): boolean {
  const sendable = new Set<number>([
    ChannelType.GUILD_TEXT,
    ChannelType.GUILD_ANNOUNCEMENT,
    ChannelType.GUILD_FORUM,
    ChannelType.GUILD_MEDIA,
  ]);
  return sendable.has(channel.type);
}

function toSummary(channel: DiscordChannel): ChannelSummary {
  return {
    channelId: channel.id,
    channelName: channel.name,
    channelType: channel.type,
    position: channel.position ?? 0,
    parentId: channel.parent_id ?? null,
    slowmodeSeconds: channel.rate_limit_per_user ?? 0,
    canSend: canSendMessage(channel),
  };
}

export async function listGuildChannels(
  token: string,
  serverId: string,
  options: { timeoutMs?: number; signal?: AbortSignal } = {},
): Promise<ChannelSummary[]> {
  const res = await discordFetch<DiscordChannel[]>({
    method: 'GET',
    path: `/guilds/${serverId}/channels`,
    token,
    timeoutMs: options.timeoutMs,
    signal: options.signal,
  });

  if (!res.ok || !Array.isArray(res.data)) {
    throw new Error('listGuildChannels: unexpected response shape.');
  }

  return res.data
    .filter((c) => c.type !== ChannelType.GUILD_CATEGORY)
    .map(toSummary)
    .sort((a, b) => {
      if (a.parentId !== b.parentId) return (a.parentId ?? '').localeCompare(b.parentId ?? '');
      return a.position - b.position;
    });
}