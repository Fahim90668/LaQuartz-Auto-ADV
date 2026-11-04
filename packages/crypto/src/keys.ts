import { createHash } from 'node:crypto';

const KEY_BYTES = 32;

export interface KeyRing {
  readonly currentVersion: number;
  readonly availableVersions: number[];
  get(version: number): Buffer;
}

const KEY_ENV_PATTERN = /^TOKEN_ENC_KEY_V(\d+)$/;

function decodeBase64Key(envName: string, value: string): Buffer {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new Error(`${envName} is empty.`);
  }

  let buf: Buffer;
  try {
    buf = Buffer.from(trimmed, 'base64');
  } catch {
    throw new Error(`${envName} is not valid base64.`);
  }

  if (buf.length !== KEY_BYTES) {
    throw new Error(
      `${envName} must decode to ${KEY_BYTES} bytes, got ${buf.length}. ` +
        `Generate with: openssl rand -base64 32`,
    );
  }
  return buf;
}

export function loadKeyRing(env: NodeJS.ProcessEnv = process.env): KeyRing {
  const versions = new Map<number, Buffer>();

  for (const [key, value] of Object.entries(env)) {
    if (!value) continue;
    const match = KEY_ENV_PATTERN.exec(key);
    if (!match) continue;
    const version = Number(match[1]);
    if (!Number.isInteger(version) || version < 1) {
      throw new Error(`${key} must have a positive integer version.`);
    }
    versions.set(version, decodeBase64Key(key, value));
  }

  if (versions.size === 0) {
    throw new Error('No TOKEN_ENC_KEY_V* environment variables are set.');
  }

  const sorted = [...versions.keys()].sort((a, b) => a - b);
  const currentVersion = sorted[sorted.length - 1]!;

  return {
    currentVersion,
    availableVersions: sorted,
    get(version: number): Buffer {
      const key = versions.get(version);
      if (!key) {
        throw new Error(`No encryption key for version ${version}.`);
      }
      return key;
    },
  };
}

export function loadCodeHashSecret(env: NodeJS.ProcessEnv = process.env): Buffer {
  const raw = env.CODE_HASH_SECRET;
  if (!raw) throw new Error('CODE_HASH_SECRET is not set.');
  const trimmed = raw.trim();
  if (trimmed.length < 32) {
    throw new Error('CODE_HASH_SECRET must be at least 32 characters.');
  }
  return Buffer.from(trimmed, 'utf8');
}

export function loadTokenFpSecret(env: NodeJS.ProcessEnv = process.env): Buffer {
  const raw = env.TOKEN_FP_SECRET;
  if (!raw) throw new Error('TOKEN_FP_SECRET is not set.');
  const trimmed = raw.trim();
  if (trimmed.length < 32) {
    throw new Error('TOKEN_FP_SECRET must be at least 32 characters.');
  }
  return Buffer.from(trimmed, 'utf8');
}

let cachedKeyRing: KeyRing | null = null;
let cachedCodeHashSecret: Buffer | null = null;
let cachedTokenFpSecret: Buffer | null = null;

export function getKeyRing(): KeyRing {
  if (!cachedKeyRing) cachedKeyRing = loadKeyRing();
  return cachedKeyRing;
}

export function getCodeHashSecret(): Buffer {
  if (!cachedCodeHashSecret) cachedCodeHashSecret = loadCodeHashSecret();
  return cachedCodeHashSecret;
}

export function getTokenFpSecret(): Buffer {
  if (!cachedTokenFpSecret) cachedTokenFpSecret = loadTokenFpSecret();
  return cachedTokenFpSecret;
}

export function resetKeyCacheForTests(): void {
  cachedKeyRing = null;
  cachedCodeHashSecret = null;
  cachedTokenFpSecret = null;
}

export function deriveStableKey(input: string, label: string): Buffer {
  return createHash('sha256').update(label).update(':').update(input).digest();
}