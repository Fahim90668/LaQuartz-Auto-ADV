import type { Env } from './env.js';

export type LogLevel = 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace';

const LEVELS: Record<LogLevel, number> = {
  fatal: 60,
  error: 50,
  warn: 40,
  info: 30,
  debug: 20,
  trace: 10,
};

class Logger {
  private readonly level: number;
  private readonly base: Record<string, unknown>;

  constructor(opts: { level: LogLevel; base?: Record<string, unknown> }) {
    this.level = LEVELS[opts.level];
    this.base = opts.base ?? {};
  }

  child(context: Record<string, unknown>): Logger {
    return new Logger({
      level: this.levelToName(),
      base: { ...this.base, ...context },
    });
  }

  private levelToName(): LogLevel {
    const entry = Object.entries(LEVELS).find(([, v]) => v === this.level);
    return (entry?.[0] as LogLevel) ?? 'info';
  }

  private emit(level: LogLevel, msg: string, data?: Record<string, unknown>): void {
    if (LEVELS[level] < this.level) return;
    const payload = {
      ts: new Date().toISOString(),
      level,
      msg,
      ...this.base,
      ...(data ?? {}),
    };
    const line = JSON.stringify(payload);
    if (LEVELS[level] >= LEVELS.error) process.stderr.write(line + '\n');
    else process.stdout.write(line + '\n');
  }

  fatal(msg: string, data?: Record<string, unknown>): void {
    this.emit('fatal', msg, data);
  }
  error(msg: string, data?: Record<string, unknown>): void {
    this.emit('error', msg, data);
  }
  warn(msg: string, data?: Record<string, unknown>): void {
    this.emit('warn', msg, data);
  }
  info(msg: string, data?: Record<string, unknown>): void {
    this.emit('info', msg, data);
  }
  debug(msg: string, data?: Record<string, unknown>): void {
    this.emit('debug', msg, data);
  }
  trace(msg: string, data?: Record<string, unknown>): void {
    this.emit('trace', msg, data);
  }
}

let instance: Logger | null = null;

export function initLogger(env: Env): Logger {
  instance = new Logger({
    level: env.LOG_LEVEL as LogLevel,
    base: { service: 'worker', workerId: env.WORKER_ID },
  });
  return instance;
}

export function getLogger(): Logger {
  if (!instance) {
    instance = new Logger({ level: 'info', base: { service: 'worker' } });
  }
  return instance;
}