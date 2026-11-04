import { z } from 'zod';
import {
  MAX_MESSAGE_LENGTH,
  MAX_MESSAGES_PER_PLAYGROUND,
  MIN_MESSAGE_LENGTH,
  UUID_PATTERN,
} from '../constants.js';

export const messageContentSchema = z
  .string()
  .trim()
  .min(MIN_MESSAGE_LENGTH, 'Message cannot be empty.')
  .max(MAX_MESSAGE_LENGTH, `Message must be at most ${MAX_MESSAGE_LENGTH} characters.`);

export const messagePositionSchema = z
  .number()
  .int()
  .min(0)
  .max(MAX_MESSAGES_PER_PLAYGROUND - 1);

export const addMessageSchema = z
  .object({
    content: messageContentSchema,
    position: messagePositionSchema.optional(),
  })
  .strict();

export type AddMessageInput = z.infer<typeof addMessageSchema>;

export const updateMessageSchema = z
  .object({
    content: messageContentSchema.optional(),
    position: messagePositionSchema.optional(),
    isActive: z.boolean().optional(),
  })
  .strict();

export type UpdateMessageInput = z.infer<typeof updateMessageSchema>;

export const messageIdParamSchema = z
  .object({
    id: z.string().regex(UUID_PATTERN, 'Invalid playground ID.'),
    messageId: z.string().regex(UUID_PATTERN, 'Invalid message ID.'),
  })
  .strict();

export type MessageIdParam = z.infer<typeof messageIdParamSchema>;