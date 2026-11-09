import { continuous as continuousDb, accounts as accountsDb } from '@app/db';
import type { ContinuousService } from '@app/db/queries/continuous.js';
import { decryptToken } from '@app/crypto';
import { getLogger } from './logger.js';

const POLL_MS = 5_000;
const TYPING_INTERVAL_MS = 8_000;

interface LiveService {
  service: ContinuousService;
  stop: () => void;
}

export class ContinuousManager {
  private readonly live = new Map<string, LiveService>();
  private timer: NodeJS.Timeout | null = null;
  private running = false;

  start(): void {
    if (this.running) return;
    this.running = true;
    getLogger().info('continuous manager started', { pollMs: POLL_MS });
    void this.tick();
  }

  async stop(): Promise<void> {
    this.running = false;
    if (this.timer) clearTimeout(this.timer);
    for (const { stop } of this.live.values()) {
      try { stop(); } catch { /* ignore */ }
    }
    this.live.clear();
  }

  private scheduleNext(): void {
    if (!this.running) return;
    this.timer = setTimeout(() => void this.tick(), POLL_MS);
  }

  private async tick(): Promise<void> {
    if (!this.running) return;
    try {
      const services = await continuousDb.listActiveServices();
      const now = Date.now();
      const activeIds = new Set(services.map((s) => s.id));

      for (const [id, live] of this.live.entries()) {
        if (!activeIds.has(id)) {
          try { live.stop(); } catch { /* ignore */ }
          this.live.delete(id);
          getLogger().info('continuous service removed', { id });
        }
      }

      for (const svc of services) {
        const exp = new Date(svc.expiresAt).getTime();

        if (exp <= now) {
          const live = this.live.get(svc.id);
          if (live) {
            try { live.stop(); } catch { /* ignore */ }
            this.live.delete(svc.id);
          }
          await continuousDb.updateServiceStatus(svc.id, 'expired').catch(() => {});
          getLogger().info('continuous service expired', { id: svc.id });
          continue;
        }

        if (svc.status === 'paused') {
          const live = this.live.get(svc.id);
          if (live) {
            try { live.stop(); } catch { /* ignore */ }
            this.live.delete(svc.id);
            getLogger().info('continuous service paused', { id: svc.id });
          }
          continue;
        }

        if (!this.live.has(svc.id)) {
          try {
            const stop = await this.startService(svc);
            this.live.set(svc.id, { service: svc, stop });
            await continuousDb.updateServiceStatus(svc.id, 'active').catch(() => {});
            getLogger().info('continuous service started', {
              id: svc.id,
              type: svc.serviceType,
            });
          } catch (err) {
            await continuousDb
              .updateServiceStatus(svc.id, 'error', (err as Error).message)
              .catch(() => {});
            getLogger().error('continuous service failed to start', {
              id: svc.id,
              type: svc.serviceType,
              err: (err as Error).message,
            });
          }
        } else {
          await continuousDb.touchService(svc.id).catch(() => {});
        }
      }
    } catch (err) {
      getLogger().error('continuous manager tick failed', {
        err: (err as Error).message,
      });
    } finally {
      this.scheduleNext();
    }
  }

  private async startService(svc: ContinuousService): Promise<() => void> {
    const bundle = await accountsDb.getAccountTokenBundle(svc.accountId);
    if (!bundle) throw new Error('Account not found');

    const token = decryptToken({
      ciphertext: bundle.ciphertext,
      iv: bundle.iv,
      tag: bundle.tag,
      keyVersion: bundle.keyVersion,
    });

    switch (svc.serviceType) {
      case 'onliner':
        return startOnliner(svc, token);
      case 'typer':
        return startTyper(svc, token);
      case 'vc':
        throw new Error(
          '24/7 VC not yet implemented — requires @discordjs/voice + opus + UDP. Contact admin.',
        );
      default:
        throw new Error(`Unknown service type: ${String(svc.serviceType)}`);
    }
  }
}

/* ─── Onliner: gateway WebSocket + custom rich presence ─────────────── */

interface GatewayFrame {
  op: number;
  d?: unknown;
  s?: number;
  t?: string;
}

interface ActivityConfig {
  type?: number;      // 0=Playing 1=Streaming 2=Listening 3=Watching 4=Custom 5=Competing
  name?: string;
  state?: string;
  details?: string;
  url?: string;
}

function buildActivities(config: Record<string, unknown>): Record<string, unknown>[] {
  const activity = config.activity as ActivityConfig | undefined;
  if (!activity?.name || activity.name.trim().length < 2) return [];

  let type = Number(activity.type ?? 0);
  const name = activity.name.trim();
  if (name.length > 128) return [];

  const obj: Record<string, unknown> = { name, type };

  if (activity.state && activity.state.trim()) {
    const s = activity.state.trim().slice(0, 128);
    if (s) obj.state = s;
  }
  if (activity.details && activity.details.trim()) {
    const d = activity.details.trim().slice(0, 128);
    if (d) obj.details = d;
  }

  // Streaming (type 1) requires a valid URL — degrade to Playing if missing
  if (type === 1) {
    if (activity.url && /^https?:\/\//i.test(activity.url)) {
      obj.url = activity.url;
    } else {
      type = 0;
      obj.type = 0;
    }
  }

  return [obj];
}

