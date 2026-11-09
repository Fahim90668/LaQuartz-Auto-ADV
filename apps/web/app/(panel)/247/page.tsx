'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Plus,
  Clock,
  AlertCircle,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { Switch } from '@/components/ui/Switch';
import { TimeSelector } from '@/components/ui/TimeSelector';
import { useAccounts } from '@/hooks/useAccounts';
import {
  useContinuousList,
  useCreateContinuous,
  useStopContinuous,
  type ContinuousType,
} from '@/hooks/useContinuous';
import { useToast } from '@/hooks/useToast';
import { cn } from '@/components/ui/cn';
import { ServiceCard, SERVICE_LABELS } from './ServiceCard';

const SERVICE_HINTS: Record<ContinuousType, string> = {
  onliner: 'Keeps the account online with a persistent presence.',
  vc: 'Keeps the account in a voice channel (coming soon).',
  typer: 'Sends periodic typing indicator to a channel.',
};

const ACTIVITY_TYPES = [
  { value: '0', label: 'Playing' },
  { value: '2', label: 'Listening to' },
  { value: '3', label: 'Watching' },
  { value: '5', label: 'Competing in' },
  { value: '1', label: 'Streaming' },
] as const;

const PRESENCE_OPTIONS = [
  { value: 'online', label: 'Online' },
  { value: 'idle', label: 'Idle' },
  { value: 'dnd', label: 'Do Not Disturb' },
  { value: 'invisible', label: 'Invisible' },
] as const;

