'use client';

import type { DiscordAccountDTO } from '@app/shared';
import { RefreshCw, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatRelative } from '@/lib/formatters';
import { useValidateAccount, useRemoveAccount } from '@/hooks/useAccounts';
import { useToast } from '@/hooks/useToast';
import { cn } from '@/components/ui/cn';

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
    <div className={cn(
      'card-interactive rounded-lg border border-border-subtle bg-surface p-5',
    )}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          {account.avatarUrl ? (
            <img
              src={account.avatarUrl}
              alt=""
              className="h-10 w-10 rounded-full ring-2 ring-[color:var(--primary)]/30"
            />
          ) : (
            <div
              className="flex h-10 w-10 items-center justify-center rounded-full text-step--1 font-semibold"
              style={{
                backgroundColor: 'color-mix(in srgb, var(--primary) 20%, transparent)',
                color: 'var(--primary)',
                boxShadow: 'inset 0 0 0 2px color-mix(in srgb, var(--primary) 30%, transparent)',
              }}
              aria-hidden
            >
              {account.label.slice(0, 2).toUpperCase()}
            </div>
          )}
          <div>
            <p className="text-step--1 font-semibold text-text-primary">{account.label}</p>
            <p className="text-step--2 text-text-tertiary">
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
        <p className="mt-3 rounded-md border border-danger/30 bg-danger/10 p-2 text-step--2 text-danger">
          {account.lastError}
        </p>
      )}

      <div className="mt-4 flex items-center justify-between text-step--2 text-text-tertiary">
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
                onError: (err) => toast({ kind: 'error', title: 'Failed', description: err.message }),
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
