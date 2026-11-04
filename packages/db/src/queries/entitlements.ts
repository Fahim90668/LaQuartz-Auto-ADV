import type { AccessSnapshot, EntitlementDTO } from '@app/shared';
import { getServiceClient } from '../client-service.js';
import type { Database } from '../types.generated.js';

type EntitlementRow = Database['public']['Tables']['entitlements']['Row'];

function toDTO(row: EntitlementRow): EntitlementDTO {
  return {
    id: row.id,
    userId: row.user_id,
    codeId: row.code_id,
    playgroundLimit: row.playground_limit,
    status: row.status,
    startsAt: row.starts_at,
    expiresAt: row.expires_at,
    revokedAt: row.revoked_at,
    createdAt: row.created_at,
  };
}

export async function listEntitlementsForUser(userId: string): Promise<EntitlementDTO[]> {
  const { data, error } = await getServiceClient()
    .from('entitlements')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map(toDTO);
}

export async function getAccessSnapshot(userId: string): Promise<AccessSnapshot> {
  const db = getServiceClient();

  const [hasAccessRes, limitRes, usedRes, entsRes, profRes] = await Promise.all([
    db.rpc('fn_has_access', { p_user: userId }),
    db.rpc('fn_effective_playground_limit', { p_user: userId }),
    db.from('playgrounds').select('id', { count: 'exact', head: true }).eq('user_id', userId),
    db
      .from('entitlements')
      .select('expires_at')
      .eq('user_id', userId)
      .eq('status', 'active')
      .not('expires_at', 'is', null),
    db.from('profiles').select('is_banned').eq('id', userId).maybeSingle(),
  ]);

  if (hasAccessRes.error) throw hasAccessRes.error;
  if (limitRes.error) throw limitRes.error;
  if (usedRes.error) throw usedRes.error;
  if (entsRes.error) throw entsRes.error;
  if (profRes.error) throw profRes.error;

  const expiresList = (entsRes.data ?? []).map((e) => e.expires_at).filter(Boolean) as string[];
  const soonest = expiresList.length
    ? expiresList.reduce((min, cur) => (cur < min ? cur : min))
    : null;

  return {
    hasAccess: Boolean(hasAccessRes.data),
    effectivePlaygroundLimit: Number(limitRes.data ?? 0),
    playgroundsUsed: usedRes.count ?? 0,
    soonestExpiry: soonest,
    isLifetime: expiresList.length === 0 && Boolean(hasAccessRes.data),
    isBanned: Boolean(profRes.data?.is_banned ?? false),
  };
}

export async function expireEntitlements(): Promise<number> {
  const { data, error } = await getServiceClient().rpc('expire_entitlements');
  if (error) throw error;
  return Number(data ?? 0);
}