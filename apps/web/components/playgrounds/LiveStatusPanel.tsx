'use client';

import { type PlaygroundDTO } from '@app/shared';
import { Card } from '@/components/ui/Card';
import { formatRelative } from '@/lib/formatters';
import { cn } from '@/components/ui/cn';

export function LiveStatusPanel({ playground }: { playground: PlaygroundDTO }) {
  return (
    <Card>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label="Status" value={playground.status} pulse={playground.status === 'running'} />
        <Stat label="Total sent" value={String(playground.totalSent)} />
        <Stat label="Total failed" value={String(playground.totalFailed)} tone={playground.totalFailed > 0 ? 'danger' : undefined} />
        <Stat label="Last sent" value={formatRelative(playground.lastSentAt)} />
      </div>
      {playground.nextRunAt && (
        <p className="mt-4 border-t border-border-subtle pt-3 text-xs text-text-tertiary">
          Next run: {formatRelative(playground.nextRunAt)}
        </p>
      )}
      {playground.lastError && (
        <p className="mt-3 rounded-md border border-danger/30 bg-danger/10 p-2 text-xs text-danger">
          {playground.lastError}
        </p>
      )}
    </Card>
  );
}

function Stat({
  label,
  value,
  pulse,
  tone,
}: {
  label: string;
  value: string;
  pulse?: boolean;
  tone?: 'danger';
}) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-text-tertiary">{label}</p>
      <p
        className={cn(
          'mt-1 flex items-center gap-1.5 text-lg font-semibold capitalize',
          tone === 'danger' ? 'text-danger' : 'text-text-primary',
        )}
      >
        {pulse && <span className="h-2 w-2 rounded-full bg-success animate-pulse-dot" />}
        {value}
      </p>
    </div>
  );
}