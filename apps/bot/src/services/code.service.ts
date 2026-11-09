import type { CodeDuration, RedeemCodeDTO } from '@app/shared';
import { errors } from '@app/shared';
import { codes as codesDb } from '@app/db';
import {
  generateRedeemCode,
  hashRedeemCode,
  normalizeRedeemCode,
} from '@app/crypto';

export interface CreateCodeParams {
  duration: CodeDuration;
  durationDays?: number;
  playgroundLimit: number;
  limitOnliner?: number;
  limitVc?: number;
  limitTyper?: number;
  adminDiscordId: string;
  note?: string;
}

export interface CreateCodeResult {
  code: string;
  preview: string;
  duration: CodeDuration;
  durationDays: number | null;
  playgroundLimit: number;
  limitOnliner: number;
  limitVc: number;
  limitTyper: number;
  codeId: string;
  createdAt: string;
}

export async function createCode(params: CreateCodeParams): Promise<CreateCodeResult> {
  if (params.playgroundLimit < 1 || params.playgroundLimit > 50) {
    throw errors.validation('Playground limit must be between 1 and 50.');
  }

  if (params.duration === 'custom') {
    if (
      params.durationDays === undefined ||
      params.durationDays < 7 ||
      params.durationDays > 365
    ) {
      throw errors.validation('Custom duration must be 7–365 days.');
    }
  }

  const limitOnliner = params.limitOnliner ?? 0;
  const limitVc = params.limitVc ?? 0;
  const limitTyper = params.limitTyper ?? 0;

  if (limitOnliner > 1 || limitVc > 1 || limitTyper > 1) {
    throw errors.validation('Each feature can have at most 1 slot.');
  }

  const { code, preview } = generateRedeemCode();
  const codeHash = hashRedeemCode(code);

  const result = await codesDb.botCreateCode({
    codeHash,
    codePreview: preview,
    duration: params.duration,
    durationDays: params.durationDays ?? null,
    playgroundLimit: params.playgroundLimit,
    limitOnliner,
    limitVc,
    limitTyper,
    adminDiscordId: params.adminDiscordId,
    note: params.note,
  });

  const resolvedDays: number | null =
    params.duration === 'lifetime'
      ? null
      : params.duration === 'custom'
        ? params.durationDays ?? null
        : params.duration === '1m'
          ? 30
          : 90;

  return {
    code,
    preview,
    duration: params.duration,
    durationDays: resolvedDays,
    playgroundLimit: params.playgroundLimit,
    limitOnliner,
    limitVc,
    limitTyper,
    codeId: result.codeId,
    createdAt: result.createdAt,
  };
}

export interface DestroyCodeResult {
  found: boolean;
  affectedEntitlements: number;
  stoppedPlaygrounds: number;
}

export async function destroyCode(
  code: string,
  adminDiscordId: string,
): Promise<DestroyCodeResult> {
  const normalized = normalizeRedeemCode(code);
  if (!normalized) throw errors.validation('Code cannot be empty.');
  const codeHash = hashRedeemCode(normalized);
  return codesDb.botDestroyCode(codeHash, adminDiscordId);
}

export async function listRecentCodes(limit = 10): Promise<RedeemCodeDTO[]> {
  return codesDb.listCodesForAdmin(limit);
    }
