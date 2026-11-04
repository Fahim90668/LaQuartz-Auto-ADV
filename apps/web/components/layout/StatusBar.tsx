'use client';

import { useEntitlement } from '@/hooks/useEntitlement';
import { formatRelative } from '@/lib/formatters';
import { cn } from '@/components/ui/cn';

export function StatusBar() {
  const { data, isLoading } = useEntitlement();

  return (
    <footer className="flex h-[var(--statusbar-height)] items-center gap-4 border-t border-border-subtle bg-surface px-6 text-xs text-text-tertiary">
      <div className="flex items-center gap-2">
        <span
          className={cn(
            'h-2 w-2 rounded-full',
            isLoading ? 'bg-text-disabled' : data?.hasAccess ? 'bg-success animate-pulse-dot' : 'bg-danger',
          )}
        />
        <span>{isLoading ? 'Checking…' : data?.hasAccess ? 'Access active' : 'No access'}</span>
      </div>
      {data?.hasAccess && (
        <>
          <span className="text-text-disabled">·</span>
          <span>
            {data.playgroundsUsed}/{data.effectivePlaygroundLimit} playgrounds
          </span>
          {!data.isLifetime && data.soonestExpiry && (
            <>
              <span className="text-text-disabled">·</span>
              <span>Expires {formatRelative(data.soonestExpiry)}</span>
            </>
          )}
          {data.isLifetime && (
            <>
              <span className="text-text-disabled">·</span>
              <span>Lifetime access</span>
            </>
          )}
        </>
      )}
      <div className="ml-auto text-text-disabled">v1.0.0</div>
    </footer>
  );
}