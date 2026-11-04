export const DISCORD_API_BASE = 'https://discord.com/api/v10';

export const SNOWFLAKE_PATTERN = /^\d{17,20}$/;
export const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const REDEEM_CODE_PATTERN = /^ADVT-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
export const TOKEN_PATTERN = /^[A-Za-z0-9_.-]+$/;

export const MAX_CHANNELS_PER_PLAYGROUND = 5;
export const MAX_MESSAGES_PER_PLAYGROUND = 10;
export const MAX_PLAYGROUNDS_PER_CODE = 50;

export const MIN_INTERVAL_SECONDS = 30;
export const MAX_INTERVAL_SECONDS = 604_800; // 7 days

export const MIN_TOKEN_LENGTH = 50;
export const MAX_TOKEN_LENGTH = 120;

export const MIN_LABEL_LENGTH = 1;
export const MAX_LABEL_LENGTH = 64;

export const MIN_PLAYGROUND_NAME_LENGTH = 1;
export const MAX_PLAYGROUND_NAME_LENGTH = 80;

export const MIN_MESSAGE_LENGTH = 1;
export const MAX_MESSAGE_LENGTH = 4000;

export const CODE_DURATION_DAYS: Record<'1m' | '3m', number> = {
  '1m': 30,
  '3m': 90,
};

export const WORKER_LEASE_SECONDS = 120;
export const WORKER_DEFAULT_POLL_MS = 1000;
export const WORKER_DEFAULT_CONCURRENCY = 10;
export const WORKER_MAX_ATTEMPTS = 5;

export const BACKOFF_BASE_SECONDS = 5;
export const BACKOFF_CAP_SECONDS = 300;
export const BACKOFF_JITTER_SECONDS = 5;

export const DEFAULT_INTERVAL_SECONDS = 300;
export const SLOWMODE_MIN_SECONDS = 5;
export const SLOWMODE_REFRESH_MS = 15 * 60 * 1000;

export const ACCOUNT_CACHE_TTL_MS = 15 * 60 * 1000;

export const DISCORD_EPOCH = 1420070400000n;