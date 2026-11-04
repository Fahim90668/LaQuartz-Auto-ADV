'use client';

import { useState } from 'react';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
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
  const [intervalSeconds, setIntervalSeconds] = useState(300);
  const [serverId, setServerId] = useState('');
  const [channelId, setChannelId] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setAccountId('');
    setName('');
    setMode('manual');
    setIntervalSeconds(300);
    setServerId('');
    setChannelId('');
    setMessage('');
    setError(null);
  };

  const handleSubmit = () => {
    setError(null);
    if (!accountId) return setError('Pick an account.');
    if (!name.trim()) return setError('Name is required.');
    if (!serverId.match(/^\d{17,20}$/)) return setError('Server ID must be a valid snowflake.');
    if (!channelId.match(/^\d{17,20}$/)) return setError('Channel ID must be a valid snowflake.');
    if (!message.trim()) return setError('Message is required.');

    create.mutate(
      {
        accountId,
        name: name.trim(),
        mode,
        intervalSeconds,
        channels: [{ serverId, channelId }],
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
      title="Create Playground"
      description="Set up a new ad campaign. You can add up to 5 channels later."
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
          <label className="mb-1 block text-xs font-medium text-text-secondary">Account</label>
          <Select
            value={accountId}
            onValueChange={setAccountId}
            placeholder="Select a Discord account"
            options={(accounts ?? []).map((a) => ({
              value: a.id,
              label: a.label,
              disabled: a.status !== 'active',
            }))}
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-text-secondary">Name</label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Gaming community promo"
            maxLength={80}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-text-secondary">Timing mode</label>
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
              <label className="mb-1 block text-xs font-medium text-text-secondary">
                Interval (seconds)
              </label>
              <Input
                type="number"
                min={30}
                max={604800}
                value={intervalSeconds}
                onChange={(e) => setIntervalSeconds(Number(e.target.value))}
              />
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-text-secondary">Server ID</label>
            <Input
              value={serverId}
              onChange={(e) => setServerId(e.target.value)}
              placeholder="Right-click server → Copy ID"
              className="font-mono"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-text-secondary">Channel ID</label>
            <Input
              value={channelId}
              onChange={(e) => setChannelId(e.target.value)}
              placeholder="Right-click channel → Copy ID"
              className="font-mono"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-text-secondary">Message</label>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="🎮 Join our gaming community — discord.gg/xyz"
            maxLength={4000}
            rows={4}
          />
        </div>

        {error && <p className="text-xs text-danger">{error}</p>}
      </div>
    </Dialog>
  );
}