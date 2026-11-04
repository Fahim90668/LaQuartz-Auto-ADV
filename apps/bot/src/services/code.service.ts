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
  playgroundLimit: number;
  adminDiscordId: string;
  note?: string;
}

export interface CreateCodeResult {
  code: string;
  preview: string;
  duration: CodeDuration;
  playgroundLimit: number;
  codeId: string;
  createdAt: string;
}

export async function createCode(params: CreateCodeParams): Promise<CreateCodeResult> {
  if (params.playgroundLimit < 1 || params.playgroundLimit > 50) {
    throw errors.validation('Playground limit must be between 1 and 50.');
  }

  const { code, preview } = generateRedeemCode();
  const codeHash = hashRedeemCode(code);

  const result = await codesDb.botCreateCode({
    codeHash,
    codePreview: preview,
    duration: params.duration,
    playgroundLimit: params.playgroundLimit,
    adminDiscordId: params.adminDiscordId,
    note: params.note,
  });

  return {
    code,
    preview,
    duration: params.duration,
    playgroundLimit: params.playgroundLimit,
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