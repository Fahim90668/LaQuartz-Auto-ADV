import { getServiceClient } from '../client-service.js';

export type ContinuousType = 'onliner' | 'vc' | 'typer';
export type ContinuousStatus = 'pending' | 'active' | 'paused' | 'expired' | 'error';

export interface ContinuousService {
  id: string;
  userId: string;
  accountId: string;
  serviceType: ContinuousType;
  config: Record<string, unknown>;
  status: ContinuousStatus;
  startsAt: string;
  expiresAt: string;
  lastSeenAt: string | null;
  lastError: string | null;
  lastErrorAt: string | null;
  stoppedAt: string | null;
}

function toDTO(row: Record<string, unknown>): ContinuousService {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    accountId: row.account_id as string,
    serviceType: row.service_type as ContinuousType,
    config: (row.config as Record<string, unknown>) ?? {},
    status: row.status as ContinuousStatus,
    startsAt: row.starts_at as string,
    expiresAt: row.expires_at as string,
    lastSeenAt: (row.last_seen_at as string | null) ?? null,
    lastError: (row.last_error as string | null) ?? null,
    lastErrorAt: (row.last_error_at as string | null) ?? null,
    stoppedAt: (row.stopped_at as string | null) ?? null,
  };
}

export async function listServicesForUser(userId: string): Promise<ContinuousService[]> {
  const { data, error } = await getServiceClient()
    .from('continuous_services')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(toDTO);
}

export async function listActiveServices(): Promise<ContinuousService[]> {
  const { data, error } = await getServiceClient()
    .from('continuous_services')
    .select('*')
    .in('status', ['pending', 'active', 'paused'])
    .order('expires_at', { ascending: true });
  if (error) throw error;
  return (data ?? []).map(toDTO);
}

export async function createService(args: {
  userId: string;
  accountId: string;
  serviceType: ContinuousType;
  config: Record<string, unknown>;
  durationSeconds: number;
}): Promise<{ id: string; expiresAt: string }> {
  const { data, error } = await getServiceClient().rpc('create_continuous_service', {
    p_user_id: args.userId,
    p_account_id: args.accountId,
    p_service: args.serviceType,
    p_config: args.config,
    p_duration_s: args.durationSeconds,
  });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) throw new Error('create_continuous_service returned no row');
  return { id: row.service_id as string, expiresAt: row.expires_at as string };
}

export async function stopService(serviceId: string, userId: string): Promise<boolean> {
  const { data, error } = await getServiceClient().rpc('stop_continuous_service', {
    p_service_id: serviceId,
    p_user_id: userId,
  });
  if (error) throw error;
  return Boolean(data);
}

export async function updateServiceStatus(
  serviceId: string,
  status: ContinuousStatus,
  errorMsg?: string | null,
): Promise<void> {
  const now = new Date().toISOString();
  const { error } = await getServiceClient()
    .from('continuous_services')
    .update({
      status,
      last_error: errorMsg ?? null,
      last_error_at: errorMsg ? now : null,
      stopped_at: status === 'expired' || status === 'error' ? now : null,
    })
    .eq('id', serviceId);
  if (error) throw error;
}

export async function touchService(serviceId: string): Promise<void> {
  const { error } = await getServiceClient()
    .from('continuous_services')
    .update({ last_seen_at: new Date().toISOString() })
    .eq('id', serviceId);
  if (error) throw error;
      }
