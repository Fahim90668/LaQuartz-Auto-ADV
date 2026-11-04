import { z } from 'zod';
import {
  MAX_LABEL_LENGTH,
  MAX_TOKEN_LENGTH,
  MIN_LABEL_LENGTH,
  MIN_TOKEN_LENGTH,
  TOKEN_PATTERN,
  UUID_PATTERN,
} from '../constants.js';

export const accountLabelSchema = z
  .string()
  .trim()
  .min(MIN_LABEL_LENGTH, 'Label is required.')
  .max(MAX_LABEL_LENGTH, `Label must be at most ${MAX_LABEL_LENGTH} characters.`);

export const accountTokenSchema = z
  .string()
  .trim()
  .min(MIN_TOKEN_LENGTH, `Token must be at least ${MIN_TOKEN_LENGTH} characters.`)
  .max(MAX_TOKEN_LENGTH, `Token must be at most ${MAX_TOKEN_LENGTH} characters.`)
  .regex(TOKEN_PATTERN, 'Token contains invalid characters.');

export const createAccountSchema = z
  .object({
    label: accountLabelSchema,
    token: accountTokenSchema,
  })
  .strict();

export type CreateAccountInput = z.infer<typeof createAccountSchema>;

export const updateAccountLabelSchema = z
  .object({
    label: accountLabelSchema,
  })
  .strict();

export type UpdateAccountLabelInput = z.infer<typeof updateAccountLabelSchema>;

export const accountIdParamSchema = z
  .object({
    id: z.string().regex(UUID_PATTERN, 'Invalid account ID.'),
  })
  .strict();

export type AccountIdParam = z.infer<typeof accountIdParamSchema>;