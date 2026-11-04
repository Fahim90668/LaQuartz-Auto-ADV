import { getServiceClient } from '@app/db';
import { getLogger } from './logger.js';
import type { Env } from './env.js';

const HEARTBEAT_INTERVAL_MS = 20_000;

export interface WorkerStats {
  jobsProcessed: number;
  jobsFailed: number;
}

export class Heartbeat {
  private timer: NodeJS.Timeout | null = null;
  private readonly startedAt = new Date().toISOString();
  private readonly stats: WorkerStats = { jobsProcessed: 0, jobsFailed: 0 };

  constructor(private readonly env: Env) {}

  recordSuccess(): void {
    this.stats.jobsProcessed++;
  }

  recordFailure(): void {
    this.stats.jobsFailed++;
  }

  getStats(): WorkerStats {
    return { ...this.stats };
  }

  start(): void {
    void this.tick();
    this.timer = setInterval(() => void this.tick(), HEARTBEAT_INTERVAL_MS);
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private async tick(): Promise<void> {
    try {
      const db = getServiceClient();
      const { error } = await db.from('worker_heartbeats').upsert({
        worker_id: this.env.WORKER_ID,
        role: 'advertiser',
        version: this.env.WORKER_VERSION,
        started_at: this.startedAt,
        last_seen_at: new Date().toISOString(),
        jobs_processed: this.stats.jobsProcessed,
        jobs_failed: this.stats.jobsFailed,
        metadata: {
          concurrency: this.env.WORKER_CONCURRENCY,
          pollMs: this.env.WORKER_POLL_MS,
          nodeVersion: process.version,
          pid: process.pid,
        },
      });
      if (error) throw error;
    } catch (err) {
      getLogger().warn('heartbeat write failed', { err: (err as Error).message });
    }
  }
}