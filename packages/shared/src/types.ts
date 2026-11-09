export type UserRole = 'user' | 'admin';
export type CodeDuration = 'lifetime' | '1m' | '3m' | 'custom';
export type CodeStatus = 'active' | 'redeemed' | 'destroyed' | 'expired';
export type EntitlementStatus = 'active' | 'expired' | 'revoked';
export type AccountStatus = 'active' | 'invalid' | 'checking' | 'removed';
export type PlaygroundMode = 'manual' | 'slowmode';
export type PlaygroundStatus = 'idle' | 'running' | 'paused' | 'error';
export type JobStatus = 'pending' | 'running' | 'sent' | 'failed' | 'cancelled' | 'skipped';
export type DeliveryStatus =
  | 'sent'
  | 'failed'
  | 'rate_limited'
  | 'invalid_token'
  | 'no_permission'
  | 'skipped';
export type ActorType = 'user' | 'admin' | 'system' | 'bot' | 'worker';

export interface ProfileDTO {
  id: string;
  discordId: string;
  username: string;
  globalName: string | null;
  discriminator: string | null;
  email: string | null;
  avatarUrl: string | null;
  role: UserRole;
  isBanned: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AccessSnapshot {
  hasAccess: boolean;
  effectivePlaygroundLimit: number;
  playgroundsUsed: number;
  soonestExpiry: string | null;
  isLifetime: boolean;
  isBanned: boolean;
}

export interface EntitlementDTO {
  id: string;
  userId: string;
  codeId: string;
  playgroundLimit: number;
  limitOnliner: number;
  limitVc: number;
  limitTyper: number;
  status: EntitlementStatus;
  startsAt: string;
  expiresAt: string | null;
  revokedAt: string | null;
  createdAt: string;
}

export interface RedeemCodeDTO {
  id: string;
  codePreview: string;
  duration: CodeDuration;
  durationDays: number | null;
  playgroundLimit: number;
  limitOnliner: number;
  limitVc: number;
  limitTyper: number;
  status: CodeStatus;
  redeemedBy: string | null;
  redeemedAt: string | null;
  expiresAt: string | null;
  destroyedAt: string | null;
  createdAt: string;
}

export interface RedeemResult {
  success: boolean;
  message: string;
  entitlement: {
    id: string;
    expiresAt: string | null;
    playgroundLimit: number;
  } | null;
}

export interface DiscordAccountDTO {
  id: string;
  label: string;
  discordUserId: string | null;
  username: string | null;
  globalName: string | null;
  avatarUrl: string | null;
  status: AccountStatus;
  lastValidatedAt: string | null;
  lastError: string | null;
  lastErrorAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AccountServerDTO {
  id: string;
  serverId: string;
  serverName: string | null;
  iconHash: string | null;
  owner: boolean;
  memberCount: number | null;
}

export interface AccountChannelDTO {
  id: string;
  serverId: string;
  channelId: string;
  channelName: string | null;
  channelType: number;
  position: number;
  slowmodeSeconds: number;
  canSend: boolean;
}

export interface PlaygroundChannelDTO {
  id: string;
  serverId: string;
  serverName: string | null;
  channelId: string;
  channelName: string | null;
  slowmodeSeconds: number;
  isActive: boolean;
  position: number;
  lastSentAt: string | null;
  nextRunAt: string | null;
}

export interface PlaygroundMessageDTO {
  id: string;
  content: string;
  position: number;
  isActive: boolean;
  timesUsed: number;
  lastUsedAt: string | null;
}

export interface PlaygroundDTO {
  id: string;
  name: string;
  mode: PlaygroundMode;
  status: PlaygroundStatus;
  intervalSeconds: number;
  account: { id: string; label: string; username: string | null } | null;
  channels: PlaygroundChannelDTO[];
  messages: PlaygroundMessageDTO[];
  lastSentAt: string | null;
  nextRunAt: string | null;
  lastError: string | null;
  lastErrorAt: string | null;
  totalSent: number;
  totalFailed: number;
  startedAt: string | null;
  stoppedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PlaygroundOverviewDTO {
  id: string;
  name: string;
  mode: PlaygroundMode;
  status: PlaygroundStatus;
  intervalSeconds: number;
  accountId: string;
  accountLabel: string;
  accountUsername: string | null;
  channelCount: number;
  messagePreview: string | null;
  pendingJobs: number;
  lastSentAt: string | null;
  nextRunAt: string | null;
  lastError: string | null;
  totalSent: number;
  totalFailed: number;
  createdAt: string;
  updatedAt: string;
}

export interface ScheduledJobDTO {
  id: string;
  playgroundId: string;
  playgroundChannelId: string;
  messageId: string | null;
  runAt: string;
  status: JobStatus;
  attempts: number;
  maxAttempts: number;
  lastError: string | null;
  finishedAt: string | null;
  createdAt: string;
}

export interface DeliveryLogDTO {
  id: number;
  playgroundId: string | null;
  channelId: string;
  status: DeliveryStatus;
  httpStatus: number | null;
  discordMessageId: string | null;
  errorCode: string | null;
  errorMessage: string | null;
  latencyMs: number | null;
  attempt: number | null;
  createdAt: string;
}

export interface AuditLogDTO {
  id: number;
  actorType: ActorType;
  actorId: string | null;
  action: string;
  targetType: string | null;
  targetId: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface PaginatedResult<T> {
  items: T[];
  nextCursor: string | number | null;
}

export type ContinuousType = 'onliner' | 'vc' | 'typer';
export type ContinuousStatus = 'pending' | 'active' | 'paused' | 'expired' | 'error';

export interface ContinuousServiceDTO {
  id: string;
  userId: string;
  accountId: string;
  serviceType: ContinuousType;
  config: Record<string, unknown>;
  status: ContinuousStatus;
  startsAt: string;
  expiresAt: string;
  lastSeenAt: string | null;
  lastError: string | null;
  lastErrorAt: string | null;
  stoppedAt: string | null;
}

export interface UpdateDTO {
  id: string;
  title: string;
  body: string;
  version: string | null;
  tags: string[];
  published_at: string;
  }
