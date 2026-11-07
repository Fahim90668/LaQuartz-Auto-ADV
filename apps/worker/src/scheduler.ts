import { jobs as jobsDb } from '@app/db';
import type { Database } from '@app/db';
import type { Env } from './env.js';
import type { Heartbeat } from './heartbeat.js';
import { getLogger } from './logger.js';
import { executeJob } from './executor.js';

type JobRow = Database['public']['Tables']['scheduled_jobs']['Row'];

export class Scheduler {
  private running = false;
  private timer: NodeJS.Timeout | null = null;
  private active = 0;
  private consecutiveFailures = 0;
  private pausedUntil = 0;

  constructor(
    private readonly env: Env,
    private readonly heartbeat: Heartbeat,
  ) {}

  start(): void {
    if (this.running) return;
    this.running = true;
    getLogger().info('scheduler started', {
      pollMs: this.env.WORKER_POLL_MS,
      concurrency: this.env.WORKER_CONCURRENCY,
    });
    this.scheduleNext();
  }

  async stop(): Promise<void> {
    this.running = false;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    const deadline = Date.now() + 30_000;
    while (this.active > 0 && Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, 200));
    }
    getLogger().info('scheduler stopped');
  }

  private scheduleNext(): void {
    if (!this.running) return;

    // Backoff after repeated failures: 1s → 2s → 4s → 8s → 10s (cap).
    // Prevents the "spam Supabase while it's rejecting" pattern that
    // cascades into fetch-fail death spirals on constrained containers.
    let delay = this.env.WORKER_POLL_MS;
    if (this.consecutiveFailures > 0) {
      const backoff = Math.min(10_000, 1000 * Math.pow(2, this.consecutiveFailures - 1));
      delay = Math.max(delay, backoff);
    }

    const waitMs = Math.max(0, this.pausedUntil - Date.now());
    const finalDelay = Math.max(delay, waitMs);

    this.timer = setTimeout(() => void this.tick(), finalDelay);
  }

  private async tick(): Promise<void> {
    if (!this.running) return;

    try {
      const capacity = this.env.WORKER_CONCURRENCY - this.active;

      if (capacity > 0) {
        const jobs: JobRow[] = await jobsDb.claimDueJobs(capacity, this.env.WORKER_ID);

        if (jobs.length > 0) {
          getLogger().debug('claimed jobs', { count: jobs.length });

          for (const job of jobs) {
            this.active++;
            void this.runOne(job).finally(() => {
              this.active--;
            });
          }
        }

        // Success → reset failure counter
        this.consecutiveFailures = 0;
        this.pausedUntil = 0;
      }
    } catch (err) {
      this.consecutiveFailures += 1;

      // Extract the underlying cause. Node's undici wraps DNS/TLS/timeout
      // errors inside err.cause — without it, the message is just "fetch failed".
      const cause = (err as { cause?: { message?: string; code?: string } }).cause;
      getLogger().error('scheduler tick failed', {
        err: (err as Error).message,
        causeMessage: cause?.message ?? null,
        causeCode: cause?.code ?? null,
        consecutiveFailures: this.consecutiveFailures,
      });

      // After 5 consecutive failures, pause for 15s. Stops CPU thrashing
      // and gives Supabase / the container network time to recover.
      if (this.consecutiveFailures >= 5) {
        this.pausedUntil = Date.now() + 15_000;
        getLogger().warn('scheduler pausing after repeated failures', {
          consecutiveFailures: this.consecutiveFailures,
          pauseMs: 15_000,
        });
      }
    } finally {
      // SINGLE scheduleNext per tick — inside finally only.
      this.scheduleNext();
    }
  }

  private async runOne(job: JobRow): Promise<void> {
    try {
      await executeJob(job, this.env, this.heartbeat);
    } catch (err) {
      getLogger().error('job execution threw', {
        jobId: job.id,
        err: (err as Error).message,
      });
      try {
        await jobsDb.failJob({
          jobId: job.id,
          error: `unhandled: ${(err as Error).message}`,
          retryable: true,
          delivery: 'failed',
          httpStatus: null,
        });
      } catch (failErr) {
        getLogger().error('failed to record job failure', {
          jobId: job.id,
          err: (failErr as Error).message,
        });
      }
    }
  }

  getActiveCount(): number {
    return this.active;
  }
                                          }
