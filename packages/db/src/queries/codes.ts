import type { CodeDuration, RedeemCodeDTO, RedeemResult } from '@app/shared';
import { getServiceClient } from '../client-service.js';
import type { Database } from '../types.generated.js';

type CodeRow = Database['public']['Tables']['redeem_codes']['Row'];

function toDTO(row: CodeRow): RedeemCodeDTO {
  return {
    id: row.id,
    codePreview: row.code_preview,
    duration: row.duration as CodeDuration,
    durationDays: row.duration_days,
    playgroundLimit: row.playground_limit,
    limitOnliner: (row as unknown as { limit_onliner?: number }).limit_onliner ?? 0,
    limitVc: (row as unknown as { limit_vc?: number }).limit_vc ?? 0,
    limitTyper: (row as unknown as { limit_typer?: number }).limit_typer ?? 0,
    status: row.status,
    redeemedBy: row.redeemed_by,
    redeemedAt: row.redeemed_at,
    expiresAt: row.expires_at,
    destroyedAt: row.destroyed_at,
    createdAt: row.created_at,
  };
}

export async function redeemCode(
  codeHash: string,
  userId: string,
): Promise<RedeemResult> {
  const { data, error } = await getServiceClient().rpc('redeem_code', {
    p_code_hash: codeHash,
    p_user_id: userId,
  });
  if (error) throw error;

  const row = Array.isArray(data) ? data[0] : data;
  if (!row) {
    return { success: false, message: 'Invalid code.', entitlement: null };
  }

  return {
    success: row.success,
    message: row.message,
    entitlement: row.entitlement_id
      ? {
          id: row.entitlement_id,
          expiresAt: row.expires_at,
          playgroundLimit: Number(row.playground_limit ?? 0),
        }
      : null,
  };
}

export interface CreateCodeRpcInput {
  codeHash: string;
  codePreview: string;
  duration: CodeDuration;
  durationDays?: number | null;
  playgroundLimit: number;
  limitOnliner?: number;
  limitVc?: number;
  limitTyper?: number;
  adminDiscordId: string;
  note?: string;
}

export interface CreateCodeRpcResult {
  codeId: string;
  createdAt: string;
}

export async function botCreateCode(input: CreateCodeRpcInput): Promise<CreateCodeRpcResult> {
  const { data, error } = await getServiceClient().rpc('bot_create_code', {
    p_code_hash: input.codeHash,
    p_code_preview: input.codePreview,
    p_duration: input.duration,
    p_playground_limit: input.playgroundLimit,
    p_admin_discord_id: input.adminDiscordId,
    p_note: input.note ?? null,
    p_duration_days: input.durationDays ?? null,
    p_limit_onliner: input.limitOnliner ?? 0,
    p_limit_vc: input.limitVc ?? 0,
    p_limit_typer: input.limitTyper ?? 0,
  } as never);
  if (error) throw error;

  const row = Array.isArray(data) ? data[0] : data;
  if (!row) throw new Error('bot_create_code returned no row.');
  return { codeId: row.code_id, createdAt: row.created_at };
}

export interface DestroyCodeRpcResult {
  found: boolean;
  affectedEntitlements: number;
  stoppedPlaygrounds: number;
}

export async function botDestroyCode(
  codeHash: string,
  adminDiscordId: string,
): Promise<DestroyCodeRpcResult> {
  const { data, error } = await getServiceClient().rpc('bot_destroy_code', {
    p_code_hash: codeHash,
    p_admin_discord_id: adminDiscordId,
  });
  if (error) throw error;

  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return { found: false, affectedEntitlements: 0, stoppedPlaygrounds: 0 };

  return {
    found: row.found,
    affectedEntitlements: Number(row.affected_entitlements ?? 0),
    stoppedPlaygrounds: Number(row.stopped_playgrounds ?? 0),
  };
}

export async function listCodesForAdmin(limit = 50): Promise<RedeemCodeDTO[]> {
  const { data, error } = await getServiceClient()
    .from('redeem_codes')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []).map(toDTO);
    }
