import { createHmac, timingSafeEqual } from 'node:crypto';
import { getCodeHashSecret, getTokenFpSecret } from './keys.js';

export function hmacSha256Hex(secret: Buffer | string, input: string | Buffer): string {
  return createHmac('sha256', secret).update(input).digest('hex');
}

export function hashRedeemCode(code: string, secret: Buffer = getCodeHashSecret()): string {
  const normalized = code.trim().toUpperCase();
  if (!normalized) throw new Error('Cannot hash empty code.');
  return hmacSha256Hex(secret, normalized);
}

export function fingerprintToken(token: string, secret: Buffer = getTokenFpSecret()): string {
  const normalized = token.trim();
  if (!normalized) throw new Error('Cannot fingerprint empty token.');
  return hmacSha256Hex(secret, normalized);
}

export function verifyRedeemCodeHash(
  code: string,
  expectedHash: string,
  secret: Buffer = getCodeHashSecret(),
): boolean {
  const actual = hashRedeemCode(code, secret);
  if (actual.length !== expectedHash.length) return false;
  try {
    return timingSafeEqual(Buffer.from(actual, 'hex'), Buffer.from(expectedHash, 'hex'));
  } catch {
    return false;
  }
}

export function constantTimeEquals(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a, 'utf8'), Buffer.from(b, 'utf8'));
}