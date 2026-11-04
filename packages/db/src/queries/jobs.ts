import type { ScheduledJobDTO } from '@app/shared';
import { getServiceClient } from '../client-service.js';
import type { Database } from '../types.generated.js';

type JobRow = Database['public']['Tables']['scheduled_jobs']['Row'];

export function toJobDTO(row: JobRow): ScheduledJobDTO {
  return {
    id: row.id,
    playgroundId: row.playground_id,
    playgroundChannelId: row.playground_channel_id,
    messageId: row.message_id,
    runAt: row.run_at,
    status: row.status,
    attempts: row.attempts,
    maxAttempts: row.max_attempts,
    lastError: row.last_error,
    finishedAt: row.finished_at,
    createdAt: row.created_at,
  };
}

export interface SeedJobInput {
  playgroundId: string;
  playgroundChannelId: string;
  messageId: string | null;
  runAt: string;
  idempotencyKey: string;
}

export async function seedJob(input: SeedJobInput): Promise<void> {
  const { error } = await getServiceClient()
    .from('scheduled_jobs')
    .upsert(
      {
        playground_id: input.playgroundId,
        playground_channel_id: input.playgroundChannelId,
        message_id: input.messageId,
        run_at: input.runAt,
        idempotency_key: input.idempotencyKey,
        status: 'pending',
      },
      { onConflict: 'idempotency_key', ignoreDuplicates: true },
    );
  if (error) throw error;
}

export async function seedJobsForPlayground(
  playgroundId: string,
  nextRunsByChannel: Array<{
    playgroundChannelId: string;
    messageId: string | null;
    runAt: string;
  }>,
): Promise<void> {
  if (nextRunsByChannel.length === 0) return;

  const now = Date.now();
  const rows = nextRunsByChannel.map((r) => ({
    playground_id: playgroundId,
    playground_channel_id: r.playgroundChannelId,
    message_id: r.messageId,
    run_at: r.runAt,
    idempotency_key: `${playgroundId}:${r.playgroundChannelId}:${now}`,
    status: 'pending' as const,
  }));

  const { error } = await getServiceClient()
    .from('scheduled_jobs')
    .upsert(rows, { onConflict: 'idempotency_key', ignoreDuplicates: true });
  if (error) throw error;
}

export async function cancelJobsForPlayground(playgroundId: string): Promise<void> {
  const { error } = await getServiceClient()
    .from('scheduled_jobs')
    .update({ status: 'cancelled', finished_at: new Date().toISOString() })
    .eq('playground_id', playgroundId)
    .eq('status', 'pending');
  if (error) throw error;
}

export async function claimDueJobs(limit: number, workerId: string): Promise<JobRow[]> {
  const { data, error } = await getServiceClient().rpc('claim_due_jobs', {
    p_limit: limit,
    p_worker: workerId,
  });
  if (error) throw error;
  return data ?? [];
}

export async function completeJob(args: {
  jobId: string;
  httpStatus: number;
  discordMessageId: string | null;
  latencyMs: number;
  nextRunAt: string;
}): Promise<void> {
  const { error } = await getServiceClient().rpc('complete_job', {
    p_job_id: args.jobId,
    p_http_status: args.httpStatus,
    p_discord_message_id: args.discordMessageId,
    p_latency_ms: args.latencyMs,
    p_next_run_at: args.nextRunAt,
  });
  if (error) throw error;
}

export async function failJob(args: {
  jobId: string;
  error: string;
  retryable: boolean;
  delivery:
    | 'sent'
    | 'failed'
    | 'rate_limited'
    | 'invalid_token'
    | 'no_permission'
    | 'skipped';
  httpStatus: number | null;
}): Promise<void> {
  const { error } = await getServiceClient().rpc('fail_job', {
    p_job_id: args.jobId,
    p_error: args.error,
    p_retryable: args.retryable,
    p_delivery: args.delivery,
    p_http_status: args.httpStatus,
  });
  if (error) throw error;
}

export async function rehydrateRuntime(): Promise<{
  recoveredJobs: number;
  rescheduledPlaygrounds: number;
}> {
  const { data, error } = await getServiceClient().rpc('rehydrate_runtime');
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  return {
    recoveredJobs: Number(row?.recovered_jobs ?? 0),
    rescheduledPlaygrounds: Number(row?.rescheduled_playgrounds ?? 0),
  };
}

export async function recoverStaleJobs(): Promise<number> {
  const { data, error } = await getServiceClient().rpc('recover_stale_jobs');
  if (error) throw error;
  return Number(data ?? 0);
}