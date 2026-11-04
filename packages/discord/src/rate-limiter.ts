export interface RateLimitState {
  remaining: number;
  limit: number;
  resetAfterMs: number;
  bucket: string | null;
}

interface Bucket {
  remaining: number;
  limit: number;
  resetAt: number;
}

export interface WaitDecision {
  shouldWait: boolean;
  waitMs: number;
  reason: 'route' | 'global' | null;
}

export class MemoryRateLimiter {
  private buckets = new Map<string, Bucket>();
  private globalLockUntil = 0;

  shouldWait(routeKey: string): WaitDecision {
    const now = Date.now();

    if (this.globalLockUntil > now) {
      return { shouldWait: true, waitMs: this.globalLockUntil - now, reason: 'global' };
    }

    const bucket = this.buckets.get(routeKey);
    if (!bucket) {
      return { shouldWait: false, waitMs: 0, reason: null };
    }

    if (bucket.remaining > 0) {
      return { shouldWait: false, waitMs: 0, reason: null };
    }

    if (bucket.resetAt <= now) {
      this.buckets.delete(routeKey);
      return { shouldWait: false, waitMs: 0, reason: null };
    }

    return { shouldWait: true, waitMs: bucket.resetAt - now, reason: 'route' };
  }

  record(routeKey: string, state: RateLimitState): void {
    const resetAt = Date.now() + state.resetAfterMs;
    this.buckets.set(routeKey, {
      remaining: state.remaining,
      limit: state.limit,
      resetAt,
    });
  }

  lockGlobal(waitMs: number): void {
    const until = Date.now() + Math.max(0, waitMs);
    if (until > this.globalLockUntil) {
      this.globalLockUntil = until;
    }
  }

  isGloballyLocked(): { locked: boolean; waitMs: number } {
    const now = Date.now();
    if (this.globalLockUntil > now) {
      return { locked: true, waitMs: this.globalLockUntil - now };
    }
    return { locked: false, waitMs: 0 };
  }

  get(routeKey: string): Bucket | undefined {
    return this.buckets.get(routeKey);
  }

  clear(): void {
    this.buckets.clear();
    this.globalLockUntil = 0;
  }
}

const MAJOR_PARAMS = new Set(['channels', 'guilds', 'webhooks']);

export function routeKeyFor(method: string, path: string): string {
  const clean = path.split('?')[0] ?? path;
  const parts = clean.split('/').filter(Boolean);

  const major: string[] = [];
  for (let i = 0; i < parts.length; i++) {
    const segment = parts[i]!;
    if (MAJOR_PARAMS.has(segment)) {
      major.push(segment);
      const next = parts[i + 1];
      if (next && /^\d+$/.test(next)) {
        major.push(next);
        i += 1;
      }
    }
  }

  const majorStr = major.length > 0 ? major.join('/') : 'global';
  return `${method.toUpperCase()}:${majorStr}`;
}

let sharedLimiter: MemoryRateLimiter | null = null;

export function getSharedRateLimiter(): MemoryRateLimiter {
  if (!sharedLimiter) sharedLimiter = new MemoryRateLimiter();
  return sharedLimiter;
}

export function resetSharedRateLimiterForTests(): void {
  sharedLimiter = null;
}