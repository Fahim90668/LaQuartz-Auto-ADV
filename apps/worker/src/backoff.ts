import {
  BACKOFF_BASE_SECONDS,
  BACKOFF_CAP_SECONDS,
  BACKOFF_JITTER_SECONDS,
} from '@app/shared';

export function computeBackoffMs(attempt: number, withJitter = true): number {
  const base = Math.min(
    BACKOFF_CAP_SECONDS,
    Math.pow(2, Math.max(0, attempt)) * BACKOFF_BASE_SECONDS,
  );
  const seconds = withJitter
    ? base + Math.floor(Math.random() * (BACKOFF_JITTER_SECONDS + 1))
    : base;
  return Math.min(BACKOFF_CAP_SECONDS, seconds) * 1000;
}

export function computeRateLimitWaitMs(
  retryAfterMs: number | null,
  attempt: number,
): number {
  const base = retryAfterMs ?? computeBackoffMs(attempt, true);
  const jitter = Math.floor(Math.random() * 1000);
  return Math.min(base + jitter, 5 * 60 * 1000);
}

export function computeLeaseRecoveryDelayMs(attempt: number): number {
  return Math.min(300_000, computeBackoffMs(attempt, true));
}