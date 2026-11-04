import { z } from 'zod';
import {
  MAX_CHANNELS_PER_PLAYGROUND,
  MAX_INTERVAL_SECONDS,
  MAX_MESSAGES_PER_PLAYGROUND,
  MAX_MESSAGE_LENGTH,
  MAX_PLAYGROUND_NAME_LENGTH,
  MIN_INTERVAL_SECONDS,
  MIN_MESSAGE_LENGTH,
  MIN_PLAYGROUND_NAME_LENGTH,
  SNOWFLAKE_PATTERN,
  UUID_PATTERN,
} from '../constants.js';

export const playgroundNameSchema = z
  .string()
  .trim()
  .min(MIN_PLAYGROUND_NAME_LENGTH, 'Name is required.')
  .max(
    MAX_PLAYGROUND_NAME_LENGTH,
    `Name must be at most ${MAX_PLAYGROUND_NAME_LENGTH} characters.`,
  );

export const playgroundModeSchema = z.enum(['manual', 'slowmode']);

export const intervalSecondsSchema = z
  .number()
  .int('Interval must be an integer.')
  .min(MIN_INTERVAL_SECONDS, `Interval must be at least ${MIN_INTERVAL_SECONDS}s.`)
  .max(MAX_INTERVAL_SECONDS, `Interval must be at most ${MAX_INTERVAL_SECONDS}s.`);

export const channelInputSchema = z
  .object({
    serverId: z.string().regex(SNOWFLAKE_PATTERN, 'Invalid server ID.'),
    channelId: z.string().regex(SNOWFLAKE_PATTERN, 'Invalid channel ID.'),
    serverName: z.string().trim().max(100).optional(),
    channelName: z.string().trim().max(100).optional(),
  })
  .strict();

export type ChannelInput = z.infer<typeof channelInputSchema>;

export const messageInputSchema = z
  .object({
    content: z
      .string()
      .trim()
      .min(MIN_MESSAGE_LENGTH, 'Message cannot be empty.')
      .max(MAX_MESSAGE_LENGTH, `Message must be at most ${MAX_MESSAGE_LENGTH} characters.`),
  })
  .strict();

export type MessageInput = z.infer<typeof messageInputSchema>;

export const createPlaygroundSchema = z
  .object({
    accountId: z.string().regex(UUID_PATTERN, 'Invalid account ID.'),
    name: playgroundNameSchema,
    mode: playgroundModeSchema.default('manual'),
    intervalSeconds: intervalSecondsSchema.default(300),
    channels: z
      .array(channelInputSchema)
      .min(1, 'At least one channel is required.')
      .max(
        MAX_CHANNELS_PER_PLAYGROUND,
        `Maximum ${MAX_CHANNELS_PER_PLAYGROUND} channels per playground.`,
      ),
    messages: z
      .array(messageInputSchema)
      .min(1, 'At least one message is required.')
      .max(
        MAX_MESSAGES_PER_PLAYGROUND,
        `Maximum ${MAX_MESSAGES_PER_PLAYGROUND} messages per playground.`,
      ),
  })
  .strict();

export type CreatePlaygroundInput = z.infer<typeof createPlaygroundSchema>;

export const updatePlaygroundSchema = z
  .object({
    name: playgroundNameSchema.optional(),
    mode: playgroundModeSchema.optional(),
    intervalSeconds: intervalSecondsSchema.optional(),
  })
  .strict();

export type UpdatePlaygroundInput = z.infer<typeof updatePlaygroundSchema>;

export const playgroundIdParamSchema = z
  .object({
    id: z.string().regex(UUID_PATTERN, 'Invalid playground ID.'),
  })
  .strict();

export type PlaygroundIdParam = z.infer<typeof playgroundIdParamSchema>;

export const playgroundChannelParamSchema = z
  .object({
    id: z.string().regex(UUID_PATTERN, 'Invalid playground ID.'),
    channelId: z.string().regex(SNOWFLAKE_PATTERN, 'Invalid channel ID.'),
  })
  .strict();

export type PlaygroundChannelParam = z.infer<typeof playgroundChannelParamSchema>;