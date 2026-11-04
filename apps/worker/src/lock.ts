import { getServiceClient } from '@app/db';
import { getLogger } from './logger.js';
import type { Env } from './env.js';

const STALE_THRESHOLD_MS = 60_000;

export async function claimWorkerIdentity(env: Env): Promise<void> {
  const db = getServiceClient();
  const log = getLogger();

  const { data, error } = await db
    .from('worker_heartbeats')
    .select('worker_id, last_seen_at')
    .eq('worker_id', env.WORKER_ID)
    .maybeSingle();

  if (error) {
    log.warn('worker identity check failed', { err: error.message });
    return;
  }

  if (data) {
    const lastSeen = new Date(data.last_seen_at).getTime();
    const ageMs = Date.now() - lastSeen;
    if (ageMs < STALE_THRESHOLD_MS) {
      log.warn('worker id already active', {
        workerId: env.WORKER_ID,
        lastSeenMsAgo: ageMs,
      });
    } else {
      log.info('reclaiming stale worker id', {
        workerId: env.WORKER_ID,
        lastSeenMsAgo: ageMs,
      });
    }
  }

  const { error: upsertErr } = await db.from('worker_heartbeats').upsert({
    worker_id: env.WORKER_ID,
    role: 'advertiser',
    version: env.WORKER_VERSION,
    started_at: new Date().toISOString(),
    last_seen_at: new Date().toISOString(),
    jobs_processed: 0,
    jobs_failed: 0,
    metadata: {},
  });
  if (upsertErr) throw upsertErr;

  log.info('worker identity claimed', { workerId: env.WORKER_ID });
}