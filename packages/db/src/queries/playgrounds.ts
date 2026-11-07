import type {
  PlaygroundChannelDTO,
  PlaygroundDTO,
  PlaygroundMessageDTO,
  PlaygroundOverviewDTO,
} from '@app/shared';
import { getServiceClient } from '../client-service.js';
import type { Database } from '../types.generated.js';

type PlaygroundRow = Database['public']['Tables']['playgrounds']['Row'];
type ChannelRow = Database['public']['Tables']['playground_channels']['Row'];
type MessageRow = Database['public']['Tables']['playground_messages']['Row'];
type OverviewRow = Database['public']['Views']['v_playground_overview']['Row'];

export function toChannelDTO(row: ChannelRow): PlaygroundChannelDTO {
  return {
    id: row.id,
    serverId: row.server_id,
    serverName: row.server_name,
    channelId: row.channel_id,
    channelName: row.channel_name,
    slowmodeSeconds: row.slowmode_seconds,
    isActive: row.is_active,
    position: row.position,
    lastSentAt: row.last_sent_at,
    nextRunAt: row.next_run_at,
  };
}

export function toMessageDTO(row: MessageRow): PlaygroundMessageDTO {
  return {
    id: row.id,
    content: row.content,
    position: row.position,
    isActive: row.is_active,
    timesUsed: row.times_used,
    lastUsedAt: row.last_used_at,
  };
}

