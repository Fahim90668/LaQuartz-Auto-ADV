'use client';

import { Play, Square } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useStartPlayground, useStopPlayground } from '@/hooks/usePlayground';
import { useToast } from '@/hooks/useToast';
import { type PlaygroundDTO } from '@app/shared';

export function PlaygroundControls({ playground }: { playground: PlaygroundDTO }) {
  const start = useStartPlayground();
  const stop = useStopPlayground();
  const toast = useToast((s) => s.push);

  const isRunning = playground.status === 'running';

  return (
    <div className="flex gap-2">
      {!isRunning ? (
        <Button
          loading={start.isPending}
          onClick={() =>
            start.mutate(playground.id, {
              onSuccess: () => toast({ kind: 'success', title: 'Playground started' }),
              onError: (err) =>
                toast({ kind: 'error', title: 'Cannot start', description: err.message }),
            })
          }
        >
          <Play className="h-4 w-4" /> Start
        </Button>
      ) : (
        <Button
          variant="danger"
          loading={stop.isPending}
          onClick={() =>
            stop.mutate(playground.id, {
              onSuccess: () => toast({ kind: 'info', title: 'Playground stopped' }),
              onError: (err) =>
                toast({ kind: 'error', title: 'Failed to stop', description: err.message }),
            })
          }
        >
          <Square className="h-4 w-4" /> Stop
        </Button>
      )}
    </div>
  );
}