export default function ContinuousPage() {
  const { data: accounts } = useAccounts();
  const { data: services, isLoading, refetch, isFetching } = useContinuousList();
  const stop = useStopContinuous();
  const create = useCreateContinuous();
  const toast = useToast((s) => s.push);

  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

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
  const [autoCycle, setAutoCycle] = useState(false);
  const [autoIntervalSeconds, setAutoIntervalSeconds] = useState(300);

  const [activityType, setActivityType] = useState('0');
  const [activityName, setActivityName] = useState('');
  const [activityState, setActivityState] = useState('');
  const [activityDetails, setActivityDetails] = useState('');
  const [activityUrl, setActivityUrl] = useState('');

  const [error, setError] = useState<string | null>(null);

  const activeAccounts = (accounts ?? []).filter((a) => a.status === 'active');
  const hasActiveAccount = activeAccounts.length > 0;

  const reset = () => {
    setAccountId('');
    setServiceType('onliner');
    setSeconds(3600);
    setChannelId('');
    setPresence('online');
    setAutoCycle(false);
    setAutoIntervalSeconds(300);
    setActivityType('0');
    setActivityName('');
    setActivityState('');
    setActivityDetails('');
    setActivityUrl('');
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
    if (serviceType === 'onliner' && activityName.trim()) {
      if (activityName.trim().length < 2) {
        return setError('Activity name must be at least 2 characters.');
      }
      if (activityType === '1' && !/^https?:\/\//i.test(activityUrl)) {
        return setError('Streaming type requires a valid URL (https://...).');
      }
    }

    const config: Record<string, unknown> = {};
    if (serviceType === 'onliner') {
      config.presence = presence;
      if (autoCycle) {
        config.autoCycle = true;
        config.autoIntervalSeconds = autoIntervalSeconds;
      }
      if (activityName.trim()) {
        config.activity = {
          type: Number(activityType),
          name: activityName.trim(),
          ...(activityState.trim() ? { state: activityState.trim() } : {}),
          ...(activityDetails.trim() ? { details: activityDetails.trim() } : {}),
          ...(activityType === '1' && activityUrl ? { url: activityUrl } : {}),
        };
      }
    } else {
      config.channelId = channelId;
    }

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
            service runs until its expiry time, then is automatically stopped by
            the worker.
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
          <AlertCircle
            className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--break)]"
            aria-hidden
          />
          <p>
            You need at least one <strong>active Discord account</strong> before
            creating a 24/7 service. Add one in{' '}
            <a href="/accounts" className="link-underline text-[color:var(--primary)]">
              Accounts
            </a>
            .
          </p>
        </div>
      )}

      {isLoading ? (
        <div
          className="grid gap-3"
          style={{
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))',
          }}
        >
          <Skeleton className="h-44 w-full" />
          <Skeleton className="h-44 w-full" />
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
          style={{
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))',
          }}
        >
          {services.map((s) => (
            <ServiceCard
              key={s.id}
              service={s}
              accountLabel={accountLabelById.get(s.accountId) ?? 'Unknown account'}
              now={now}
              onStop={() => {
                if (!window.confirm('Stop this service now?')) return;
                stop.mutate(s.id, {
                  onSuccess: () => toast({ kind: 'info', title: 'Service stopped' }),
                  onError: (err) =>
                    toast({
                      kind: 'error',
                      title: 'Failed to stop',
                      description: err.message,
                    }),
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
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              loading={create.isPending}
              onClick={handleCreate}
              disabled={!hasActiveAccount}
            >
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
            <label className="mb-1 block text-step--2 text-text-tertiary">
              Service type
            </label>
            <Select
              value={serviceType}
              onValueChange={(v) => setServiceType(v as ContinuousType)}
              options={[
                { value: 'onliner', label: SERVICE_LABELS.onliner },
                { value: 'vc', label: `${SERVICE_LABELS.vc} (beta)` },
                { value: 'typer', label: SERVICE_LABELS.typer },
              ]}
            />
            <p className="mt-1 text-step--2 text-text-tertiary">
              {SERVICE_HINTS[serviceType]}
            </p>
          </div>

          {serviceType === 'onliner' && (
            <>
              <div>
                <label className="mb-1 block text-step--2 text-text-tertiary">
                  Presence status
                </label>
                <Select
                  value={presence}
                  onValueChange={setPresence}
                  options={[...PRESENCE_OPTIONS]}
                  disabled={autoCycle}
                />
                {autoCycle && (
                  <p className="mt-1 text-step--2 text-text-tertiary">
                    Presence status is overridden while auto-cycle is on.
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between rounded-md border border-border-subtle bg-surface-2 p-3">
                <div>
                  <p className="text-step--1 font-medium text-text-primary">
                    Auto-cycle presence
                  </p>
                  <p className="text-step--2 text-text-tertiary">
                    Rotate online → idle → dnd every interval.
                  </p>
                </div>
                <Switch
                  checked={autoCycle}
                  onCheckedChange={setAutoCycle}
                  id="auto-cycle"
                />
              </div>

              {autoCycle && (
                <div>
                  <label className="mb-1 block text-step--2 text-text-tertiary">
                    Cycle interval (seconds)
                  </label>
                  <Input
                    type="number"
                    min={30}
                    max={3600}
                    value={autoIntervalSeconds}
                    onChange={(e) =>
                      setAutoIntervalSeconds(
                        Math.max(30, Math.min(3600, parseInt(e.target.value || '300', 10))),
                      )
                    }
                    className="font-mono"
                  />
                  <p className="mt-1 text-step--2 text-text-tertiary">
                    Minimum 30s · maximum 3600s (1 hour).
                  </p>
                </div>
              )}

              <details className="rounded-md border border-border-subtle bg-surface-2 p-3">
                <summary className="cursor-pointer text-step--1 font-medium text-text-primary">
                  <Sparkles className="mr-1 inline h-3.5 w-3.5 text-[color:var(--primary)]" />
                  Rich presence (optional)
                </summary>
                <div className="mt-3 space-y-3">
                  <div>
                    <label className="mb-1 block text-step--2 text-text-tertiary">
                      Activity type
                    </label>
                    <Select
                      value={activityType}
                      onValueChange={setActivityType}
                      options={[...ACTIVITY_TYPES]}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-step--2 text-text-tertiary">
                      Activity name
                    </label>
                    <Input
                      value={activityName}
                      onChange={(e) => setActivityName(e.target.value)}
                      placeholder="e.g. LaQuartz AUTO-ADV"
                      maxLength={128}
                    />
                    <p className="mt-1 text-step--2 text-text-tertiary">
                      Shown as &quot;Playing {activityName || 'X'}&quot; in the
                      member list.
                    </p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-step--2 text-text-tertiary">
                        State (line 2)
                      </label>
                      <Input
                        value={activityState}
                        onChange={(e) => setActivityState(e.target.value)}
                        placeholder="optional"
                        maxLength={128}
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-step--2 text-text-tertiary">
                        Details (line 3)
                      </label>
                      <Input
                        value={activityDetails}
                        onChange={(e) => setActivityDetails(e.target.value)}
                        placeholder="optional"
                        maxLength={128}
                      />
                    </div>
                  </div>
                  {activityType === '1' && (
                    <div>
                      <label className="mb-1 block text-step--2 text-text-tertiary">
                        Stream URL
                      </label>
                      <Input
                        value={activityUrl}
                        onChange={(e) => setActivityUrl(e.target.value)}
                        placeholder="https://twitch.tv/yourname"
                        className="font-mono"
                      />
                      <p className="mt-1 text-step--2 text-text-tertiary">
                        Required for Streaming type. Must be https.
                      </p>
                    </div>
                  )}
                  <p className="flex items-start gap-1.5 rounded-md border border-[color:var(--break)]/30 bg-[color:var(--break)]/5 p-2 text-step--2 text-text-secondary">
                    <span className="shrink-0 text-[color:var(--break)]">⚠️</span>
                    <span>
                      Rich presence is visible to everyone in the same servers as
                      the account.
                    </span>
                  </p>
                </div>
              </details>
            </>
          )}

          {(serviceType === 'vc' || serviceType === 'typer') && (
            <div>
              <label className="mb-1 block text-step--2 text-text-tertiary">
                Channel ID
              </label>
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
              Minimum 1 minute · maximum 30 days. Service stops automatically at
              expiry.
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
