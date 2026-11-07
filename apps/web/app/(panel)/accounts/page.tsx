'use client';

import { useState } from 'react';
import { Plus, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { useAccounts } from '@/hooks/useAccounts';
import { AccountCard } from '@/components/accounts/AccountCard';
import { AddAccountDialog } from '@/components/accounts/AddAccountDialog';

export default function AccountsPage() {
  const [open, setOpen] = useState(false);
  const { data, isLoading, isError, error, refetch } = useAccounts();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-step-3 font-semibold text-text-primary">Discord Accounts</h2>
          <p className="mt-1 text-sm text-text-secondary">
            Tokens are validated and encrypted at rest. They are never exposed to the browser.
          </p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" /> Add account
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-3 md:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      ) : isError ? (
        <ErrorState message={(error as Error).message} onRetry={() => void refetch()} />
      ) : !data || data.length === 0 ? (
        <EmptyState
          icon={<UserPlus className="h-6 w-6" />}
          title="No Discord accounts yet"
          description="Add a Discord account token to start creating playgrounds."
          action={
            <Button onClick={() => setOpen(true)}>
              <Plus className="h-4 w-4" /> Add account
            </Button>
          }
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {data.map((account) => (
            <AccountCard key={account.id} account={account} />
          ))}
        </div>
      )}

      <AddAccountDialog open={open} onOpenChange={setOpen} />
    </div>
  );
}