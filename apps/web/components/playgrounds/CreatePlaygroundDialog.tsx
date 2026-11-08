'use client';

import { useState } from 'react';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { TimeSelector } from '@/components/ui/TimeSelector';
import { ServerChannelPicker, type ServerChannelValue } from './ServerChannelPicker';
import { useAccounts } from '@/hooks/useAccounts';
import { useCreatePlayground } from '@/hooks/usePlaygrounds';
import { useToast } from '@/hooks/useToast';

export interface CreatePlaygroundDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreatePlaygroundDialog({ open, onOpenChange }: CreatePlaygroundDialogProps) {
  const { data: accounts } = useAccounts();
  const create = useCreatePlayground();
  const toast = useToast((s) => s.push);

  const [accountId, setAccountId] = useState('');
  const [name, setName] = useState('');
  const [mode, setMode] = useState<'manual' | 'slowmode'>('manual');
  const [seconds, setSeconds] = useState(300);
  const [channel, setChannel] = useState<ServerChannelValue | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setAccountId('');
    setName('');
    setMode('manual');
    setSeconds(300);
    setChannel(null);
    setMessage('');
    setError(null);
  };

  const handleSubmit = () => {
    setError(null);
    if (!accountId) return setError('Pick an account.');
    if (!name.trim()) return setError('Name is required.');
    if (!channel) return setError('Pick a server and channel.');
    if (!message.trim()) return setError('Message is required.');

    create.mutate(
      {
        accountId,
        name: name.trim(),
        mode,
        intervalSeconds: seconds,
        channels: [
          {
            serverId: channel.serverId,
            channelId: channel.channelId,
            serverName: channel.serverName,
            channelName: channel.channelName,
          },
        ],
        messages: [{ content: message.trim() }],
      },
      {
        onSuccess: () => {
          toast({ kind: 'success', title: 'Playground created' });
          reset();
          onOpenChange(false);
        },
        onError: (err) => setError(err.message),
      },
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Create playground"
      description="Pick an account, one server and channel, a message, and a timing mode. You can add more channels later."
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button loading={create.isPending} onClick={handleSubmit}>Create</Button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-step--2 text-text-tertiary">Account</label>
          <Select
            value={accountId}
            onValueChange={(v) => {
              setAccountId(v);
              setChannel(null);
            }}
            placeholder="Select a Discord account"
            options={(accounts ?? []).map((a) => ({
              value: a.id,
              label: a.label,
              disabled: a.status !== 'active',
            }))}
          />
        </div>

        <div>
          <label className="mb-1 block text-step--2 text-text-tertiary">Name</label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Gaming community promo"
            maxLength={80}
          />
        </div>

        <ServerChannelPicker
          accountId={accountId || undefined}
          value={channel}
          onChange={setChannel}
        />

        <div>
          <label className="mb-1 block text-step--2 text-text-tertiary">Timing mode</label>
          <Select
            value={mode}
            onValueChange={(v) => setMode(v as 'manual' | 'slowmode')}
            options={[
              { value: 'manual', label: 'Manual interval' },
              { value: 'slowmode', label: 'Auto slow-mode' },
            ]}
          />
        </div>

        {mode === 'manual' && (
          <div>
            <label className="mb-1 block text-step--2 text-text-tertiary">Interval</label>
            <TimeSelector totalSeconds={seconds} onChange={setSeconds} />
          </div>
        )}

        <div>
          <label className="mb-1 block text-step--2 text-text-tertiary">Message</label>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="🎮 Join our gaming community — discord.gg/xyz"
            maxLength={4000}
            rows={4}
          />
        </div>

        {error && <p className="text-step--2 text-danger">{error}</p>}
      </div>
    </Dialog>
  );
    }
