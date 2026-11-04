import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
    .default('info'),

  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),

  DISCORD_BOT_TOKEN: z.string().min(1),
  DISCORD_GUILD_ID: z.string().regex(/^\d{17,20}$/),

  DISCORD_ADMIN_ROLE_IDS: z
    .string()
    .default('')
    .transform((s) =>
      s
        .split(',')
        .map((v) => v.trim())
        .filter((v) => /^\d{17,20}$/.test(v)),
    ),
  DISCORD_ADMIN_USER_IDS: z
    .string()
    .default('')
    .transform((s) =>
      s
        .split(',')
        .map((v) => v.trim())
        .filter((v) => /^\d{17,20}$/.test(v)),
    ),

  CODE_HASH_SECRET: z.string().min(32),
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
  if (
    parsed.data.DISCORD_ADMIN_ROLE_IDS.length === 0 &&
    parsed.data.DISCORD_ADMIN_USER_IDS.length === 0
  ) {
    throw new Error(
      'At least one DISCORD_ADMIN_ROLE_IDS or DISCORD_ADMIN_USER_IDS must be set.',
    );
  }
  cached = parsed.data;
  return cached;
}

export function getEnv(): Env {
  return loadEnv();
}