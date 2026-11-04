import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types.generated.js';

export type UserClient = SupabaseClient<Database>;

export function createUserClient(accessToken: string): UserClient {
  const url = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;

  if (!url) throw new Error('SUPABASE_URL is not set.');
  if (!anonKey) throw new Error('SUPABASE_ANON_KEY is not set.');

  return createClient<Database>(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'X-Client-Info': 'discord-auto-advertiser/user',
      },
    },
  });
}