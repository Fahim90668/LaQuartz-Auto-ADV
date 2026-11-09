'use client';

import { X, CircleDot, Radio } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/components/ui/cn';
import type { ContinuousService, ContinuousType } from '@/hooks/useContinuous';

export const SERVICE_LABELS: Record<ContinuousType, string> = {
  onliner: '24/7 Onliner',
  vc: '24/7 VC',
  typer: '24/7 Typer',
};

const STATUS_TONE: Record<
  ContinuousService['status'],
  'success' | 'warning' | 'danger' | 'neutral'
> = {
  pending: 'warning',
  active: 'success',
  paused: 'neutral',
  expired: 'neutral',
  error: 'danger',
};

function formatCountdown(targetIso: string, now: number): string {
  const diff = new Date(targetIso).getTime() - now;
  if (diff <= 0) return 'expired';
  const h = Math.floor(diff / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  const s = Math.floor((diff % 60_000) / 1000);
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export interface ServiceCardProps {
  service: ContinuousService;
  accountLabel: string;
  now: number;
  onStop: () => void;
  stopping: boolean;
}

export function ServiceCard({
  service,
  accountLabel,
  now,
  onStop,
  stopping,
}: ServiceCardProps) {
  const isLive = service.status === 'active' || service.status === 'pending';
  const countdown = formatCountdown(service.expiresAt, now);

  const activity = service.config.activity as
    | { type?: number; name?: string; state?: string; details?: string }
    | undefined;
  const activityTypeLabels = [
    'Playing',
    '',
    'Listening to',
    'Watching',
    '',
    'Competing in',
  ];
  const activityTypeLabel = activityTypeLabels[Number(activity?.type ?? -1)];
  const activitySummary = activity?.name
    ? `${activityTypeLabel || 'Activity'}: ${activity.name}`
    : null;

  const presenceSummary =
    service.serviceType === 'onliner'
      ? service.config.autoCycle === true
        ? `auto-cycle every ${String(service.config.autoIntervalSeconds ?? 300)}s`
        : `presence: ${String(service.config.presence ?? 'online')}`
      : null;

  const channelSummary =
    service.serviceType !== 'onliner'
      ? `channel: ${String(service.config.channelId ?? '—')}`
      : null;

  return (
    <div className="rounded-lg border border-border-subtle bg-surface p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <CircleDot
            className={cn(
              'h-3 w-3 shrink-0',
              service.status === 'active' && 'text-[color:var(--neon)]',
              service.status === 'pending' && 'text-[color:var(--break)]',
              service.status === 'error' && 'text-danger',
              service.status === 'expired' && 'text-text-tertiary',
            )}
            aria-hidden
          />
          <h3 className="truncate text-step--1 font-semibold text-text-primary">
            {SERVICE_LABELS[service.serviceType]}
          </h3>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Badge tone={STATUS_TONE[service.status]}>{service.status}</Badge>
          {isLive && (
            <button
              type="button"
              onClick={onStop}
              disabled={stopping}
              className="rounded p-1 text-text-tertiary transition-colors hover:bg-danger/10 hover:text-danger disabled:opacity-50"
              aria-label="Stop service"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      <dl className="mt-3 space-y-1 text-step--2">
        <div className="flex justify-between gap-2">
          <dt className="text-text-tertiary">Account</dt>
          <dd className="truncate text-text-secondary">{accountLabel}</dd>
        </div>
        {presenceSummary && (
          <div className="flex justify-between gap-2">
            <dt className="text-text-tertiary">Presence</dt>
            <dd className="truncate font-mono text-text-secondary">
              {presenceSummary}
            </dd>
          </div>
        )}
        {activitySummary && (
          <div className="flex justify-between gap-2">
            <dt className="text-text-tertiary">Activity</dt>
            <dd className="truncate text-text-secondary">{activitySummary}</dd>
          </div>
        )}
        {channelSummary && (
          <div className="flex justify-between gap-2">
            <dt className="text-text-tertiary">Channel</dt>
            <dd className="truncate font-mono text-text-secondary">
              {channelSummary}
            </dd>
          </div>
        )}
        <div className="flex justify-between gap-2">
          <dt className="text-text-tertiary">
            {service.status === 'expired' ? 'Expired' : 'Time left'}
          </dt>
          <dd className="flex items-center gap-1 text-text-secondary">
            <Radio className="h-3 w-3 text-[color:var(--neon)]" aria-hidden />
            <span className="font-mono">{countdown}</span>
          </dd>
        </div>
      </dl>

      {service.lastError && (
        <p className="mt-3 rounded-md border border-danger/30 bg-danger/10 p-2 text-step--2 text-danger">
          {service.lastError}
        </p>
      )}
    </div>
  );
  }