function startOnliner(svc: ContinuousService, token: string): () => void {
  const log = getLogger().child({ serviceId: svc.id, type: 'onliner' });
  let ws: WebSocket | null = null;
  let heartbeat: NodeJS.Timeout | null = null;
  let autoTimer: NodeJS.Timeout | null = null;
  let lastSeq: number | null = null;
  let alive = true;
  let reconnectAttempts = 0;

  const initialStatus = String(svc.config.presence ?? 'online');
  const autoCycle = svc.config.autoCycle === true;
  const autoIntervalSeconds = Math.max(30, Number(svc.config.autoIntervalSeconds ?? 300));

  const cycleStatuses = ['online', 'idle', 'dnd'] as const;
  let cycleIdx = cycleStatuses.indexOf(initialStatus as (typeof cycleStatuses)[number]);
  if (cycleIdx < 0) cycleIdx = 0;

  const activities = buildActivities(svc.config);

  const cleanupSocket = () => {
    if (heartbeat) { clearInterval(heartbeat); heartbeat = null; }
    if (autoTimer) { clearInterval(autoTimer); autoTimer = null; }
    if (ws) {
      try { ws.close(); } catch { /* ignore */ }
      ws = null;
    }
  };

  const connect = () => {
    if (!alive) return;

    try {
      ws = new WebSocket('wss://gateway.discord.gg/?v=10&encoding=json');
    } catch (err) {
      log.error('onliner ws create failed', { err: (err as Error).message });
      return;
    }

    ws.onopen = () => { reconnectAttempts = 0; };

    ws.onmessage = (event: MessageEvent) => {
      let frame: GatewayFrame;
      try {
        frame = JSON.parse(String(event.data)) as GatewayFrame;
      } catch {
        return;
      }
      if (typeof frame.s === 'number') lastSeq = frame.s;

      if (frame.op === 10) {
        const d = frame.d as { heartbeat_interval?: number } | undefined;
        const interval = d?.heartbeat_interval ?? 41_250;

        heartbeat = setInterval(() => {
          if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ op: 1, d: lastSeq }));
          }
        }, interval);

        ws.send(JSON.stringify({
          op: 2,
          d: {
            token,
            capabilities: 30717,
            properties: { os: 'Windows', browser: 'Chrome', device: '' },
            presence: {
              status: initialStatus,
              since: 0,
              activities,
              afk: false,
            },
            compress: false,
          },
        }));

        log.info('onliner identified', {
          presence: initialStatus,
          hasActivity: activities.length > 0,
          activityName: activities[0]?.name ?? null,
          autoCycle,
          autoIntervalSeconds: autoCycle ? autoIntervalSeconds : null,
        });

        if (autoCycle && !autoTimer) {
          autoTimer = setInterval(() => {
            if (!ws || ws.readyState !== WebSocket.OPEN) return;
            cycleIdx = (cycleIdx + 1) % cycleStatuses.length;
            const nextStatus = cycleStatuses[cycleIdx]!;
            try {
              ws.send(JSON.stringify({
                op: 3,
                d: {
                  status: nextStatus,
                  since: 0,
                  activities,
                  afk: false,
                },
              }));
              log.info('onliner presence cycle', { status: nextStatus });
            } catch (err) {
              log.warn('onliner presence cycle failed', {
                err: (err as Error).message,
              });
            }
          }, autoIntervalSeconds * 1000);
        }
        return;
      }

      if (frame.op === 11) return;
      if (frame.op === 7) { cleanupSocket(); setTimeout(connect, 3_000); return; }
      if (frame.op === 9) { cleanupSocket(); setTimeout(connect, 5_000); return; }
    };

    ws.onclose = () => {
      if (!alive) return;
      cleanupSocket();
      reconnectAttempts++;
      const wait = Math.min(30_000, 2_000 * reconnectAttempts);
      log.warn('onliner ws closed — reconnecting', {
        inMs: wait,
        attempts: reconnectAttempts,
      });
      setTimeout(connect, wait);
    };

    ws.onerror = () => { log.warn('onliner ws error'); };
  };

  connect();

  return () => {
    alive = false;
    cleanupSocket();
  };
}

/* ─── Typer: periodic typing indicator ───────────────────────────────── */

function startTyper(svc: ContinuousService, token: string): () => void {
  const log = getLogger().child({ serviceId: svc.id, type: 'typer' });
  const channelId = svc.config.channelId as string | undefined;
  if (!channelId) throw new Error('Typer requires config.channelId');

  const send = async () => {
    try {
      const res = await fetch(
        `https://discord.com/api/v10/channels/${channelId}/typing`,
        {
          method: 'POST',
          headers: {
            Authorization: token,
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
          },
        },
      );
      if (!res.ok) {
        log.warn('typer ping failed', { status: res.status });
        if (res.status === 401) throw new Error('Token invalid (401)');
      } else {
        await continuousDb.touchService(svc.id).catch(() => {});
      }
    } catch (err) {
      log.warn('typer ping error', { err: (err as Error).message });
    }
  };

  void send();
  const handle = setInterval(() => void send(), TYPING_INTERVAL_MS);
  return () => clearInterval(handle);
  }
