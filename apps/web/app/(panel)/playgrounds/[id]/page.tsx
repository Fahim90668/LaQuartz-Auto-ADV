'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, Pencil } from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { usePlayground } from '@/hooks/usePlayground';
import { useRealtimePlayground } from '@/hooks/useRealtimePlayground';
import { LiveStatusPanel } from '@/components/playgrounds/LiveStatusPanel';
import { PlaygroundControls } from '@/components/playgrounds/PlaygroundControls';
import { ChannelsSection } from '@/components/playgrounds/ChannelsSection';
import { MessagesSection } from '@/components/playgrounds/MessagesSection';
import { LogsSection } from '@/components/playgrounds/LogsSection';
import { EditPlaygroundDialog } from '@/components/playgrounds/EditPlaygroundDialog';

export default function PlaygroundDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data, isLoading, isError, error, refetch } = usePlayground(id);
  const [editOpen, setEditOpen] = useState(false);
  useRealtimePlayground(id);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <ErrorState
        message={(error as Error)?.message ?? 'Playground not found.'}
        onRetry={() => void refetch()}
      />
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link
            href="/playgrounds"
            className="inline-flex items-center gap-1 text-step--2 text-text-tertiary hover:text-text-secondary"
          >
            <ChevronLeft className="h-3 w-3" /> All playgrounds
          </Link>
          <h2 className="mt-2 font-display text-step-2 font-semibold text-[color:var(--header)]">
            {data.name}
          </h2>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-step--1 text-text-secondary">
            {data.account?.label} · {data.mode} · {data.intervalSeconds}s
            <Badge
              tone={
                data.status === 'running'
                  ? 'success'
                  : data.status === 'error'
                    ? 'danger'
                    : 'neutral'
              }
            >
              {data.status}
            </Badge>
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => setEditOpen(true)}>
            <Pencil className="h-3 w-3" /> Edit
          </Button>
          <PlaygroundControls playground={data} />
        </div>
      </div>

      <LiveStatusPanel playground={data} />

      <div className="grid gap-4 lg:grid-cols-2">
        <ChannelsSection playground={data} />
        <MessagesSection playground={data} />
      </div>

      <LogsSection playgroundId={data.id} />

      <EditPlaygroundDialog
        playground={data}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
    </div>
  );
    }
