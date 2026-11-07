import type {
  CreatePlaygroundInput,
  PlaygroundChannelDTO,
  PlaygroundDTO,
  PlaygroundMessageDTO,
  PlaygroundOverviewDTO,
  UpdatePlaygroundInput,
} from '@app/shared';
import {
  errors,
  MAX_CHANNELS_PER_PLAYGROUND,
  MAX_MESSAGES_PER_PLAYGROUND,
} from '@app/shared';
import {
  entitlements as entitlementsDb,
  playgrounds as playgroundsDb,
  jobs as jobsDb,
} from '@app/db';

function nextRunDate(mode: 'manual' | 'slowmode', interval: number): Date {
  const seconds = mode === 'slowmode' ? Math.max(5, interval) : Math.max(1, interval);
  return new Date(Date.now() + seconds * 1000);
}

export async function listPlaygrounds(userId: string): Promise<PlaygroundOverviewDTO[]> {
  return playgroundsDb.listPlaygroundsForUser(userId);
}

export async function getPlayground(
  userId: string,
  playgroundId: string,
): Promise<PlaygroundDTO> {
  const pg = await playgroundsDb.getPlaygroundById(playgroundId, userId);
  if (!pg) throw errors.playgroundNotFound();
  return pg;
}

export async function createPlayground(
  userId: string,
  input: CreatePlaygroundInput,
): Promise<PlaygroundDTO> {
  const snapshot = await entitlementsDb.getAccessSnapshot(userId);
  if (!snapshot.hasAccess) throw errors.noAccess();
  if (snapshot.playgroundsUsed >= snapshot.effectivePlaygroundLimit) {
    throw errors.playgroundLimitReached(snapshot.effectivePlaygroundLimit);
  }
  if (input.channels.length > MAX_CHANNELS_PER_PLAYGROUND) {
    throw errors.channelLimitReached(MAX_CHANNELS_PER_PLAYGROUND);
  }
  if (input.messages.length > MAX_MESSAGES_PER_PLAYGROUND) {
    throw errors.messageLimitReached(MAX_MESSAGES_PER_PLAYGROUND);
  }

  const playgroundId = await playgroundsDb.insertPlayground({
    userId,
    accountId: input.accountId,
    name: input.name,
    mode: input.mode,
    intervalSeconds: input.intervalSeconds,
    channels: input.channels.map((c) => ({
      serverId: c.serverId,
      channelId: c.channelId,
      serverName: c.serverName,
      channelName: c.channelName,
    })),
    messages: input.messages.map((m) => ({ content: m.content })),
  });

  return getPlayground(userId, playgroundId);
}

export async function updatePlayground(
  userId: string,
  playgroundId: string,
  input: UpdatePlaygroundInput,
): Promise<PlaygroundDTO> {
  const existing = await playgroundsDb.getPlaygroundById(playgroundId, userId);
  if (!existing) throw errors.playgroundNotFound();

  await playgroundsDb.updatePlayground(playgroundId, userId, input);
  return getPlayground(userId, playgroundId);
}

export async function deletePlayground(
  userId: string,
  playgroundId: string,
): Promise<void> {
  const existing = await playgroundsDb.getPlaygroundById(playgroundId, userId);
  if (!existing) throw errors.playgroundNotFound();
  await jobsDb.cancelJobsForPlayground(playgroundId);
  const ok = await playgroundsDb.deletePlayground(playgroundId, userId);
  if (!ok) throw errors.playgroundNotFound();
}

export async function startPlayground(
  userId: string,
  playgroundId: string,
): Promise<PlaygroundDTO> {
  const pg = await playgroundsDb.getPlaygroundById(playgroundId, userId);
  if (!pg) throw errors.playgroundNotFound();

  const activeChannels = pg.channels.filter((c) => c.isActive);
  if (activeChannels.length === 0) {
    throw errors.noChannels();
  }

  if (pg.status === 'running') {
    return pg;
  }

  await playgroundsDb.setPlaygroundRunning(playgroundId, userId, true);

  const message = pg.messages.find((m) => m.isActive) ?? pg.messages[0];
  const messageId = message?.id ?? null;
  const now = Date.now();

  const rows = activeChannels.map((c) => {
    const interval = pg.mode === 'slowmode' ? c.slowmodeSeconds : pg.intervalSeconds;
    const runAt = nextRunDate(pg.mode, interval).toISOString();
    return {
      playground_id: playgroundId,
      playground_channel_id: c.id,
      message_id: messageId,
      run_at: runAt,
      idempotency_key: `${playgroundId}:${c.id}:${now}`,
      status: 'pending' as const,
    };
  });

  if (rows.length > 0) {
    const { getServiceClient } = await import('@app/db');
    const { error } = await getServiceClient()
      .from('scheduled_jobs')
      .upsert(rows, { onConflict: 'idempotency_key', ignoreDuplicates: true });

    if (error) {
      console.error('[startPlayground] scheduled_jobs upsert failed', {
        playgroundId,
        rowCount: rows.length,
        error: {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
        },
      });
      // Roll back the running state so the user can retry cleanly
      await playgroundsDb.setPlaygroundRunning(playgroundId, userId, false);
      throw error;
    }
  }

  return getPlayground(userId, playgroundId);
}

export async function stopPlayground(
  userId: string,
  playgroundId: string,
): Promise<PlaygroundDTO> {
  const pg = await playgroundsDb.getPlaygroundById(playgroundId, userId);
  if (!pg) throw errors.playgroundNotFound();

  if (pg.status === 'paused' || pg.status === 'idle') {
    return pg;
  }

  await jobsDb.cancelJobsForPlayground(playgroundId);
  await playgroundsDb.setPlaygroundRunning(playgroundId, userId, false);
  return getPlayground(userId, playgroundId);
}

export async function addChannel(
  userId: string,
  playgroundId: string,
  channel: {
    serverId: string;
    channelId: string;
    serverName?: string;
    channelName?: string;
    slowmodeSeconds?: number;
  },
): Promise<PlaygroundChannelDTO> {
  const pg = await playgroundsDb.getPlaygroundById(playgroundId, userId);
  if (!pg) throw errors.playgroundNotFound();

  const count = await playgroundsDb.countChannels(playgroundId);
  if (count >= MAX_CHANNELS_PER_PLAYGROUND) {
    throw errors.channelLimitReached(MAX_CHANNELS_PER_PLAYGROUND);
  }

  return playgroundsDb.addPlaygroundChannel(playgroundId, channel, count);
}

export async function removeChannel(
  userId: string,
  playgroundId: string,
  channelId: string,
): Promise<void> {
  const pg = await playgroundsDb.getPlaygroundById(playgroundId, userId);
  if (!pg) throw errors.playgroundNotFound();

  const ok = await playgroundsDb.removePlaygroundChannel(playgroundId, channelId);
  if (!ok) throw errors.notFound('Channel');
}

export async function addMessage(
  userId: string,
  playgroundId: string,
  content: string,
): Promise<PlaygroundMessageDTO> {
  const pg = await playgroundsDb.getPlaygroundById(playgroundId, userId);
  if (!pg) throw errors.playgroundNotFound();

  if (pg.messages.length >= MAX_MESSAGES_PER_PLAYGROUND) {
    throw errors.messageLimitReached(MAX_MESSAGES_PER_PLAYGROUND);
  }

  return playgroundsDb.upsertMessage(playgroundId, content);
}
