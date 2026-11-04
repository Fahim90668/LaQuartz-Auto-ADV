import { DISCORD_API_BASE } from '@app/shared';
import {
  DiscordHttpError,
  mapDiscordError,
  type DiscordApiErrorBody,
} from './errors.js';
import {
  getSharedRateLimiter,
  routeKeyFor,
  type MemoryRateLimiter,
  type RateLimitState,
} from './rate-limiter.js';

const DEFAULT_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

const DEFAULT_TIMEOUT_MS = 15_000;

export type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

export interface DiscordFetchOptions {
  method?: HttpMethod;
  token: string;
  body?: unknown;
  path: string;
  timeoutMs?: number;
  signal?: AbortSignal;
  userAgent?: string;
  superProperties?: string;
  extraHeaders?: Record<string, string>;
  rateLimiter?: MemoryRateLimiter;
  skipRateLimitCheck?: boolean;
}

export interface DiscordResponse<T = unknown> {
  ok: boolean;
  status: number;
  data: T | null;
  rateLimit: RateLimitState | null;
  latencyMs: number;
  routeKey: string;
}

function parseNumber(value: string | null): number | null {
  if (!value) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function extractRateLimit(headers: Headers): RateLimitState | null {
  const remaining = parseNumber(headers.get('x-ratelimit-remaining'));
  const limit = parseNumber(headers.get('x-ratelimit-limit'));
  const resetAfter = parseNumber(headers.get('x-ratelimit-reset-after'));
  const bucket = headers.get('x-ratelimit-bucket');

  if (remaining === null || limit === null) return null;

  const resetAfterMs = resetAfter !== null ? resetAfter * 1000 : 1000;

  return {
    remaining,
    limit,
    resetAfterMs,
    bucket,
  };
}

function extractRetryAfterMs(headers: Headers, body: unknown): number | null {
  const resetAfter = parseNumber(headers.get('x-ratelimit-reset-after'));
  if (resetAfter !== null) return Math.ceil(resetAfter * 1000);

  const retryAfterHeader = parseNumber(headers.get('retry-after'));
  if (retryAfterHeader !== null) return Math.ceil(retryAfterHeader * 1000);

  if (body && typeof body === 'object' && 'retry_after' in body) {
    const raw = (body as { retry_after: unknown }).retry_after;
    if (typeof raw === 'number' && Number.isFinite(raw)) {
      return Math.ceil(raw * 1000);
    }
  }

  return null;
}

function isGlobalRateLimit(headers: Headers): boolean {
  return headers.get('x-ratelimit-global') === 'true';
}

async function parseBody(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export async function discordFetch<T = unknown>(
  opts: DiscordFetchOptions,
): Promise<DiscordResponse<T>> {
  const method = opts.method ?? 'GET';
  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const userAgent = opts.userAgent ?? DEFAULT_USER_AGENT;
  const limiter = opts.rateLimiter ?? getSharedRateLimiter();

  const routeKey = routeKeyFor(method, opts.path);

  if (!opts.skipRateLimitCheck) {
    const decision = limiter.shouldWait(routeKey);
    if (decision.shouldWait) {
      await sleep(decision.waitMs);
    }
  }

  const url = opts.path.startsWith('http') ? opts.path : `${DISCORD_API_BASE}${opts.path}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  if (opts.signal) {
    if (opts.signal.aborted) controller.abort();
    else opts.signal.addEventListener('abort', () => controller.abort(), { once: true });
  }

  const headers: Record<string, string> = {
    Authorization: opts.token,
    'User-Agent': userAgent,
    Accept: 'application/json',
    'Accept-Language': 'en-US,en;q=0.9',
    ...(opts.extraHeaders ?? {}),
  };

  if (opts.superProperties) {
    headers['X-Super-Properties'] = opts.superProperties;
  }

  if (opts.body !== undefined && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const started = Date.now();

  try {
    const res = await fetch(url, {
      method,
      headers,
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
      signal: controller.signal,
    });

    const latencyMs = Date.now() - started;
    const rl = extractRateLimit(res.headers);

    if (rl) {
      limiter.record(routeKey, rl);
    }

    const parsed = await parseBody(res);

    if (res.ok) {
      return {
        ok: true,
        status: res.status,
        data: parsed as T,
        rateLimit: rl,
        latencyMs,
        routeKey,
      };
    }

    if (res.status === 429) {
      const retryAfterMs = extractRetryAfterMs(res.headers, parsed) ?? 1000;
      if (isGlobalRateLimit(res.headers)) {
        limiter.lockGlobal(retryAfterMs);
      } else {
        limiter.record(routeKey, {
          remaining: 0,
          limit: rl?.limit ?? 1,
          resetAfterMs: retryAfterMs,
          bucket: rl?.bucket ?? null,
        });
      }
    }

    const errorBody = parsed as DiscordApiErrorBody | null;
    const retryAfterMs = res.status === 429
      ? extractRetryAfterMs(res.headers, parsed)
      : null;
    const mapped = mapDiscordError(res.status, errorBody, retryAfterMs);

    throw new DiscordHttpError(mapped);
  } catch (err) {
    if (err instanceof DiscordHttpError) throw err;

    if ((err as Error).name === 'AbortError') {
      throw new DiscordHttpError({
        status: 0,
        deliveryStatus: 'failed',
        retryable: true,
        errorCode: 'TIMEOUT',
        message: `Discord request timed out after ${timeoutMs}ms.`,
        retryAfterMs: null,
      });
    }

    throw new DiscordHttpError({
      status: 0,
      deliveryStatus: 'failed',
      retryable: true,
      errorCode: 'NETWORK_ERROR',
      message: (err as Error).message || 'Network error.',
      retryAfterMs: null,
    });
  } finally {
    clearTimeout(timer);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}