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
    this.timer = setTimeout(() => void this.tick(), this.env.WORKER_POLL_MS);
  }

  private async tick(): Promise<void> {
    if (!this.running) return;

    try {
      const capacity = this.env.WORKER_CONCURRENCY - this.active;
      if (capacity <= 0) {
        this.scheduleNext();
        return;
      }

      const jobs: JobRow[] = await jobsDb.claimDueJobs(capacity, this.env.WORKER_ID);
      if (jobs.length === 0) {
        this.scheduleNext();
        return;
      }

      getLogger().debug('claimed jobs', { count: jobs.length });

      for (const job of jobs) {
        this.active++;
        void this.runOne(job).finally(() => {
          this.active--;
        });
      }
    } catch (err) {
      getLogger().error('scheduler tick failed', { err: (err as Error).message });
    } finally {
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