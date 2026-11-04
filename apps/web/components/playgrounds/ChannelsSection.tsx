'use client';

import { useState } from 'react';
import { Hash, Plus, X } from 'lucide-react';
import { type PlaygroundDTO } from '@app/shared';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Dialog } from '@/components/ui/Dialog';
import { useAddChannel, useRemoveChannel } from '@/hooks/usePlayground';
import { useToast } from '@/hooks/useToast';

export function ChannelsSection({ playground }: { playground: PlaygroundDTO }) {
  const [open, setOpen] = useState(false);
  const [serverId, setServerId] = useState('');
  const [channelId, setChannelId] = useState('');
  const add = useAddChannel(playground.id);
  const remove = useRemoveChannel(playground.id);
  const toast = useToast((s) => s.push);

  const handleAdd = () => {
    if (!serverId.match(/^\d{17,20}$/) || !channelId.match(/^\d{17,20}$/)) {
      toast({ kind: 'error', title: 'Invalid IDs' });
      return;
    }
    add.mutate(
      { serverId, channelId },
      {
        onSuccess: () => {
          toast({ kind: 'success', title: 'Channel added' });
          setServerId('');
          setChannelId('');
          setOpen(false);
        },
        onError: (err) => toast({ kind: 'error', title: 'Failed', description: err.message }),
      },
    );
  };

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Channels ({playground.channels.length}/5)</CardTitle>
          <CardDescription>Where your messages will be posted.</CardDescription>
        </div>
        <Button size="sm" variant="secondary" onClick={() => setOpen(true)} disabled={playground.channels.length >= 5}>
          <Plus className="h-3 w-3" /> Add
        </Button>
      </CardHeader>

      {playground.channels.length === 0 ? (
        <p className="rounded-md border border-dashed border-border-subtle p-6 text-center text-sm text-text-tertiary">
          No channels yet.
        </p>
      ) : (
        <ul className="space-y-2">
          {playground.channels.map((c) => (
            <li
              key={c.id}
              className="flex items-center justify-between rounded-md border border-border-subtle bg-surface-2 px-3 py-2"
            >
              <div className="flex items-center gap-2 text-sm">
                <Hash className="h-3 w-3 text-text-tertiary" />
                <span className="text-text-primary">{c.channelName ?? c.channelId}</span>
                {c.slowmodeSeconds > 0 && (
                  <span className="rounded-full bg-warning/10 px-2 py-0.5 text-[10px] text-warning">
                    slow-mode {c.slowmodeSeconds}s
                  </span>
                )}
                {!c.isActive && (
                  <span className="rounded-full bg-danger/10 px-2 py-0.5 text-[10px] text-danger">
                    inactive
                  </span>
                )}
              </div>
              <button
                onClick={() => remove.mutate(c.channelId)}
                className="rounded p-1 text-text-tertiary hover:bg-danger/10 hover:text-danger"
                aria-label="Remove channel"
              >
                <X className="h-3 w-3" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <Dialog
        open={open}
        onOpenChange={setOpen}
        title="Add channel"
        description="Paste the server and channel snowflake IDs."
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button loading={add.isPending} onClick={handleAdd}>Add</Button>
          </>
        }
      >
        <div className="space-y-3">
          <Input
            value={serverId}
            onChange={(e) => setServerId(e.target.value)}
            placeholder="Server ID"
            className="font-mono"
          />
          <Input
            value={channelId}
            onChange={(e) => setChannelId(e.target.value)}
            placeholder="Channel ID"
            className="font-mono"
          />
        </div>
      </Dialog>
    </Card>
  );
}