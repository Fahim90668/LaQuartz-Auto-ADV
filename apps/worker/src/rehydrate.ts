import { jobs as jobsDb } from '@app/db';
import { getLogger } from './logger.js';

export interface RehydrationResult {
  recoveredJobs: number;
  rescheduledPlaygrounds: number;
  durationMs: number;
}

export async function rehydrateRuntime(): Promise<RehydrationResult> {
  const log = getLogger();
  const started = Date.now();

  log.info('rehydration starting');

  try {
    const result = await jobsDb.rehydrateRuntime();

    log.info('rehydration complete', {
      recoveredJobs: result.recoveredJobs,
      rescheduledPlaygrounds: result.rescheduledPlaygrounds,
      durationMs: Date.now() - started,
    });

    return {
      ...result,
      durationMs: Date.now() - started,
    };
  } catch (err) {
    log.error('rehydration failed', { err: (err as Error).message });
    return { recoveredJobs: 0, rescheduledPlaygrounds: 0, durationMs: Date.now() - started };
  }
}