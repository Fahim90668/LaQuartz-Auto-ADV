'use client';

import { useState } from 'react';
import { MessageSquarePlus } from 'lucide-react';
import { type PlaygroundDTO } from '@app/shared';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { Dialog } from '@/components/ui/Dialog';
import { useAddMessage } from '@/hooks/usePlayground';
import { useToast } from '@/hooks/useToast';

export function MessagesSection({ playground }: { playground: PlaygroundDTO }) {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState('');
  const add = useAddMessage(playground.id);
  const toast = useToast((s) => s.push);

  const handleAdd = () => {
    if (!content.trim()) return;
    add.mutate(content.trim(), {
      onSuccess: () => {
        toast({ kind: 'success', title: 'Message added' });
        setContent('');
        setOpen(false);
      },
      onError: (err) => toast({ kind: 'error', title: 'Failed', description: err.message }),
    });
  };

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Messages ({playground.messages.length}/10)</CardTitle>
          <CardDescription>Rotation pool. Each send picks the next active message.</CardDescription>
        </div>
        <Button size="sm" variant="secondary" onClick={() => setOpen(true)} disabled={playground.messages.length >= 10}>
          <MessageSquarePlus className="h-3 w-3" /> Add
        </Button>
      </CardHeader>

      {playground.messages.length === 0 ? (
        <p className="rounded-md border border-dashed border-border-subtle p-6 text-center text-sm text-text-tertiary">
          No messages yet.
        </p>
      ) : (
        <ul className="space-y-2">
          {playground.messages.map((m) => (
            <li
              key={m.id}
              className="rounded-md border border-border-subtle bg-surface-2 p-3 text-sm text-text-secondary"
            >
              <p className="whitespace-pre-wrap">{m.content}</p>
              <p className="mt-2 text-[10px] uppercase tracking-wider text-text-tertiary">
                Used {m.timesUsed}×
              </p>
            </li>
          ))}
        </ul>
      )}

      <Dialog
        open={open}
        onOpenChange={setOpen}
        title="Add message"
        description="Max 4000 characters. Markdown supported."
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button loading={add.isPending} onClick={handleAdd}>Add</Button>
          </>
        }
      >
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={6}
          maxLength={4000}
          placeholder="🎮 Your message here…"
        />
      </Dialog>
    </Card>
  );
}