'use client';

import { useMemo, useState } from 'react';
import {
  Plus,
  X,
  Clock,
  AlertCircle,
  RefreshCw,
  CircleDot,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { TimeSelector } from '@/components/ui/TimeSelector';
import { useAccounts } from '@/hooks/useAccounts';
import {
  useContinuousList,
  useCreateContinuous,
  useStopContinuous,
  type ContinuousService,
  type ContinuousType,
} from '@/hooks/useContinuous';
import { useToast } from '@/hooks/useToast';
import { formatRelative } from '@/lib/formatters';
import { cn } from '@/components/ui/cn';

const SERVICE_LABELS: Record<ContinuousType, string> = {
  onliner: '24/7 Onliner',
  vc: '24/7 VC',
  typer: '24/7 Typer',
};

const SERVICE_HINTS: Record<ContinuousType, string> = {
  onliner: 'Keeps the account online with a persistent presence.',
  vc: 'Keeps the account in a voice channel (coming soon).',
  typer: 'Sends periodic typing indicator to a channel.',
};

const STATUS_TONE: Record<ContinuousService['status'], 'success' | 'warning' | 'danger' | 'neutral' | 'brand'> = {
  pending: 'warning',
  active: 'success',
  paused: 'neutral',
  expired: 'neutral',
  error: 'danger',
};

export default function ContinuousPage() {
  const { data: accounts } = useAccounts();
  const { data: services, isLoading, refetch, isFetching } = useContinuousList();
  const stop = useStopContinuous();
  const create = useCreateContinuous();
  const toast = useToast((s) => s.push);

  const accountLabelById = useMemo(() => {
    const map = new Map<string, string>();
    (accounts ?? []).forEach((a) => map.set(a.id, a.label));
    return map;
  }, [accounts]);

  const [open, setOpen] = useState(false);
  const [accountId, setAccountId] = useState('');
  const [serviceType, setServiceType] = useState<ContinuousType>('onliner');
  const [seconds, setSeconds] = useState(3600);
  const [channelId, setChannelId] = useState('');
  const [presence, setPresence] = useState('online');
  const [error, setError] = useState<string | null>(null);

  const activeAccounts = (accounts ?? []).filter((a) => a.status === 'active');
  const hasActiveAccount = activeAccounts.length > 0;

  const reset = () => {
    setAccountId('');
    setServiceType('onliner');
    setSeconds(3600);
    setChannelId('');
    setPresence('online');
    setError(null);
  };

  const handleCreate = () => {
    setError(null);
    if (!accountId) return setError('Pick an account.');
    if (serviceType !== 'onliner') {
      if (!channelId || !/^\d{17,20}$/.test(channelId)) {
        return setError('Enter a valid channel ID (17–20 digits).');
      }
    }

    const config: Record<string, unknown> =
      serviceType === 'onliner' ? { presence } : { channelId };

    create.mutate(
      { accountId, serviceType, durationSeconds: seconds, config },
      {
        onSuccess: () => {
          toast({ kind: 'success', title: 'Service created' });
          reset();
          setOpen(false);
        },
        onError: (err) => setError((err as Error).message),
      },
    );
  };

  return (
    <div className="space-y-5">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-step-2 font-semibold text-[color:var(--header)]">
            24/7 Services
          </h2>
          <p className="mt-1 max-w-xl text-step--1 text-text-secondary">
            Keep linked accounts online, in voice, or continuously typing. Each
            service runs until its expiry time, then is automatically stopped by the
            worker.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => void refetch()}
            disabled={isFetching}
            aria-label="Refresh"
          >
            <RefreshCw className={cn('h-3 w-3', isFetching && 'animate-spin')} />
          </Button>
          <Button onClick={() => setOpen(true)} disabled={!hasActiveAccount}>
            <Plus className="h-4 w-4" /> New service
          </Button>
        </div>
      </header>

      {!hasActiveAccount && (
        <div className="flex items-start gap-2 rounded-md border border-[color:var(--break)]/30 bg-[color:var(--break)]/5 p-3 text-step--1 text-text-secondary">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--break)]" aria-hidden />
          <p>
            You need at least one <strong>active Discord account</strong> before creating
            a 24/7 service. Add one in <a href="/accounts" className="link-underline text-[color:var(--primary)]">Accounts</a>.
          </p>
        </div>
      )}

      {isLoading ? (
        <div
          className="grid gap-3"
          style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))' }}
        >
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      ) : !services || services.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border-subtle bg-surface/50 p-10 text-center">
          <Clock className="mx-auto h-8 w-8 text-text-tertiary" aria-hidden />
          <p className="mt-3 text-step--1 font-medium text-text-primary">
            No 24/7 services yet
          </p>
          <p className="mt-1 text-step--2 text-text-secondary">
            Create your first service to keep an account active continuously.
          </p>
          {hasActiveAccount && (
            <Button className="mt-4" onClick={() => setOpen(true)}>
              <Plus className="h-4 w-4" /> Create service
            </Button>
          )}
        </div>
      ) : (
        <div
          className="grid gap-3"
          style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))' }}
        >
          {services.map((s) => (
            <ServiceCard
              key={s.id}
              service={s}
              accountLabel={accountLabelById.get(s.accountId) ?? 'Unknown account'}
              onStop={() => {
                if (!window.confirm('Stop this service now?')) return;
                stop.mutate(s.id, {
                  onSuccess: () => toast({ kind: 'info', title: 'Service stopped' }),
                  onError: (err) =>
                    toast({ kind: 'error', title: 'Failed to stop', description: err.message }),
                });
              }}
              stopping={stop.isPending}
            />
          ))}
        </div>
      )}

      <Dialog
        open={open}
        onOpenChange={setOpen}
        title="New 24/7 service"
        description="Pick an account, a service type, and how long it should run."
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button loading={create.isPending} onClick={handleCreate} disabled={!hasActiveAccount}>
              Create service
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-step--2 text-text-tertiary">Account</label>
            <Select
              value={accountId}
              onValueChange={setAccountId}
              placeholder={hasActiveAccount ? 'Select account' : 'No active accounts'}
              options={activeAccounts.map((a) => ({ value: a.id, label: a.label }))}
              disabled={!hasActiveAccount}
            />
          </div>

          <div>
            <label className="mb-1 block text-step--2 text-text-tertiary">Service type</label>
            <Select
              value={serviceType}
              onValueChange={(v) => setServiceType(v as ContinuousType)}
              options={[
                { value: 'onliner', label: SERVICE_LABELS.onliner },
                { value: 'vc', label: `${SERVICE_LABELS.vc} (beta)` },
                { value: 'typer', label: SERVICE_LABELS.typer },
              ]}
            />
            <p className="mt-1 text-step--2 text-text-tertiary">{SERVICE_HINTS[serviceType]}</p>
          </div>

          {serviceType === 'onliner' && (
            <div>
              <label className="mb-1 block text-step--2 text-text-tertiary">Presence</label>
              <Select
                value={presence}
                onValueChange={setPresence}
                options={[
                  { value: 'online', label: 'Online' },
                  { value: 'idle', label: 'Idle' },
                  { value: 'dnd', label: 'Do Not Disturb' },
                  { value: 'invisible', label: 'Invisible' },
                ]}
              />
            </div>
          )}

          {(serviceType === 'vc' || serviceType === 'typer') && (
            <div>
              <label className="mb-1 block text-step--2 text-text-tertiary">Channel ID</label>
              <Input
                value={channelId}
                onChange={(e) => setChannelId(e.target.value)}
                placeholder="Copy Channel ID from Discord (Developer Mode)"
                className="font-mono"
                maxLength={20}
              />
              <p className="mt-1 text-step--2 text-text-tertiary">
                ⚠️ Enable Developer Mode in Discord, right-click the channel →{' '}
                <strong>Copy Channel ID</strong>.
              </p>
            </div>
          )}

          <div>
            <label className="mb-1 block text-step--2 text-text-tertiary">Duration</label>
            <TimeSelector
              totalSeconds={seconds}
              onChange={setSeconds}
              minSeconds={60}
              maxSeconds={2_592_000}
            />
            <p className="mt-1 text-step--2 text-text-tertiary">
              Minimum 1 minute · maximum 30 days. Service stops automatically at expiry.
            </p>
          </div>

          {error && (
            <p className="rounded-md border border-danger/40 bg-danger/10 p-2 text-step--2 text-danger">
              {error}
            </p>
          )}
        </div>
      </Dialog>
    </div>
  );
}

