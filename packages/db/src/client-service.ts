import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types.generated.js';

export type ServiceClient = SupabaseClient<Database>;

let cached: ServiceClient | null = null;

export function getServiceClient(): ServiceClient {
  if (cached) return cached;

  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) throw new Error('SUPABASE_URL is not set.');
  if (!serviceKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set.');

  cached = createClient<Database>(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { 'X-Client-Info': 'discord-auto-advertiser/service' } },
  });

  return cached;
}

export function createServiceClient(url: string, serviceKey: string): ServiceClient {
  return createClient<Database>(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export function resetServiceClientForTests(): void {
  cached = null;
}