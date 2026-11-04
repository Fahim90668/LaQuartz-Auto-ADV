'use client';

import type { DiscordAccountDTO } from '@app/shared';
import { RefreshCw, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatRelative } from '@/lib/formatters';
import { useValidateAccount, useRemoveAccount } from '@/hooks/useAccounts';
import { useToast } from '@/hooks/useToast';

const toneFor = (status: DiscordAccountDTO['status']) => {
  if (status === 'active') return 'success' as const;
  if (status === 'invalid') return 'danger' as const;
  if (status === 'checking') return 'warning' as const;
  return 'neutral' as const;
};

export function AccountCard({ account }: { account: DiscordAccountDTO }) {
  const validate = useValidateAccount();
  const remove = useRemoveAccount();
  const toast = useToast((s) => s.push);

  return (
    <div className="rounded-lg border border-border-subtle bg-surface p-5 transition-colors hover:border-border-strong">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          {account.avatarUrl ? (
            <img src={account.avatarUrl} alt="" className="h-10 w-10 rounded-full" />
          ) : (
            <div className="h-10 w-10 rounded-full bg-surface-2" />
          )}
          <div>
            <p className="text-sm font-semibold text-text-primary">{account.label}</p>
            <p className="text-xs text-text-tertiary">
              @{account.username ?? 'unknown'}
              {account.discordUserId && (
                <span className="ml-2 font-mono text-[10px]">
                  {account.discordUserId.slice(0, 6)}…{account.discordUserId.slice(-4)}
                </span>
              )}
            </p>
          </div>
        </div>
        <Badge tone={toneFor(account.status)}>{account.status}</Badge>
      </div>

      {account.lastError && (
        <p className="mt-3 rounded-md border border-danger/30 bg-danger/10 p-2 text-xs text-danger">
          {account.lastError}
        </p>
      )}

      <div className="mt-4 flex items-center justify-between text-xs text-text-tertiary">
        <span>Validated {formatRelative(account.lastValidatedAt)}</span>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="secondary"
            loading={validate.isPending}
            onClick={() =>
              validate.mutate(account.id, {
                onSuccess: () => toast({ kind: 'success', title: 'Token valid' }),
                onError: (err) =>
                  toast({ kind: 'error', title: 'Validation failed', description: err.message }),
              })
            }
          >
            <RefreshCw className="h-3 w-3" /> Validate
          </Button>
          <Button
            size="sm"
            variant="ghost"
            loading={remove.isPending}
            onClick={() => {
              if (!window.confirm('Remove this account? Playgrounds using it will be paused.')) return;
              remove.mutate(account.id, {
                onSuccess: () => toast({ kind: 'success', title: 'Account removed' }),
                onError: (err) =>
                  toast({ kind: 'error', title: 'Failed', description: err.message }),
              });
            }}
            className="text-danger hover:bg-danger/10"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
            }
