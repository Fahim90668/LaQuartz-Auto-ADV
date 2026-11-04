'use client';

import { useState } from 'react';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAddAccount } from '@/hooks/useAccounts';
import { useToast } from '@/hooks/useToast';

export interface AddAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddAccountDialog({ open, onOpenChange }: AddAccountDialogProps) {
  const [label, setLabel] = useState('');
  const [token, setToken] = useState('');
  const [error, setError] = useState<string | null>(null);
  const add = useAddAccount();
  const toast = useToast((s) => s.push);

  const handleSubmit = () => {
    setError(null);
    if (!label.trim()) return setError('Label is required.');
    if (token.trim().length < 50) return setError('Token looks too short.');

    add.mutate(
      { label: label.trim(), token: token.trim() },
      {
        onSuccess: () => {
          toast({ kind: 'success', title: 'Account added' });
          setLabel('');
          setToken('');
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
      title="Add Discord Account"
      description="The token is validated with Discord, then encrypted (AES-256-GCM) before being stored."
      footer={
        <>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button loading={add.isPending} onClick={handleSubmit}>Add account</Button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-text-secondary">Label</label>
          <Input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g. Main ad account"
            maxLength={64}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-text-secondary">Discord Token</label>
          <Input
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Paste your Discord user token"
            className="font-mono"
            autoComplete="off"
          />
          <p className="mt-1 text-[11px] text-text-tertiary">
            Never share your token with anyone except this panel. It is encrypted at rest and never
            sent back to the browser.
          </p>
        </div>
        {error && <p className="text-xs text-danger">{error}</p>}
      </div>
    </Dialog>
  );
}