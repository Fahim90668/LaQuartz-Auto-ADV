import { z } from 'zod';

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().min(1).max(65535).default(4000),
    HOST: z.string().default('0.0.0.0'),
    LOG_LEVEL: z
      .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
      .default('info'),

    SUPABASE_URL: z.string().url(),
    SUPABASE_ANON_KEY: z.string().min(1),
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
    SUPABASE_JWT_SECRET: z.string().min(20),

    DISCORD_CLIENT_ID: z.string().min(1),
    DISCORD_CLIENT_SECRET: z.string().min(1),
    DISCORD_OAUTH_REDIRECT_URI: z.string().url(),
    DISCORD_GUILD_INVITE: z.string().url(),

    WEB_BASE_URL: z.string().url(),

    TOKEN_ENC_KEY_V1: z.string().optional(),
    TOKEN_ENC_KEY_V2: z.string().optional(),
    TOKEN_ENC_KEY_V3: z.string().optional(),
    CODE_HASH_SECRET: z.string().min(32),
    TOKEN_FP_SECRET: z.string().min(32),
  })
  .superRefine((env, ctx) => {
    const hasKey = Boolean(
      env.TOKEN_ENC_KEY_V1 || env.TOKEN_ENC_KEY_V2 || env.TOKEN_ENC_KEY_V3,
    );
    if (!hasKey) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'At least one TOKEN_ENC_KEY_V* must be set.',
        path: ['TOKEN_ENC_KEY_V1'],
      });
    }
  });

export type Env = z.infer<typeof envSchema>;

let cached: Env | null = null;

export function loadEnv(): Env {
  if (cached) return cached;
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error('Invalid environment configuration:');
    console.error(parsed.error.flatten().fieldErrors);
    throw new Error('Invalid environment configuration.');
  }
  cached = parsed.data;
  return cached;
}

export function getEnv(): Env {
  return loadEnv();
}