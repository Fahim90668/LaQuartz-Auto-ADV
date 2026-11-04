import { getServiceClient } from '@app/db';
import type { MemoryRateLimiter } from '@app/discord';

export interface Bucket {
  tokens: number;
  capacity: number;
  refillRate: number;
  updatedAt: number;
}

const LOCAL_TTL_MS = 30_000;

export class DistributedRateLimiter {
  private readonly memory: MemoryRateLimiter;
  private readonly localCache = new Map<string, Bucket>();
  private readonly inflight = new Map<string, Promise<void>>();

  constructor(memory: MemoryRateLimiter) {
    this.memory = memory;
  }

  get discordMemory(): MemoryRateLimiter {
    return this.memory;
  }

  async tryConsume(key: string, cost = 1): Promise<{ allowed: boolean; waitMs: number }> {
    const local = this.localCache.get(key);
    if (local) {
      const elapsedSec = (Date.now() - local.updatedAt) / 1000;
      const refilled = Math.min(
        local.capacity,
        local.tokens + elapsedSec * local.refillRate,
      );
      local.tokens = refilled;
      local.updatedAt = Date.now();
    }

    if (local && local.tokens >= cost) {
      local.tokens -= cost;
      await this.persist(key, local);
      return { allowed: true, waitMs: 0 };
    }

    const dbBucket = await this.loadFromDb(key);
    if (dbBucket.tokens >= cost) {
      dbBucket.tokens -= cost;
      dbBucket.updatedAt = Date.now();
      this.localCache.set(key, dbBucket);
      await this.persist(key, dbBucket);
      return { allowed: true, waitMs: 0 };
    }

    const missing = cost - dbBucket.tokens;
    const waitMs = Math.ceil((missing / dbBucket.refillRate) * 1000);
    return { allowed: false, waitMs };
  }

  private async loadFromDb(key: string): Promise<Bucket> {
    const db = getServiceClient();
    const { data, error } = await db
      .from('rate_limit_buckets')
      .select('tokens, capacity, refill_rate, updated_at')
      .eq('key', key)
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      const fresh: Bucket = {
        tokens: 5,
        capacity: 5,
        refillRate: 1,
        updatedAt: Date.now(),
      };
      await this.persist(key, fresh);
      return fresh;
    }

    return {
      tokens: Number(data.tokens),
      capacity: Number(data.capacity),
      refillRate: Number(data.refill_rate),
      updatedAt: new Date(data.updated_at).getTime(),
    };
  }

  private async persist(key: string, bucket: Bucket): Promise<void> {
    const existing = this.inflight.get(key);
    if (existing) return existing;

    const job = (async () => {
      const db = getServiceClient();
      const { error } = await db.from('rate_limit_buckets').upsert({
        key,
        tokens: bucket.tokens,
        capacity: bucket.capacity,
        refill_rate: bucket.refillRate,
        updated_at: new Date().toISOString(),
      });
      if (error) throw error;
      this.localCache.set(key, bucket);
      setTimeout(() => this.localCache.delete(key), LOCAL_TTL_MS);
    })();

    this.inflight.set(key, job);
    try {
      await job;
    } finally {
      this.inflight.delete(key);
    }
  }
}