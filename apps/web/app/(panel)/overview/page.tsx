'use client';

import Link from 'next/link';
import { Users, Sparkles, Send, AlertTriangle, Plus } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { usePlaygrounds } from '@/hooks/usePlaygrounds';
import { useAccounts } from '@/hooks/useAccounts';
import { useEntitlement } from '@/hooks/useEntitlement';
import { PlaygroundCard } from '@/components/playgrounds/PlaygroundCard';

export default function OverviewPage() {
  const { data: access } = useEntitlement();
  const { data: accounts, isLoading: accountsLoading } = useAccounts();
  const { data: playgrounds, isLoading: playgroundsLoading } = usePlaygrounds();

  const totalSent = (playgrounds ?? []).reduce((sum, p) => sum + p.totalSent, 0);
  const totalFailed = (playgrounds ?? []).reduce((sum, p) => sum + p.totalFailed, 0);
  const running = (playgrounds ?? []).filter((p) => p.status === 'running').length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<Sparkles className="h-4 w-4" />}
          label="Playgrounds"
          value={access ? `${access.playgroundsUsed}/${access.effectivePlaygroundLimit}` : '—'}
        />
        <StatCard
          icon={<Users className="h-4 w-4" />}
          label="Accounts"
          value={accountsLoading ? '—' : String(accounts?.length ?? 0)}
        />
        <StatCard
          icon={<Send className="h-4 w-4" />}
          label="Total sent"
          value={playgroundsLoading ? '—' : String(totalSent)}
        />
        <StatCard
          icon={<AlertTriangle className="h-4 w-4" />}
          label="Failed"
          value={playgroundsLoading ? '—' : String(totalFailed)}
          tone={totalFailed > 0 ? 'danger' : undefined}
        />
      </div>

      <Card>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-h3 font-semibold text-text-primary">Playgrounds</h2>
            <p className="text-sm text-text-secondary">
              {running} running · {playgrounds?.length ?? 0} total
            </p>
          </div>
          <Link href="/playgrounds">
            <Button variant="secondary" size="sm">
              <Plus className="h-3 w-3" /> New
            </Button>
          </Link>
        </div>

        {playgroundsLoading ? (
          <div className="grid gap-3 md:grid-cols-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        ) : !playgrounds || playgrounds.length === 0 ? (
          <p className="rounded-md border border-dashed border-border-subtle p-8 text-center text-sm text-text-tertiary">
            No playgrounds yet. Create your first one from the Playgrounds tab.
          </p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {playgrounds.slice(0, 4).map((p) => (
              <PlaygroundCard key={p.id} playground={p} />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone?: 'danger';
}) {
  return (
    <Card>
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-text-tertiary">
        <span className={tone === 'danger' ? 'text-danger' : 'text-brand-pink'}>{icon}</span>
        <span>{label}</span>
      </div>
      <p
        className={`mt-2 text-2xl font-semibold ${tone === 'danger' ? 'text-danger' : 'text-text-primary'}`}
      >
        {value}
      </p>
    </Card>
  );
}