function ServiceCard({
  service,
  accountLabel,
  onStop,
  stopping,
}: {
  service: ContinuousService;
  accountLabel: string;
  onStop: () => void;
  stopping: boolean;
}) {
  const isLive = service.status === 'active' || service.status === 'pending';
  const configSummary =
    service.serviceType === 'onliner'
      ? `presence: ${String(service.config.presence ?? 'online')}`
      : `channel: ${String(service.config.channelId ?? '—')}`;

  return (
    <div className="rounded-lg border border-border-subtle bg-surface p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <CircleDot
            className={cn(
              'h-3 w-3',
              service.status === 'active' && 'text-[color:var(--neon)]',
              service.status === 'pending' && 'text-[color:var(--break)]',
              service.status === 'error' && 'text-danger',
              service.status === 'expired' && 'text-text-tertiary',
            )}
            aria-hidden
          />
          <h3 className="text-step--1 font-semibold text-text-primary">
            {SERVICE_LABELS[service.serviceType]}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone={STATUS_TONE[service.status]}>{service.status}</Badge>
          {isLive && (
            <button
              type="button"
              onClick={onStop}
              disabled={stopping}
              className="rounded p-1 text-text-tertiary transition-colors hover:bg-danger/10 hover:text-danger disabled:opacity-50"
              aria-label="Stop service"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      <dl className="mt-3 space-y-1 text-step--2">
        <div className="flex justify-between">
          <dt className="text-text-tertiary">Account</dt>
          <dd className="truncate text-text-secondary">{accountLabel}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-text-tertiary">Config</dt>
          <dd className="truncate text-text-secondary font-mono">{configSummary}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-text-tertiary">
            {service.status === 'expired' ? 'Expired' : 'Expires'}
          </dt>
          <dd className="text-text-secondary">{formatRelative(service.expiresAt)}</dd>
        </div>
      </dl>

      {service.lastError && (
        <p className="mt-3 rounded-md border border-danger/30 bg-danger/10 p-2 text-step--2 text-danger">
          {service.lastError}
        </p>
      )}
    </div>
  );
}
