'use client';

import { getBrowserSupabase } from './supabase-browser';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000';

export class ApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number,
    public readonly details?: unknown,
    public readonly requestId?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function getAccessToken(): Promise<string> {
  const supabase = getBrowserSupabase();
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error || !session) {
    throw new ApiError('NOT_AUTHENTICATED', 'You are not signed in.', 401);
  }
  return session.access_token;
}

export interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  signal?: AbortSignal;
}

export async function apiFetch<T = unknown>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const token = await getAccessToken();
  const url = path.startsWith('http') ? path : `${API_BASE}${path}`;
  const hasBody = options.body !== undefined;

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
  };

  // Only set Content-Type when there is actually a body. Fastify's default
  // JSON parser rejects an empty body if Content-Type is application/json.
  if (hasBody) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(url, {
    method: options.method ?? 'GET',
    headers,
    body: hasBody ? JSON.stringify(options.body) : undefined,
    signal: options.signal,
    cache: 'no-store',
  });

  if (res.status === 204) return undefined as T;

  const isJson = res.headers.get('content-type')?.includes('application/json');
  const payload = isJson ? await res.json() : null;

  if (!res.ok) {
    const err = (payload as {
      error?: { code?: string; message?: string; details?: unknown; requestId?: string };
    })?.error;
    throw new ApiError(
      err?.code ?? 'API_ERROR',
      err?.message ?? `Request failed with status ${res.status}.`,
      res.status,
      err?.details,
      err?.requestId,
    );
  }

  return payload as T;
}

export const api = {
  getAccess: () =>
    apiFetch<{
      hasAccess: boolean;
      effectivePlaygroundLimit: number;
      playgroundsUsed: number;
      soonestExpiry: string | null;
      isLifetime: boolean;
      isBanned: boolean;
    }>('/me/access'),

  redeem: (code: string) =>
    apiFetch<{
      success: boolean;
      message: string;
      entitlement: { id: string; expiresAt: string | null; playgroundLimit: number } | null;
    }>('/redeem', { method: 'POST', body: { code } }),

  listAccounts: () =>
    apiFetch<{ items: import('@app/shared').DiscordAccountDTO[] }>('/accounts'),

  addAccount: (body: { label: string; token: string }) =>
    apiFetch<import('@app/shared').DiscordAccountDTO>('/accounts', { method: 'POST', body }),

  validateAccount: (id: string) =>
    apiFetch<import('@app/shared').DiscordAccountDTO>(`/accounts/${id}/validate`, {
      method: 'POST',
    }),

  removeAccount: (id: string) =>
    apiFetch<void>(`/accounts/${id}`, { method: 'DELETE' }),

  listServers: (accountId: string, refresh = false) =>
    apiFetch<{ accountId: string; servers: import('@app/shared').AccountServerDTO[] }>(
      `/discord/servers?accountId=${accountId}${refresh ? '&refresh=true' : ''}`,
    ),

  listChannels: (accountId: string, serverId: string, refresh = false) =>
    apiFetch<{
      accountId: string;
      serverId: string;
      channels: import('@app/shared').AccountChannelDTO[];
    }>(
      `/discord/channels?accountId=${accountId}&serverId=${serverId}${refresh ? '&refresh=true' : ''}`,
    ),

  readSlowmode: (accountId: string, channelId: string) =>
    apiFetch<{ channelId: string; slowmodeSeconds: number }>(
      `/discord/slowmode?accountId=${accountId}&channelId=${channelId}`,
    ),

  listPlaygrounds: () =>
    apiFetch<{ items: import('@app/shared').PlaygroundOverviewDTO[] }>('/playgrounds'),

  getPlayground: (id: string) =>
    apiFetch<import('@app/shared').PlaygroundDTO>(`/playgrounds/${id}`),

  createPlayground: (body: import('@app/shared').CreatePlaygroundInput) =>
    apiFetch<import('@app/shared').PlaygroundDTO>('/playgrounds', { method: 'POST', body }),

  updatePlayground: (id: string, body: import('@app/shared').UpdatePlaygroundInput) =>
    apiFetch<import('@app/shared').PlaygroundDTO>(`/playgrounds/${id}`, { method: 'PATCH', body }),

  deletePlayground: (id: string) =>
    apiFetch<void>(`/playgrounds/${id}`, { method: 'DELETE' }),

  startPlayground: (id: string) =>
    apiFetch<{ status: string; nextRunAt: string | null; seededJobs: number }>(
      `/playgrounds/${id}/start`,
      { method: 'POST' },
    ),

  stopPlayground: (id: string) =>
    apiFetch<{ status: string }>(`/playgrounds/${id}/stop`, { method: 'POST' }),

  addPlaygroundChannel: (id: string, body: import('@app/shared').ChannelInput) =>
    apiFetch<import('@app/shared').PlaygroundChannelDTO>(`/playgrounds/${id}/channels`, {
      method: 'POST',
      body,
    }),

  removePlaygroundChannel: (id: string, channelId: string) =>
    apiFetch<void>(`/playgrounds/${id}/channels/${channelId}`, { method: 'DELETE' }),

  addPlaygroundMessage: (id: string, content: string) =>
    apiFetch<import('@app/shared').PlaygroundMessageDTO>(`/playgrounds/${id}/messages`, {
      method: 'POST',
      body: { content },
    }),

  listPlaygroundLogs: (id: string, limit = 50, before?: number) =>
    apiFetch<{
      logs: import('@app/shared').DeliveryLogDTO[];
      nextCursor: number | null;
    }>(
      `/playgrounds/${id}/logs?limit=${limit}${before !== undefined ? `&before=${before}` : ''}`,
    ),
};
