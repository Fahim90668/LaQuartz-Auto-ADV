#!/usr/bin/env tsx
/**
 * Creates a demo admin, a redeem code, and a stub playground against LOCAL
 * Supabase. NEVER run against production.
 */

import { createClient } from '@supabase/supabase-js';
import { randomBytes, createHmac } from 'node:crypto';

function requireLocal(url: string) {
  if (!/127\.0\.0\.1|localhost/.test(url)) {
    throw new Error('Refusing to seed a non-local Supabase instance.');
  }
}

async function main() {
  const url = process.env.SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  requireLocal(url);

  const db = createClient(url, key, { auth: { persistSession: false } });

  const demoDiscordId = '000000000000000001';
  const demoEmail = 'demo@local.test';

  console.log('▶ Creating demo auth user...');
  const { data: userRes, error: userErr } = await db.auth.admin.createUser({
    email: demoEmail,
    email_confirm: true,
    user_metadata: {
      provider_id: demoDiscordId,
      user_name: 'DemoAdmin',
      full_name: 'Demo Admin',
    },
  });
  if (userErr && !/already registered/.test(userErr.message)) throw userErr;
  const userId = userRes?.user?.id;
  if (!userId) throw new Error('Could not resolve demo user id');

  await db.from('profiles').update({ role: 'admin' }).eq('id', userId);

  console.log('▶ Creating redeem code...');
  const secret = process.env.CODE_HASH_SECRET ?? 'dev-secret';
  const plain = 'ADVT-' + randomBytes(6).toString('hex').slice(0, 12).toUpperCase();
  const hash = createHmac('sha256', secret).update(plain.toUpperCase()).digest('hex');

  const { error: codeErr } = await db.from('redeem_codes').insert({
    code_hash: hash,
    code_preview: `ADVT-****-${plain.slice(-4)}`,
    duration: '3m',
    duration_days: 90,
    playground_limit: 3,
    status: 'active',
    note: 'seeded demo code',
    created_by_discord_id: 'system',
  });
  if (codeErr) throw codeErr;

  console.log(`✓ Demo code: ${plain}`);
  console.log(`✓ Demo user id: ${userId}`);
  console.log(`✓ Demo email: ${demoEmail}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});