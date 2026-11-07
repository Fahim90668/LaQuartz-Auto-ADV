'use client';

import { useState } from 'react';
import { Plus, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { usePlaygrounds } from '@/hooks/usePlaygrounds';
import { PlaygroundCard } from '@/components/playgrounds/PlaygroundCard';
import { CreatePlaygroundDialog } from '@/components/playgrounds/CreatePlaygroundDialog';

export default function PlaygroundsPage() {
  const [open, setOpen] = useState(false);
  const { data, isLoading, isError, error, refetch } = usePlaygrounds();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-step-3 font-semibold text-text-primary">Playgrounds</h2>
          <p className="mt-1 text-sm text-text-secondary">
            Ad campaigns that post on a schedule.
          </p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" /> New playground
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      ) : isError ? (
        <ErrorState message={(error as Error).message} onRetry={() => void refetch()} />
      ) : !data || data.length === 0 ? (
        <EmptyState
          icon={<Sparkles className="h-6 w-6" />}
          title="No playgrounds yet"
          description="Create your first playground to start advertising."
          action={
            <Button onClick={() => setOpen(true)}>
              <Plus className="h-4 w-4" /> Create playground
            </Button>
          }
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {data.map((p) => (
            <PlaygroundCard key={p.id} playground={p} />
          ))}
        </div>
      )}

      <CreatePlaygroundDialog open={open} onOpenChange={setOpen} />
    </div>
  );
}