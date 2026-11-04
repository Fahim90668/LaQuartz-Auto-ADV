import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  timingSafeEqual,
} from 'node:crypto';
import { getKeyRing, type KeyRing } from './keys.js';

const ALGORITHM = 'aes-256-gcm';
const IV_BYTES = 12;
const TAG_BYTES = 16;

export interface EncryptedPayload {
  ciphertext: Buffer;
  iv: Buffer;
  tag: Buffer;
  keyVersion: number;
}

export interface EncryptedPayloadB64 {
  ciphertext: string;
  iv: string;
  tag: string;
  keyVersion: number;
}

export function encrypt(
  plaintext: string | Buffer,
  keyring: KeyRing = getKeyRing(),
  version?: number,
): EncryptedPayload {
  const keyVersion = version ?? keyring.currentVersion;
  const key = keyring.get(keyVersion);
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  const input = typeof plaintext === 'string' ? Buffer.from(plaintext, 'utf8') : plaintext;
  const ciphertext = Buffer.concat([cipher.update(input), cipher.final()]);
  const tag = cipher.getAuthTag();

  if (tag.length !== TAG_BYTES) {
    throw new Error(`Unexpected GCM tag length ${tag.length}, expected ${TAG_BYTES}.`);
  }

  return { ciphertext, iv, tag, keyVersion };
}

export function decrypt(
  payload: EncryptedPayload,
  keyring: KeyRing = getKeyRing(),
): Buffer {
  const { ciphertext, iv, tag, keyVersion } = payload;

  if (iv.length !== IV_BYTES) {
    throw new Error(`Invalid IV length ${iv.length}.`);
  }
  if (tag.length !== TAG_BYTES) {
    throw new Error(`Invalid tag length ${tag.length}.`);
  }

  const key = keyring.get(keyVersion);
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  try {
    return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  } catch {
    throw new Error('AUTH_TAG_MISMATCH');
  }
}

export function decryptToString(
  payload: EncryptedPayload,
  keyring: KeyRing = getKeyRing(),
): string {
  return decrypt(payload, keyring).toString('utf8');
}

export function encryptToken(
  plaintext: string,
  keyring: KeyRing = getKeyRing(),
  version?: number,
): EncryptedPayload {
  if (!plaintext) throw new Error('Cannot encrypt empty token.');
  return encrypt(plaintext, keyring, version);
}

export function decryptToken(
  payload: EncryptedPayload,
  keyring: KeyRing = getKeyRing(),
): string {
  return decryptToString(payload, keyring);
}

export function encryptToB64(
  plaintext: string | Buffer,
  keyring: KeyRing = getKeyRing(),
  version?: number,
): EncryptedPayloadB64 {
  const enc = encrypt(plaintext, keyring, version);
  return {
    ciphertext: enc.ciphertext.toString('base64'),
    iv: enc.iv.toString('base64'),
    tag: enc.tag.toString('base64'),
    keyVersion: enc.keyVersion,
  };
}

export function decryptFromB64(
  payload: EncryptedPayloadB64,
  keyring: KeyRing = getKeyRing(),
): Buffer {
  return decrypt(
    {
      ciphertext: Buffer.from(payload.ciphertext, 'base64'),
      iv: Buffer.from(payload.iv, 'base64'),
      tag: Buffer.from(payload.tag, 'base64'),
      keyVersion: payload.keyVersion,
    },
    keyring,
  );
}

export function safeEqual(a: Buffer, b: Buffer): boolean {
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function zeroBuffer(buf: Buffer | null | undefined): void {
  if (buf && buf.length > 0) buf.fill(0);
}

export function needsRotation(
  payload: EncryptedPayload | EncryptedPayloadB64,
  keyring: KeyRing = getKeyRing(),
): boolean {
  return payload.keyVersion !== keyring.currentVersion;
}