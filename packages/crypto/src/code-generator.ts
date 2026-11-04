import { randomBytes } from 'node:crypto';
import { REDEEM_CODE_PATTERN } from '@app/shared';

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const ALPHABET_LEN = ALPHABET.length;
const GROUP_LEN = 4;
const GROUP_COUNT = 3;
const PREFIX = 'ADVT';

function randomChar(): string {
  const byte = randomBytes(1)[0]!;
  const idx = byte % ALPHABET_LEN;
  return ALPHABET[idx]!;
}

function randomGroup(len: number): string {
  let s = '';
  for (let i = 0; i < len; i++) s += randomChar();
  return s;
}

export interface GeneratedCode {
  code: string;
  preview: string;
}

export function generateRedeemCode(): GeneratedCode {
  const groups = Array.from({ length: GROUP_COUNT }, () => randomGroup(GROUP_LEN));
  const code = `${PREFIX}-${groups.join('-')}`;

  if (!REDEEM_CODE_PATTERN.test(code)) {
    throw new Error(`Generated code does not match expected format: ${code}`);
  }

  const preview = `${PREFIX}-****-${groups[groups.length - 1]}`;
  return { code, preview };
}

export function isValidRedeemCodeFormat(code: string): boolean {
  return REDEEM_CODE_PATTERN.test(code.trim().toUpperCase());
}

export function normalizeRedeemCode(code: string): string {
  return code.trim().toUpperCase();
}

export function formatForDisplay(code: string): string {
  return normalizeRedeemCode(code);
}

export function codeEntropyBits(): number {
  return Math.floor(GROUP_LEN * GROUP_COUNT * Math.log2(ALPHABET_LEN));
}