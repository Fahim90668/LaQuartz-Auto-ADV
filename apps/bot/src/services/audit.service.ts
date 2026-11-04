import { logs as logsDb } from '@app/db';

export interface BotAuditEvent {
  adminDiscordId: string;
  action: string;
  targetType?: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
}

export async function recordBotAudit(event: BotAuditEvent): Promise<void> {
  try {
    await logsDb.insertAuditLog({
      actorType: 'admin',
      actorId: event.adminDiscordId,
      action: event.action,
      targetType: event.targetType ?? null,
      targetId: event.targetId ?? null,
      metadata: event.metadata ?? {},
      ip: null,
      userAgent: 'discord-bot',
    });
  } catch (err) {
    console.warn('[bot:audit] write failed', (err as Error).message, event.action);
  }
}