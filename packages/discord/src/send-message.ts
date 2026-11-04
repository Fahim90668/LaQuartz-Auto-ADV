import { discordFetch, type DiscordResponse } from './rest.js';

export interface SendMessageOptions {
  content: string;
  tts?: boolean;
  allowedMentions?: {
    parse?: Array<'roles' | 'users' | 'everyone'>;
    roles?: string[];
    users?: string[];
    replied_user?: boolean;
  };
}

export interface SentMessage {
  id: string;
  channelId: string;
  content: string;
  timestamp: string;
}

interface RawMessage {
  id: string;
  channel_id: string;
  content: string;
  timestamp: string;
}

export async function sendMessage(
  token: string,
  channelId: string,
  options: SendMessageOptions,
  fetchOptions: { timeoutMs?: number; signal?: AbortSignal; superProperties?: string } = {},
): Promise<DiscordResponse<SentMessage>> {
  const body: Record<string, unknown> = {
    content: options.content,
    tts: options.tts ?? false,
  };

  if (options.allowedMentions !== undefined) {
    body.allowed_mentions = options.allowedMentions;
  }

  const res = await discordFetch<RawMessage>({
    method: 'POST',
    path: `/channels/${channelId}/messages`,
    token,
    body,
    timeoutMs: fetchOptions.timeoutMs,
    signal: fetchOptions.signal,
    superProperties: fetchOptions.superProperties,
  });

  if (!res.ok || !res.data) {
    return { ...res, data: null };
  }

  return {
    ...res,
    data: {
      id: res.data.id,
      channelId: res.data.channel_id,
      content: res.data.content,
      timestamp: res.data.timestamp,
    },
  };
}