import { logs } from '@app/db';

export interface AuditEvent {
  actorType: 'user' | 'admin' | 'system' | 'bot' | 'worker';
  actorId: string | null;
  action: string;
  targetType?: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
  ip?: string | null;
  userAgent?: string | null;
}

export async function recordAudit(event: AuditEvent): Promise<void> {
  try {
    await logs.insertAuditLog({
      actorType: event.actorType,
      actorId: event.actorId,
      action: event.action,
      targetType: event.targetType ?? null,
      targetId: event.targetId ?? null,
      metadata: event.metadata ?? {},
      ip: event.ip ?? null,
      userAgent: event.userAgent ?? null,
    });
  } catch (err) {
    console.warn('[audit] write failed', (err as Error).message, event.action);
  }
}