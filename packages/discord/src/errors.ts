import type { DeliveryStatus } from '@app/shared';

export interface DiscordApiErrorBody {
  code: number;
  message: string;
  errors?: unknown;
}

export interface MappedError {
  status: number;
  deliveryStatus: DeliveryStatus;
  retryable: boolean;
  errorCode: string | null;
  message: string;
  retryAfterMs: number | null;
}

const DISCORD_ERROR_NAMES: Record<number, string> = {
  0: 'GENERAL_ERROR',
  10003: 'UNKNOWN_CHANNEL',
  10004: 'UNKNOWN_GUILD',
  10013: 'UNKNOWN_USER',
  20001: 'BOTS_CANNOT_USE_THIS_ENDPOINT',
  20002: 'ONLY_BOTS_CAN_USE_THIS_ENDPOINT',
  30001: 'MAXIMUM_NUMBER_OF_GUILDS_REACHED',
  40001: 'UNAUTHORIZED',
  40002: 'VERIFICATION_REQUIRED',
  40003: 'OPEN_DM_TOO_FAST',
  40004: 'SEND_MESSAGES_TEMPORARILY_DISABLED',
  40005: 'REQUEST_ENTITY_TOO_LARGE',
  40006: 'RATE_LIMITED_TOO_LONG',
  40007: 'INVALID_OAUTH_TOKEN',
  50001: 'MISSING_ACCESS',
  50007: 'CANNOT_SEND_MESSAGES_TO_USER',
  50013: 'MISSING_PERMISSIONS',
  50035: 'INVALID_FORM_BODY',
  50041: 'INVALID_API_VERSION',
};

export function errorNameForCode(code: number): string {
  return DISCORD_ERROR_NAMES[code] ?? 'UNKNOWN_DISCORD_ERROR';
}

export function mapDiscordError(
  httpStatus: number,
  body: DiscordApiErrorBody | null,
  retryAfterMs?: number | null,
): MappedError {
  const code = body?.code ?? 0;
  const message = body?.message ?? `HTTP ${httpStatus}`;
  const errorCode = body ? errorNameForCode(code) : null;

  if (httpStatus === 401) {
    return {
      status: 401,
      deliveryStatus: 'invalid_token',
      retryable: false,
      errorCode: errorCode ?? 'UNAUTHORIZED',
      message,
      retryAfterMs: null,
    };
  }

  if (httpStatus === 403) {
    return {
      status: 403,
      deliveryStatus: 'no_permission',
      retryable: false,
      errorCode: errorCode ?? 'FORBIDDEN',
      message,
      retryAfterMs: null,
    };
  }

  if (httpStatus === 404) {
    return {
      status: 404,
      deliveryStatus: 'failed',
      retryable: false,
      errorCode: errorCode ?? 'NOT_FOUND',
      message,
      retryAfterMs: null,
    };
  }

  if (httpStatus === 429) {
    return {
      status: 429,
      deliveryStatus: 'rate_limited',
      retryable: true,
      errorCode: errorCode ?? 'RATE_LIMITED',
      message,
      retryAfterMs: retryAfterMs ?? 1000,
    };
  }

  if (httpStatus === 400) {
    return {
      status: 400,
      deliveryStatus: 'failed',
      retryable: false,
      errorCode: errorCode ?? 'BAD_REQUEST',
      message,
      retryAfterMs: null,
    };
  }

  if (httpStatus >= 500) {
    return {
      status: httpStatus,
      deliveryStatus: 'failed',
      retryable: true,
      errorCode: errorCode ?? 'SERVER_ERROR',
      message,
      retryAfterMs: null,
    };
  }

  return {
    status: httpStatus,
    deliveryStatus: 'failed',
    retryable: false,
    errorCode,
    message,
    retryAfterMs: null,
  };
}

export class DiscordHttpError extends Error {
  public readonly mapped: MappedError;

  constructor(mapped: MappedError) {
    super(mapped.message);
    this.name = 'DiscordHttpError';
    this.mapped = mapped;
    Object.setPrototypeOf(this, DiscordHttpError.prototype);
  }
}