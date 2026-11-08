'use client';

import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { PlaygroundDTO } from '@app/shared';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { TimeSelector } from '@/components/ui/TimeSelector';
import { api } from '@/lib/api-client';
import { useToast } from '@/hooks/useToast';

export interface EditPlaygroundDialogProps {
  playground: PlaygroundDTO;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditPlaygroundDialog({
  playground,
  open,
  onOpenChange,
}: EditPlaygroundDialogProps) {
  const qc = useQueryClient();
  const toast = useToast((s) => s.push);

  const [name, setName] = useState(playground.name);
  const [mode, setMode] = useState<'manual' | 'slowmode'>(playground.mode);
  const [seconds, setSeconds] = useState(playground.intervalSeconds);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setName(playground.name);
      setMode(playground.mode);
      setSeconds(playground.intervalSeconds);
      setError(null);
    }
  }, [open, playground]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await api.updatePlayground(playground.id, {
        name: name.trim(),
        mode,
        intervalSeconds: seconds,
      });
      await qc.invalidateQueries({ queryKey: ['playground', playground.id] });
      await qc.invalidateQueries({ queryKey: ['playgrounds'] });
      toast({ kind: 'success', title: 'Playground updated' });
      onOpenChange(false);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Edit playground"
      description="Update name, timing mode, and interval. Changes apply on the next scheduled run."
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button loading={saving} onClick={handleSave}>Save changes</Button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-step--2 text-text-tertiary">Name</label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={80}
          />
        </div>

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
            <label className="mb-1 block text-step--2 text-text-tertiary">
              Manual interval
            </label>
            <TimeSelector totalSeconds={seconds} onChange={setSeconds} />
          </div>
        )}

        {mode === 'slowmode' && (
          <p className="rounded-md border border-[color:var(--break)]/40 bg-[color:var(--break)]/10 p-3 text-step--2 break-color">
            ⚠️ Slow-mode reads the channel&apos;s native rate limit from Discord. If the
            channel has no slow-mode set, the fallback is 5s. Your manual interval above
            is ignored while this mode is active.
          </p>
        )}

        {error && <p className="text-step--2 text-danger">{error}</p>}
      </div>
    </Dialog>
  );
         }