export function toOverviewDTO(row: OverviewRow): PlaygroundOverviewDTO {
  return {
    id: row.id,
    name: row.name,
    mode: row.mode,
    status: row.status,
    intervalSeconds: row.interval_seconds,
    accountId: row.account_id,
    accountLabel: row.account_label,
    accountUsername: row.account_username,
    channelCount: Number(row.channel_count ?? 0),
    messagePreview: row.message_preview,
    pendingJobs: Number(row.pending_jobs ?? 0),
    lastSentAt: row.last_sent_at,
    nextRunAt: row.next_run_at,
    lastError: row.last_error,
    totalSent: row.total_sent,
    totalFailed: row.total_failed,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listPlaygroundsForUser(userId: string): Promise<PlaygroundOverviewDTO[]> {
  const { data, error } = await getServiceClient()
    .from('v_playground_overview')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map(toOverviewDTO);
}

export async function getPlaygroundById(
  playgroundId: string,
  userId: string,
): Promise<PlaygroundDTO | null> {
  const db = getServiceClient();

  const [pgRes, channelsRes, messagesRes] = await Promise.all([
    db.from('playgrounds').select('*').eq('id', playgroundId).eq('user_id', userId).maybeSingle(),
    db
      .from('playground_channels')
      .select('*')
      .eq('playground_id', playgroundId)
      .order('position', { ascending: true }),
    db
      .from('playground_messages')
      .select('*')
      .eq('playground_id', playgroundId)
      .order('position', { ascending: true }),
  ]);

  if (pgRes.error) throw pgRes.error;
  if (channelsRes.error) throw channelsRes.error;
  if (messagesRes.error) throw messagesRes.error;

  const pg = pgRes.data;
  if (!pg) return null;

  // Fetch account via a separate single-column query — avoids PostgREST
  // composite-FK embedding which is unreliable (PGRST200).
  const accRes = await db
    .from('discord_accounts')
    .select('id, label, username')
    .eq('id', pg.account_id)
    .maybeSingle();

  if (accRes.error) throw accRes.error;

  const acc = accRes.data;

  return {
    id: pg.id,
    name: pg.name,
    mode: pg.mode,
    status: pg.status,
    intervalSeconds: pg.interval_seconds,
    account: acc ? { id: acc.id, label: acc.label, username: acc.username } : null,
    channels: (channelsRes.data ?? []).map(toChannelDTO),
    messages: (messagesRes.data ?? []).map(toMessageDTO),
    lastSentAt: pg.last_sent_at,
    nextRunAt: pg.next_run_at,
    lastError: pg.last_error,
    lastErrorAt: pg.last_error_at,
    totalSent: pg.total_sent,
    totalFailed: pg.total_failed,
    startedAt: pg.started_at,
    stoppedAt: pg.stopped_at,
    createdAt: pg.created_at,
    updatedAt: pg.updated_at,
  };
}

export interface CreatePlaygroundInput {
  userId: string;
  accountId: string;
  name: string;
  mode: 'manual' | 'slowmode';
  intervalSeconds: number;
  channels: Array<{
    serverId: string;
    channelId: string;
    serverName?: string;
    channelName?: string;
    slowmodeSeconds?: number;
  }>;
  messages: Array<{ content: string }>;
}

export async function insertPlayground(input: CreatePlaygroundInput): Promise<string> {
  const db = getServiceClient();

  const pgInsert = await db
    .from('playgrounds')
    .insert({
      user_id: input.userId,
      account_id: input.accountId,
      name: input.name,
      mode: input.mode,
      interval_seconds: input.intervalSeconds,
      status: 'idle',
    })
    .select('id')
    .single();

  if (pgInsert.error) throw pgInsert.error;
  const playgroundId = pgInsert.data.id;

  const channelRows = input.channels.map((c, idx) => ({
    playground_id: playgroundId,
    server_id: c.serverId,
    server_name: c.serverName ?? null,
    channel_id: c.channelId,
    channel_name: c.channelName ?? null,
    slowmode_seconds: c.slowmodeSeconds ?? 0,
    position: idx,
    is_active: true,
  }));

  const chanInsert = await db.from('playground_channels').insert(channelRows);
  if (chanInsert.error) {
    await db.from('playgrounds').delete().eq('id', playgroundId);
    throw chanInsert.error;
  }

  const msgRows = input.messages.map((m, idx) => ({
    playground_id: playgroundId,
    content: m.content,
    position: idx,
  }));

  const msgInsert = await db.from('playground_messages').insert(msgRows);
  if (msgInsert.error) {
    await db.from('playgrounds').delete().eq('id', playgroundId);
    throw msgInsert.error;
  }

  return playgroundId;
}

export async function updatePlayground(
  playgroundId: string,
  userId: string,
  patch: { name?: string; mode?: 'manual' | 'slowmode'; intervalSeconds?: number },
): Promise<void> {
  const update: Database['public']['Tables']['playgrounds']['Update'] = {};
  if (patch.name !== undefined) update.name = patch.name;
  if (patch.mode !== undefined) update.mode = patch.mode;
  if (patch.intervalSeconds !== undefined) update.interval_seconds = patch.intervalSeconds;

  const { error } = await getServiceClient()
    .from('playgrounds')
    .update(update)
    .eq('id', playgroundId)
    .eq('user_id', userId);

  if (error) throw error;
}

export async function deletePlayground(playgroundId: string, userId: string): Promise<boolean> {
  const { data, error } = await getServiceClient()
    .from('playgrounds')
    .delete()
    .eq('id', playgroundId)
    .eq('user_id', userId)
    .select('id')
    .maybeSingle();

  if (error) throw error;
  return Boolean(data);
}

export async function setPlaygroundRunning(
  playgroundId: string,
  userId: string,
  running: boolean,
): Promise<void> {
  const { error } = await getServiceClient()
    .from('playgrounds')
    .update(
      running
        ? { status: 'running', started_at: new Date().toISOString(), stopped_at: null }
        : { status: 'paused', stopped_at: new Date().toISOString() },
    )
    .eq('id', playgroundId)
    .eq('user_id', userId);

  if (error) throw error;
}

export async function addPlaygroundChannel(
  playgroundId: string,
  channel: {
    serverId: string;
    channelId: string;
    serverName?: string;
    channelName?: string;
    slowmodeSeconds?: number;
  },
  position: number,
): Promise<PlaygroundChannelDTO> {
  const { data, error } = await getServiceClient()
    .from('playground_channels')
    .insert({
      playground_id: playgroundId,
      server_id: channel.serverId,
      server_name: channel.serverName ?? null,
      channel_id: channel.channelId,
      channel_name: channel.channelName ?? null,
      slowmode_seconds: channel.slowmodeSeconds ?? 0,
      position,
      is_active: true,
    })
    .select('*')
    .single();

  if (error) throw error;
  return toChannelDTO(data);
}

export async function removePlaygroundChannel(
  playgroundId: string,
  channelId: string,
): Promise<boolean> {
  const { data, error } = await getServiceClient()
    .from('playground_channels')
    .delete()
    .eq('playground_id', playgroundId)
    .eq('channel_id', channelId)
    .select('id')
    .maybeSingle();

  if (error) throw error;
  return Boolean(data);
}

export async function countChannels(playgroundId: string): Promise<number> {
  const { count, error } = await getServiceClient()
    .from('playground_channels')
    .select('id', { count: 'exact', head: true })
    .eq('playground_id', playgroundId);
  if (error) throw error;
  return count ?? 0;
}

export async function upsertMessage(
  playgroundId: string,
  content: string,
  position?: number,
): Promise<PlaygroundMessageDTO> {
  const db = getServiceClient();

  let resolvedPosition = position;
  if (resolvedPosition === undefined) {
    const { data: existing, error: cntErr } = await db
      .from('playground_messages')
      .select('position')
      .eq('playground_id', playgroundId)
      .order('position', { ascending: false })
      .limit(1);
    if (cntErr) throw cntErr;
    resolvedPosition = existing?.[0] ? existing[0].position + 1 : 0;
  }

  const { data, error } = await db
    .from('playground_messages')
    .insert({ playground_id: playgroundId, content, position: resolvedPosition })
    .select('*')
    .single();

  if (error) throw error;
  return toMessageDTO(data);
}

export async function setChannelSlowmode(
  playgroundChannelId: string,
  slowmodeSeconds: number,
): Promise<void> {
  const { error } = await getServiceClient()
    .from('playground_channels')
    .update({ slowmode_seconds: slowmodeSeconds })
    .eq('id', playgroundChannelId);
  if (error) throw error;
    }
