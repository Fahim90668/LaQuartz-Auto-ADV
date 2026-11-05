import {
  accounts as accountsDb,
  jobs as jobsDb,
  playgrounds as playgroundsDb,
  getServiceClient,
} from '@app/db';
import { getChannelSlowmode } from '@app/discord';
import { decryptToken } from '@app/crypto';
import type { Database } from '@app/db';
import type { Env } from './env.js';
import type { Heartbeat } from './heartbeat.js';
import { getLogger } from './logger.js';
import { sendAdvertisement } from './sender.js';
import { getSlowmodeForChannel } from './slowmode.js';
import { computeRateLimitWaitMs } from './backoff.js';
import {
type JobRow = Database['public']['Tables']['scheduled_jobs']['Row'];

const MIN_SLOWMODE_SECONDS = 5;

interface JobContext {
  job: JobRow;
  accountId: string;
  userId: string;
  channelId: string;
  mode: 'manual' | 'slowmode';
  intervalSeconds: number;
  channelSlowmodeSeconds: number;
  messageContent: string | null;
  messageId: string | null;
}

async function loadContext(job: JobRow): Promise<JobContext | null> {
  const db = getServiceClient();

  const { data: channel, error: chErr } = await db
    .from('playground_channels')
    .select('channel_id, slowmode_seconds, playground_id, is_active')
    .eq('id', job.playground_channel_id)
    .maybeSingle();
  if (chErr) throw chErr;
  if (!channel || !channel.is_active) return null;

  const { data: playground, error: pgErr } = await db
    .from('playgrounds')
    .select(
      'id, user_id, account_id, mode, interval_seconds, status, discord_accounts(id, status)',
    )
    .eq('id', job.playground_id)
    .maybeSingle();
  if (pgErr) throw pgErr;
  if (!playground) return null;
  if (playground.status !== 'running') return null;

  const account = (
    playground as unknown as { discord_accounts: { id: string; status: string } | null }
  ).discord_accounts;
  if (!account || account.status !== 'active') return null;

  let messageContent: string | null = null;
  let messageId: string | null = null;

  if (job.message_id) {
    const { data: msg, error: msgErr } = await db
      .from('playground_messages')
      .select('id, content, is_active')
      .eq('id', job.message_id)
      .maybeSingle();
    if (msgErr) throw msgErr;
    if (msg && msg.is_active) {
      messageContent = msg.content;
      messageId = msg.id;
    }
  }

  if (!messageContent) {
    const { data: fallback, error: fbErr } = await db
      .from('playground_messages')
      .select('id, content')
      .eq('playground_id', job.playground_id)
      .eq('is_active', true)
      .order('position', { ascending: true })
      .limit(1)
      .maybeSingle();
    if (fbErr) throw fbErr;
    if (fallback) {
      messageContent = fallback.content;
      messageId = fallback.id;
    }
  }

  if (!messageContent) return null;

  return {
    job,
    accountId: playground.account_id,
    userId: playground.user_id,
    channelId: channel.channel_id,
    mode: playground.mode,
    intervalSeconds: playground.interval_seconds,
    channelSlowmodeSeconds: channel.slowmode_seconds,
    messageContent,
    messageId,
  };
}

async function resolveToken(accountId: string): Promise<string | null> {
  const bundle = await accountsDb.getAccountTokenBundle(accountId);
  if (!bundle) return null;
  try {
    return decryptToken({
      ciphertext: bundle.ciphertext,
      iv: bundle.iv,
      tag: bundle.tag,
      keyVersion: bundle.keyVersion,
    });
  } catch (err) {
    getLogger().error('token decrypt failed', {
      accountId,
      err: (err as Error).message,
    });
    return null;
  }
}

async function resolveSlowmode(
  ctx: JobContext,
  token: string,
): Promise<number> {
  if (ctx.mode !== 'slowmode') {
    return ctx.intervalSeconds;
  }

  try {
    const result = await getSlowmodeForChannel(
      ctx.accountId,
      ctx.channelId,
      token,
    );
    if (result.slowmodeSeconds > 0) {
      return Math.max(MIN_SLOWMODE_SECONDS, result.slowmodeSeconds);
    }
    return Math.max(MIN_SLOWMODE_SECONDS, ctx.channelSlowmodeSeconds);
  } catch {
    return Math.max(MIN_SLOWMODE_SECONDS, ctx.channelSlowmodeSeconds);
  }
}

export interface ExecuteResult {
  jobId: string;
  outcome: 'sent' | 'failed' | 'skipped';
  latencyMs: number;
}

export async function executeJob(
  job: JobRow,
  env: Env,
  heartbeat: Heartbeat,
): Promise<ExecuteResult> {
  const log = getLogger().child({ jobId: job.id, playgroundId: job.playground_id });
  const started = Date.now();

  let ctx: JobContext | null = null;
  try {
    ctx = await loadContext(job);
  } catch (err) {
    log.error('job context load failed', { err: (err as Error).message });
    await jobsDb.failJob({
      jobId: job.id,
      error: `context_load_failed: ${(err as Error).message}`,
      retryable: true,
      delivery: 'failed',
      httpStatus: null,
    });
    heartbeat.recordFailure();
    return { jobId: job.id, outcome: 'failed', latencyMs: Date.now() - started };
  }

  if (!ctx) {
    log.info('job skipped: playground or channel inactive');
    await jobsDb.failJob({
      jobId: job.id,
      error: 'playground_or_channel_inactive',
      retryable: false,
      delivery: 'skipped',
      httpStatus: null,
    });
    return { jobId: job.id, outcome: 'skipped', latencyMs: Date.now() - started };
  }

  const token = await resolveToken(ctx.accountId);
  if (!token) {
    log.warn('job failed: account token unusable');
    await jobsDb.failJob({
      jobId: job.id,
      error: 'account_token_unavailable',
      retryable: false,
      delivery: 'invalid_token',
      httpStatus: 401,
    });
    heartbeat.recordFailure();
    return { jobId: job.id, outcome: 'failed', latencyMs: Date.now() - started };
  }

  const sendResult = await sendAdvertisement({
    token,
    channelId: ctx.channelId,
    content: ctx.messageContent!,
    env,
  });

  if (sendResult.ok) {
    const slowmode = await resolveSlowmode(ctx, token);
    const nextRunAt = new Date(
      Date.now() + slowmode * 1000 + Math.floor(Math.random() * 3_000),
    );

    await jobsDb.completeJob({
      jobId: job.id,
      httpStatus: sendResult.httpStatus,
      discordMessageId: sendResult.discordMessageId,
      latencyMs: sendResult.latencyMs,
      nextRunAt: nextRunAt.toISOString(),
    });

    await scheduleNext(ctx, nextRunAt);

    heartbeat.recordSuccess();
    log.info('job sent', {
      latencyMs: sendResult.latencyMs,
      nextRunAt: nextRunAt.toISOString(),
      channelId: ctx.channelId,
    });

    return { jobId: job.id, outcome: 'sent', latencyMs: Date.now() - started };
  }

  const retryable = sendResult.retryable;
  const message = sendResult.errorMessage ?? 'unknown_error';

  if (retryable && sendResult.retryAfterMs) {
    const waitMs = computeRateLimitWaitMs(sendResult.retryAfterMs, job.attempts);
    log.warn('rate limited, backing off', {
      retryAfterMs: sendResult.retryAfterMs,
      waitMs,
    });
  }

  await jobsDb.failJob({
    jobId: job.id,
    error: `${sendResult.errorCode ?? 'error'}: ${message}`,
    retryable,
    delivery: sendResult.deliveryStatus,
    httpStatus: sendResult.httpStatus,
  });

  if (
    sendResult.deliveryStatus === 'invalid_token' &&
    sendResult.httpStatus === 401
  ) {
    try {
      await accountsDb.setAccountValidationStatus(
        ctx.accountId,
        'invalid',
        message,
      );
    } catch (err) {
      log.warn('failed to mark account invalid', {
        err: (err as Error).message,
      });
    }
  }

  if (
    sendResult.deliveryStatus === 'no_permission' ||
    (sendResult.httpStatus === 404 && retryable === false)
  ) {
    try {
      const db = getServiceClient();
      await db
        .from('playground_channels')
        .update({ is_active: false })
        .eq('id', job.playground_channel_id);
      log.warn('channel deactivated', {
        playgroundChannelId: job.playground_channel_id,
      });
    } catch (err) {
      log.warn('failed to deactivate channel', {
        err: (err as Error).message,
      });
    }
  }

  heartbeat.recordFailure();
  log.warn('job failed', {
    httpStatus: sendResult.httpStatus,
    errorCode: sendResult.errorCode,
    retryable,
    attempts: job.attempts,
    maxAttempts: job.max_attempts,
  });

  return { jobId: job.id, outcome: 'failed', latencyMs: Date.now() - started };
}

async function scheduleNext(ctx: JobContext, nextRunAt: Date): Promise<void> {
  const key = `${ctx.job.playground_id}:${ctx.job.playground_channel_id}:${nextRunAt.getTime()}`;
  try {
    await jobsDb.seedJob({
      playgroundId: ctx.job.playground_id,
      playgroundChannelId: ctx.job.playground_channel_id,
      messageId: ctx.messageId,
      runAt: nextRunAt.toISOString(),
      idempotencyKey: key,
    });
  } catch (err) {
    getLogger().error('failed to seed next job', {
      jobId: ctx.job.id,
      err: (err as Error).message,
    });
  }
}

export async function updateMessageUsage(messageId: string | null): Promise<void> {
  if (!messageId) return;
  try {
    const db = getServiceClient();
    const { data, error } = await db
      .from('playground_messages')
      .select('times_used')
      .eq('id', messageId)
      .maybeSingle();
    if (error) return;
    const current = data?.times_used ?? 0;
    await db
      .from('playground_messages')
      .update({ times_used: current + 1, last_used_at: new Date().toISOString() })
      .eq('id', messageId);
  } catch {
    // non-critical
  }
}
