import { getServiceClient } from '@app/db';
import { getChannelSlowmode } from '@app/discord';
import { getLogger } from './logger.js';

const CACHE_TTL_MS = 15 * 60 * 1000;

interface SlowmodeCacheEntry {
  seconds: number;
  fetchedAt: number;
}

const slowmodeCache = new Map<string, SlowmodeCacheEntry>();

export interface SlowmodeResult {
  slowmodeSeconds: number;
  fromCache: boolean;
}

export async function getSlowmodeForChannel(
  accountId: string,
  channelId: string,
  token: string,
  forceRefresh = false,
): Promise<SlowmodeResult> {
  const cacheKey = `${accountId}:${channelId}`;
  const now = Date.now();
  const cached = slowmodeCache.get(cacheKey);

  if (!forceRefresh && cached && now - cached.fetchedAt < CACHE_TTL_MS) {
    return { slowmodeSeconds: cached.seconds, fromCache: true };
  }

  try {
    const seconds = await getChannelSlowmode(token, channelId);
    slowmodeCache.set(cacheKey, { seconds, fetchedAt: now });
    return { slowmodeSeconds: seconds, fromCache: false };
  } catch (err) {
    getLogger().warn('slowmode fetch failed, using cache fallback', {
      accountId,
      channelId,
      err: (err as Error).message,
    });
    if (cached) {
      return { slowmodeSeconds: cached.seconds, fromCache: true };
    }
    const db = getServiceClient();
    const { data } = await db
      .from('playground_channels')
      .select('slowmode_seconds')
      .eq('channel_id', channelId)
      .maybeSingle();
    return {
      slowmodeSeconds: Number(data?.slowmode_seconds ?? 0),
      fromCache: true,
    };
  }
}

export function clearSlowmodeCache(): void {
  slowmodeCache.clear();
}

export function isSlowmodeCacheStale(accountId: string, channelId: string): boolean {
  const cached = slowmodeCache.get(`${accountId}:${channelId}`);
  if (!cached) return true;
  return Date.now() - cached.fetchedAt >= CACHE_TTL_MS;
      }
