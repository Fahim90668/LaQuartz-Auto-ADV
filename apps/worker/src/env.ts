import { z } from 'zod';

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    LOG_LEVEL: z
      .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
      .default('info'),

    SUPABASE_URL: z.string().url(),
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),

    TOKEN_ENC_KEY_V1: z.string().optional(),
    TOKEN_ENC_KEY_V2: z.string().optional(),
    TOKEN_ENC_KEY_V3: z.string().optional(),
    TOKEN_FP_SECRET: z.string().min(32),
    CODE_HASH_SECRET: z.string().min(32),

    WORKER_ID: z.string().min(1).default('worker-1'),
    WORKER_POLL_MS: z.coerce.number().int().min(200).max(60_000).default(1000),
    WORKER_CONCURRENCY: z.coerce.number().int().min(1).max(50).default(10),
    WORKER_VERSION: z.string().default('1.0.0'),

    DISCORD_USER_AGENT: z.string().optional(),
    DISCORD_SUPER_PROPERTIES: z.string().optional(),
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