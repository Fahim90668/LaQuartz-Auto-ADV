import {
  BACKOFF_BASE_SECONDS,
  BACKOFF_CAP_SECONDS,
  BACKOFF_JITTER_SECONDS,
} from '../constants.js';

export function formatDurationSeconds(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const days = Math.floor(s / 86_400);
  const hours = Math.floor((s % 86_400) / 3_600);
  const minutes = Math.floor((s % 3_600) / 60);
  const seconds = s % 60;

  const parts: string[] = [];
  if (days) parts.push(`${days}d`);
  if (hours) parts.push(`${hours}h`);
  if (minutes) parts.push(`${minutes}m`);
  if (seconds || parts.length === 0) parts.push(`${seconds}s`);
  return parts.join(' ');
}

export function formatRelativeTime(target: Date | string | number, now: Date = new Date()): string {
  const ts = target instanceof Date ? target.getTime() : new Date(target).getTime();
  const diffMs = ts - now.getTime();
  const absSec = Math.abs(diffMs) / 1000;
  const past = diffMs < 0;
  const label = formatDurationSeconds(absSec);
  return past ? `${label} ago` : `in ${label}`;
}

export function backoffSeconds(attempt: number, withJitter = true): number {
  const base = Math.min(
    BACKOFF_CAP_SECONDS,
    Math.pow(2, Math.max(0, attempt)) * BACKOFF_BASE_SECONDS,
  );
  if (!withJitter) return base;
  const jitter = Math.floor(Math.random() * (BACKOFF_JITTER_SECONDS + 1));
  return Math.min(BACKOFF_CAP_SECONDS, base + jitter);
}

export function nextRunAt(mode: 'manual' | 'slowmode', intervalOrSlowmode: number, now: Date = new Date()): Date {
  const seconds = mode === 'slowmode' ? Math.max(5, intervalOrSlowmode) : Math.max(1, intervalOrSlowmode);
  return new Date(now.getTime() + seconds * 1000);
}