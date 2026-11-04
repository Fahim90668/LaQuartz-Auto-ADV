import { discordFetch, type DiscordResponse } from './rest.js';

export interface DiscordUser {
  id: string;
  username: string;
  discriminator: string;
  global_name: string | null;
  avatar: string | null;
  email?: string | null;
  verified?: boolean;
  bot?: boolean;
  mfa_enabled?: boolean;
}

export interface ValidatedToken {
  user: DiscordUser;
  avatarUrl: string | null;
}

export function avatarUrlFor(user: DiscordUser): string | null {
  if (!user.avatar) return null;
  const ext = user.avatar.startsWith('a_') ? 'gif' : 'png';
  return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.${ext}?size=128`;
}

export async function validateToken(
  token: string,
  options: { timeoutMs?: number; signal?: AbortSignal } = {},
): Promise<ValidatedToken> {
  const res: DiscordResponse<DiscordUser> = await discordFetch<DiscordUser>({
    method: 'GET',
    path: '/users/@me',
    token,
    timeoutMs: options.timeoutMs,
    signal: options.signal,
  });

  if (!res.ok || !res.data) {
    throw new Error('validateToken: unexpected empty response.');
  }

  if (res.data.bot) {
    throw new Error('BOT_TOKEN_NOT_ALLOWED');
  }

  return {
    user: res.data,
    avatarUrl: avatarUrlFor(res.data),
  };
}