'use client';

import Link from 'next/link';
import { type PlaygroundOverviewDTO } from '@app/shared';
import { Badge } from '@/components/ui/Badge';
import { formatRelative, truncate } from '@/lib/formatters';
import { Hash, Clock, Radio } from 'lucide-react';

const statusTone = (status: string) => {
  if (status === 'running') return 'success' as const;
  if (status === 'error') return 'danger' as const;
  if (status === 'paused') return 'warning' as const;
  return 'neutral' as const;
};

export function PlaygroundCard({ playground }: { playground: PlaygroundOverviewDTO }) {
  return (
    <Link
      href={`/playgrounds/${playground.id}`}
      className="group block rounded-lg border border-border-subtle bg-surface p-5 transition-all hover:border-brand-primary/40 hover:shadow-glow"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <h3 className="text-step-2 font-semibold text-text-primary group-hover:text-brand-pink">
            {playground.name}
          </h3>
          <p className="mt-1 text-xs text-text-tertiary">
            {playground.accountLabel} · {playground.mode}
          </p>
        </div>
        <Badge tone={statusTone(playground.status)}>
          {playground.status === 'running' && (
            <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse-dot" />
          )}
          {playground.status}
        </Badge>
      </div>

      {playground.messagePreview && (
        <p className="mt-3 line-clamp-2 rounded-md border border-border-subtle bg-surface-2 p-2 text-xs text-text-secondary">
          {truncate(playground.messagePreview, 120)}
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-text-tertiary">
        <span className="flex items-center gap-1">
          <Hash className="h-3 w-3" /> {playground.channelCount} channels
        </span>
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {playground.mode === 'slowmode' ? 'slow-mode' : `${playground.intervalSeconds}s`}
        </span>
        <span className="flex items-center gap-1">
          <Radio className="h-3 w-3" />
          {playground.lastSentAt ? `Last ${formatRelative(playground.lastSentAt)}` : 'Never sent'}
        </span>
      </div>

      {playground.lastError && (
        <p className="mt-3 rounded-md border border-danger/30 bg-danger/10 px-2 py-1 text-[11px] text-danger">
          {truncate(playground.lastError, 80)}
        </p>
      )}
    </Link>
  );
}