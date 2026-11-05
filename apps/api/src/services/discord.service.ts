import type { AccountChannelDTO, AccountServerDTO } from '@app/shared';
import { errors, ACCOUNT_CACHE_TTL_MS } from '@app/shared';
import { accounts as accountsDb, getServiceClient } from '@app/db';
import { listUserGuilds, listGuildChannels, getChannelSlowmode } from '@app/discord';
import { decryptToken } from '@app/crypto';

async function resolveToken(userId: string, accountId: string): Promise<string> {
  const bundle = await accountsDb.getAccountTokenBundle(accountId);
  if (!bundle || bundle.userId !== userId) {
    throw errors.accountNotFound();
  }
  if (bundle.status !== 'active') {
    throw errors.accountInvalid();
  }
  try {
    return decryptToken({
      ciphertext: bundle.ciphertext,
      iv: bundle.iv,
      tag: bundle.tag,
      keyVersion: bundle.keyVersion,
    });
  } catch {
    throw errors.internal('Stored token could not be decrypted.');
  }
}

export async function listServers(
  userId: string,
  accountId: string,
  refresh = false,
): Promise<AccountServerDTO[]> {
  const db = getServiceClient();

  if (!refresh) {
    const { data, error } = await db
      .from('account_servers')
      .select('*')
      .eq('account_id', accountId)
      .order('server_name', { ascending: true });

    if (error) throw error;

    if (data && data.length > 0) {
      const newest = data.reduce(
        (max, r) => (r.fetched_at > max ? r.fetched_at : max),
        data[0]!.fetched_at,
      );
      const age = Date.now() - new Date(newest).getTime();
      if (age < ACCOUNT_CACHE_TTL_MS) {
        return data.map((row) => ({
          id: row.id,
          serverId: row.server_id,
          serverName: row.server_name,
          iconHash: row.icon_hash,
          owner: row.owner,
          memberCount: row.member_count,
        }));
      }
    }
  }

  const token = await resolveToken(userId, accountId);
  const guilds = await listUserGuilds(token, { withCounts: true });

  await db.from('account_servers').delete().eq('account_id', accountId);

  if (guilds.length > 0) {
    const now = new Date().toISOString();
    const rows = guilds.map((g) => ({
      account_id: accountId,
      server_id: g.id,
      server_name: g.name,
      icon_hash: g.icon,
      owner: g.owner,
      permissions: g.permissions,
      member_count: null as number | null,
      fetched_at: now,
    }));
    const { error: insErr } = await db.from('account_servers').insert(rows);
    if (insErr) throw insErr;
  }

  return guilds.map((g) => ({
    id: g.id,
    serverId: g.id,
    serverName: g.name,
    iconHash: g.icon,
    owner: g.owner,
    memberCount: null,
  }));
}

export async function listChannels(
  userId: string,
  accountId: string,
  serverId: string,
  refresh = false,
): Promise<AccountChannelDTO[]> {
  const db = getServiceClient();

  if (!refresh) {
    const { data, error } = await db
      .from('account_channels')
      .select('*')
      .eq('account_id', accountId)
      .eq('server_id', serverId)
      .order('position', { ascending: true });

    if (error) throw error;

    if (data && data.length > 0) {
      const newest = data.reduce(
        (max, r) => (r.fetched_at > max ? r.fetched_at : max),
        data[0]!.fetched_at,
      );
      const age = Date.now() - new Date(newest).getTime();
      if (age < ACCOUNT_CACHE_TTL_MS) {
        return data.map((row) => ({
          id: row.id,
          serverId: row.server_id,
          channelId: row.channel_id,
          channelName: row.channel_name,
          channelType: row.channel_type,
          position: row.position,
          slowmodeSeconds: row.slowmode_seconds,
          canSend: row.can_send,
        }));
      }
    }
  }

  const token = await resolveToken(userId, accountId);
  const channels = await listGuildChannels(token, serverId);

  await db
    .from('account_channels')
    .delete()
    .eq('account_id', accountId)
    .eq('server_id', serverId);

  if (channels.length > 0) {
    const now = new Date().toISOString();
    const rows = channels.map((c) => ({
      account_id: accountId,
      server_id: serverId,
      channel_id: c.channelId,
      channel_name: c.channelName,
      channel_type: c.channelType,
      position: c.position,
      slowmode_seconds: c.slowmodeSeconds,
      can_send: c.canSend,
      fetched_at: now,
    }));
    const { error: insErr } = await db.from('account_channels').insert(rows);
    if (insErr) throw insErr;
  }

  return channels.map((c) => ({
    id: c.channelId,
    serverId,
    channelId: c.channelId,
    channelName: c.channelName,
    channelType: c.channelType,
    position: c.position,
    slowmodeSeconds: c.slowmodeSeconds,
    canSend: c.canSend,
  }));
}

export async function readSlowmode(
  userId: string,
  accountId: string,
  channelId: string,
): Promise<{ channelId: string; slowmodeSeconds: number }> {
  const token = await resolveToken(userId, accountId);
  const seconds = await getChannelSlowmode(token, channelId);
  return { channelId, slowmodeSeconds: seconds };
      }
