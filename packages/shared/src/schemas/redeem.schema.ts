import { z } from 'zod';
import { REDEEM_CODE_PATTERN } from '../constants.js';

export const redeemCodeInputSchema = z
  .object({
    code: z
      .string()
      .trim()
      .toUpperCase()
      .regex(REDEEM_CODE_PATTERN, 'Code format looks invalid.'),
  })
  .strict();

export type RedeemCodeInput = z.infer<typeof redeemCodeInputSchema>;

export const createCodeInputSchema = z
  .object({
    duration: z.enum(['lifetime', '1m', '3m']),
    playgroundLimit: z.number().int().min(1).max(50),
    adminDiscordId: z.string().regex(/^\d{17,20}$/, 'Invalid Discord ID.'),
    note: z.string().trim().max(200).optional(),
  })
  .strict();

export type CreateCodeInput = z.infer<typeof createCodeInputSchema>;

export const destroyCodeInputSchema = z
  .object({
    code: z.string().trim().toUpperCase().min(1),
    adminDiscordId: z.string().regex(/^\d{17,20}$/, 'Invalid Discord ID.'),
  })
  .strict();

export type DestroyCodeInput = z.infer<typeof destroyCodeInputSchema>;