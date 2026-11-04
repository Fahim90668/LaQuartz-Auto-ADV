export const ErrorCode = {
  NOT_AUTHENTICATED: 'NOT_AUTHENTICATED',
  FORBIDDEN: 'FORBIDDEN',
  NO_ACCESS: 'NO_ACCESS',
  NO_ENTITLEMENT: 'NO_ENTITLEMENT',

  INVALID_CODE: 'INVALID_CODE',
  ALREADY_REDEEMED: 'ALREADY_REDEEMED',
  CODE_DESTROYED: 'CODE_DESTROYED',
  CODE_EXPIRED: 'CODE_EXPIRED',

  INVALID_TOKEN: 'INVALID_TOKEN',
  DUPLICATE_TOKEN: 'DUPLICATE_TOKEN',
  ACCOUNT_NOT_FOUND: 'ACCOUNT_NOT_FOUND',
  ACCOUNT_INVALID: 'ACCOUNT_INVALID',

  PLAYGROUND_NOT_FOUND: 'PLAYGROUND_NOT_FOUND',
  PLAYGROUND_LIMIT_REACHED: 'PLAYGROUND_LIMIT_REACHED',
  CHANNEL_LIMIT_REACHED: 'CHANNEL_LIMIT_REACHED',
  MESSAGE_LIMIT_REACHED: 'MESSAGE_LIMIT_REACHED',
  NO_CHANNELS: 'NO_CHANNELS',
  ALREADY_RUNNING: 'ALREADY_RUNNING',
  ALREADY_STOPPED: 'ALREADY_STOPPED',

  VALIDATION_ERROR: 'VALIDATION_ERROR',
  RATE_LIMITED: 'RATE_LIMITED',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

export interface AppErrorJson {
  error: {
    code: ErrorCode;
    message: string;
    details?: unknown;
    requestId?: string;
  };
}

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly details?: unknown;

  constructor(code: ErrorCode, message: string, statusCode = 400, details?: unknown) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    Object.setPrototypeOf(this, AppError.prototype);
  }

  toJSON(requestId?: string): AppErrorJson {
    return {
      error: {
        code: this.code,
        message: this.message,
        ...(this.details !== undefined ? { details: this.details } : {}),
        ...(requestId ? { requestId } : {}),
      },
    };
  }
}

export const isAppError = (err: unknown): err is AppError => err instanceof AppError;

export const errors = {
  notAuthenticated: () =>
    new AppError(ErrorCode.NOT_AUTHENTICATED, 'Not authenticated.', 401),
  forbidden: (message = 'Forbidden.') => new AppError(ErrorCode.FORBIDDEN, message, 403),
  noAccess: () =>
    new AppError(
      ErrorCode.NO_ACCESS,
      'No active entitlement. Redeem a code to access the panel.',
      403,
    ),
  noEntitlement: () =>
    new AppError(ErrorCode.NO_ENTITLEMENT, 'User has no active entitlement.', 403),

  invalidCode: () => new AppError(ErrorCode.INVALID_CODE, 'Invalid code.', 400),
  alreadyRedeemed: () =>
    new AppError(ErrorCode.ALREADY_REDEEMED, 'This code has already been redeemed.', 409),
  codeDestroyed: () =>
    new AppError(ErrorCode.CODE_DESTROYED, 'This code has been revoked.', 410),
  codeExpired: () => new AppError(ErrorCode.CODE_EXPIRED, 'This code has expired.', 410),

  invalidToken: (reason?: string) =>
    new AppError(ErrorCode.INVALID_TOKEN, reason ?? 'Discord rejected this token.', 400),
  duplicateToken: () =>
    new AppError(ErrorCode.DUPLICATE_TOKEN, 'This token is already linked.', 409),
  accountNotFound: () => new AppError(ErrorCode.ACCOUNT_NOT_FOUND, 'Account not found.', 404),
  accountInvalid: () =>
    new AppError(ErrorCode.ACCOUNT_INVALID, 'Account token is no longer valid.', 409),

  playgroundNotFound: () =>
    new AppError(ErrorCode.PLAYGROUND_NOT_FOUND, 'Playground not found.', 404),
  playgroundLimitReached: (limit: number) =>
    new AppError(
      ErrorCode.PLAYGROUND_LIMIT_REACHED,
      `Limit is ${limit} playground(s) for this account.`,
      409,
    ),
  channelLimitReached: (limit: number) =>
    new AppError(
      ErrorCode.CHANNEL_LIMIT_REACHED,
      `Maximum ${limit} channels per playground.`,
      409,
    ),
  messageLimitReached: (limit: number) =>
    new AppError(
      ErrorCode.MESSAGE_LIMIT_REACHED,
      `Maximum ${limit} messages per playground.`,
      409,
    ),
  noChannels: () =>
    new AppError(ErrorCode.NO_CHANNELS, 'At least one active channel is required.', 400),
  alreadyRunning: () =>
    new AppError(ErrorCode.ALREADY_RUNNING, 'Playground is already running.', 409),
  alreadyStopped: () =>
    new AppError(ErrorCode.ALREADY_STOPPED, 'Playground is already stopped.', 409),

  validation: (message: string, details?: unknown) =>
    new AppError(ErrorCode.VALIDATION_ERROR, message, 422, details),
  rateLimited: (retryAfter?: number) =>
    new AppError(ErrorCode.RATE_LIMITED, 'Too many requests.', 429, { retryAfter }),
  notFound: (what = 'Resource') =>
    new AppError(ErrorCode.NOT_FOUND, `${what} not found.`, 404),
  conflict: (message: string) => new AppError(ErrorCode.CONFLICT, message, 409),
  internal: (message = 'Internal server error.') =>
    new AppError(ErrorCode.INTERNAL_ERROR, message, 500),
} as const;