'use client';

import { useEffect, useState } from 'react';
import { RefreshCw, Hash, Server } from 'lucide-react';
import type { AccountServerDTO, AccountChannelDTO } from '@app/shared';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { api, ApiError } from '@/lib/api-client';

export interface ServerChannelValue {
  serverId: string;
  serverName?: string;
  channelId: string;
  channelName?: string;
}

export interface ServerChannelPickerProps {
  accountId: string | undefined;
  value: ServerChannelValue | null;
  onChange: (value: ServerChannelValue | null) => void;
}

export function ServerChannelPicker({
  accountId,
  value,
  onChange,
}: ServerChannelPickerProps) {
  const [servers, setServers] = useState<AccountServerDTO[]>([]);
  const [channels, setChannels] = useState<AccountChannelDTO[]>([]);
  const [serverId, setServerId] = useState<string>('');
  const [loadingServers, setLoadingServers] = useState(false);
  const [loadingChannels, setLoadingChannels] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset + auto-load servers when account changes
  useEffect(() => {
    if (!accountId) {
      setServers([]);
      setChannels([]);
      setServerId('');
      setError(null);
      return;
    }
    setServers([]);
    setChannels([]);
    setServerId('');
    setError(null);
    onChange(null);
    void loadServers(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountId]);

  const loadServers = async (refresh: boolean) => {
    if (!accountId) return;
    setLoadingServers(true);
    setError(null);
    try {
      const res = await api.listServers(accountId, refresh);
      setServers(res.servers);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'Could not load servers. The account may have no guilds, or the token may be invalid.',
      );
    } finally {
      setLoadingServers(false);
    }
  };

  const loadChannels = async (sid: string, refresh: boolean) => {
    if (!accountId || !sid) return;
    setLoadingChannels(true);
    setError(null);
    try {
      const res = await api.listChannels(accountId, sid, refresh);
      // Only channels the account can actually send to
      const sendable = res.channels.filter((c) => c.canSend);
      setChannels(sendable);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'Could not load channels. Check the account has permission to view channels in this server.',
      );
    } finally {
      setLoadingChannels(false);
    }
  };

  const handleServerChange = (sid: string) => {
    setServerId(sid);
    setChannels([]);
    onChange(null);
    void loadChannels(sid, false);
  };

  const handleChannelChange = (cid: string) => {
    const server = servers.find((s) => s.serverId === serverId);
    const channel = channels.find((c) => c.channelId === cid);
    if (server && channel) {
      onChange({
        serverId: server.serverId,
        serverName: server.serverName ?? undefined,
        channelId: channel.channelId,
        channelName: channel.channelName ?? undefined,
      });
    }
  };

  return (
    <div className="space-y-3">
      {!accountId && (
        <p className="rounded-md border border-dashed border-border-subtle p-3 text-step--2 text-text-tertiary">
          Select an account first.
        </p>
      )}

      {accountId && (
        <>
          {/* Server */}
          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="flex items-center gap-1 text-step--2 text-text-tertiary">
                <Server className="h-3 w-3" /> Server
              </label>
              <button
                type="button"
                onClick={() => loadServers(true)}
                disabled={loadingServers}
                className="flex items-center gap-1 text-step--2 text-text-tertiary hover:text-[color:var(--primary)] disabled:opacity-50"
              >
                <RefreshCw className={loadingServers ? 'h-3 w-3 animate-spin' : 'h-3 w-3'} />
                Refresh
              </button>
            </div>
            {loadingServers ? (
              <Skeleton className="h-10 w-full" />
            ) : (
              <Select
                value={serverId}
                onValueChange={handleServerChange}
                disabled={servers.length === 0}
                placeholder={servers.length ? 'Select a server' : 'No servers loaded'}
                options={servers.map((s) => ({
                  value: s.serverId,
                  label: s.serverName ?? s.serverId,
                }))}
              />
            )}
          </div>

          {/* Channel */}
          {serverId && (
            <div>
              <div className="mb-1 flex items-center justify-between">
                <label className="flex items-center gap-1 text-step--2 text-text-tertiary">
                  <Hash className="h-3 w-3" /> Channel
                </label>
                <button
                  type="button"
                  onClick={() => loadChannels(serverId, true)}
                  disabled={loadingChannels}
                  className="flex items-center gap-1 text-step--2 text-text-tertiary hover:text-[color:var(--primary)] disabled:opacity-50"
                >
                  <RefreshCw className={loadingChannels ? 'h-3 w-3 animate-spin' : 'h-3 w-3'} />
                  Refresh
                </button>
              </div>
              {loadingChannels ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <Select
                  value={value?.channelId ?? ''}
                  onValueChange={handleChannelChange}
                  disabled={channels.length === 0}
                  placeholder={channels.length ? 'Select a channel' : 'No sendable channels'}
                  options={channels.map((c) => ({
                    value: c.channelId,
                    label: `#${c.channelName ?? c.channelId}`,
                  }))}
                />
              )}
            </div>
          )}

          {/* Warning note */}
          <p className="flex items-start gap-1.5 rounded-md border border-[color:var(--break)]/30 bg-[color:var(--break)]/5 p-2.5 text-step--2 text-text-secondary">
            <span className="shrink-0 text-[color:var(--break)]">⚠️</span>
            <span>
              The account must have <strong>View Channel</strong> and{' '}
              <strong>Send Messages</strong> permission in the target channel. If a
              channel is missing, click <strong>Refresh</strong> or verify the account
              is a member of the server.
            </span>
          </p>
        </>
      )}

      {error && (
        <p className="rounded-md border border-danger/30 bg-danger/10 p-2.5 text-step--2 text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
