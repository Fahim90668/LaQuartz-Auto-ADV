import { loadEnv } from './env.js';
import { initLogger, getLogger } from './logger.js';
import { claimWorkerIdentity } from './lock.js';
import { rehydrateRuntime } from './rehydrate.js';
import { Heartbeat } from './heartbeat.js';
import { Scheduler } from './scheduler.js';
import { ContinuousManager } from './continuous.js';

async function main() {
  const env = loadEnv();
  initLogger(env);
  const log = getLogger();

  log.info('worker starting', {
    workerId: env.WORKER_ID,
    version: env.WORKER_VERSION,
    node: process.version,
  });

  await claimWorkerIdentity(env);

  const rehydrated = await rehydrateRuntime();
  if (rehydrated.recoveredJobs > 0 || rehydrated.rescheduledPlaygrounds > 0) {
    log.info('runtime rehydrated', rehydrated);
  } else {
    log.info('runtime already healthy', { durationMs: rehydrated.durationMs });
  }

  const heartbeat = new Heartbeat(env);
  heartbeat.start();

  const scheduler = new Scheduler(env, heartbeat);
  scheduler.start();

  const continuousManager = new ContinuousManager();
  continuousManager.start();

  const shutdown = async (signal: string) => {
    log.info('shutdown initiated', {
      signal,
      active: scheduler.getActiveCount(),
    });
    heartbeat.stop();
    await scheduler.stop();
    await continuousManager.stop();
    log.info('shutdown complete');
    process.exit(0);
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));

  process.on('unhandledRejection', (reason) => {
    log.error('unhandled rejection', {
      reason: reason instanceof Error ? reason.message : String(reason),
    });
  });

  process.on('uncaughtException', (err) => {
    log.fatal('uncaught exception', { err: err.message, stack: err.stack });
    process.exit(1);
  });
}

main().catch((err) => {
  console.error('[worker] fatal startup error:', err);
  process.exit(1);
});
