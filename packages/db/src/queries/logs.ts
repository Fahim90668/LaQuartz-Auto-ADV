import type { AuditLogDTO, DeliveryLogDTO, PaginatedResult } from '@app/shared';
import { getServiceClient } from '../client-service.js';
import type { Database } from '../types.generated.js';

type DeliveryRow = Database['public']['Tables']['delivery_logs']['Row'];
type AuditRow = Database['public']['Tables']['audit_logs']['Row'];

function toDeliveryDTO(row: DeliveryRow): DeliveryLogDTO {
  return {
    id: row.id,
    playgroundId: row.playground_id,
    channelId: row.channel_id,
    status: row.status,
    httpStatus: row.http_status,
    discordMessageId: row.discord_message_id,
    errorCode: row.error_code,
    errorMessage: row.error_message,
    latencyMs: row.latency_ms,
    attempt: row.attempt,
    createdAt: row.created_at,
  };
}

function toAuditDTO(row: AuditRow): AuditLogDTO {
  return {
    id: row.id,
    actorType: row.actor_type,
    actorId: row.actor_id,
    action: row.action,
    targetType: row.target_type,
    targetId: row.target_id,
    metadata: (row.metadata ?? {}) as Record<string, unknown>,
    createdAt: row.created_at,
  };
}

export async function listDeliveryLogsForPlayground(
  playgroundId: string,
  limit = 50,
  beforeId?: number,
): Promise<PaginatedResult<DeliveryLogDTO>> {
  let query = getServiceClient()
    .from('delivery_logs')
    .select('*')
    .eq('playground_id', playgroundId)
    .order('id', { ascending: false })
    .limit(limit);

  if (beforeId !== undefined) {
    query = query.lt('id', beforeId);
  }

  const { data, error } = await query;
  if (error) throw error;

  const items = (data ?? []).map(toDeliveryDTO);
  const nextCursor = items.length === limit ? items[items.length - 1]!.id : null;

  return { items, nextCursor };
}

export async function listDeliveryLogsForUser(
  userId: string,
  limit = 100,
): Promise<DeliveryLogDTO[]> {
  const { data, error } = await getServiceClient()
    .from('delivery_logs')
    .select('*')
    .eq('user_id', userId)
    .order('id', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []).map(toDeliveryDTO);
}

export interface InsertDeliveryLogInput {
  userId: string | null;
  playgroundId: string | null;
  jobId: string | null;
  accountId: string | null;
  channelId: string;
  status:
    | 'sent'
    | 'failed'
    | 'rate_limited'
    | 'invalid_token'
    | 'no_permission'
    | 'skipped';
  httpStatus?: number | null;
  discordMessageId?: string | null;
  errorCode?: string | null;
  errorMessage?: string | null;
  latencyMs?: number | null;
  attempt?: number | null;
}

export async function insertDeliveryLog(input: InsertDeliveryLogInput): Promise<void> {
  const { error } = await getServiceClient().from('delivery_logs').insert({
    user_id: input.userId,
    playground_id: input.playgroundId,
    job_id: input.jobId,
    account_id: input.accountId,
    channel_id: input.channelId,
    status: input.status,
    http_status: input.httpStatus ?? null,
    discord_message_id: input.discordMessageId ?? null,
    error_code: input.errorCode ?? null,
    error_message: input.errorMessage ?? null,
    latency_ms: input.latencyMs ?? null,
    attempt: input.attempt ?? null,
  });
  if (error) throw error;
}

export interface InsertAuditLogInput {
  actorType: 'user' | 'admin' | 'system' | 'bot' | 'worker';
  actorId: string | null;
  action: string;
  targetType?: string | null;
  targetId?: string | null;
  metadata?: Record<string, unknown>;
  ip?: string | null;
  userAgent?: string | null;
}

export async function insertAuditLog(input: InsertAuditLogInput): Promise<void> {
  const { error } = await getServiceClient().from('audit_logs').insert({
    actor_type: input.actorType,
    actor_id: input.actorId,
    action: input.action,
    target_type: input.targetType ?? null,
    target_id: input.targetId ?? null,
    metadata: input.metadata ?? {},
    ip: input.ip ?? null,
    user_agent: input.userAgent ?? null,
  });
  if (error) throw error;
}

export async function listAuditLogs(limit = 100): Promise<AuditLogDTO[]> {
  const { data, error } = await getServiceClient()
    .from('audit_logs')
    .select('*')
    .order('id', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map(toAuditDTO);
}