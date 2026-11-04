#!/usr/bin/env tsx
/**
 * Re-encrypts every Discord account token under the current key version.
 * Run AFTER adding the new key (TOKEN_ENC_KEY_V2) and BEFORE removing the old.
 *
 * Usage:
 *   TOKEN_ENC_KEY_V1=<old> TOKEN_ENC_KEY_V2=<new> pnpm key:rotate
 */

import { createClient } from '@supabase/supabase-js';
import { loadKeyRing, encryptToken, decryptToken } from '../../packages/crypto/src/index.js';

const CURRENT_VERSION = Number(process.env.TOKEN_KEY_VERSION ?? 2);
const PAGE_SIZE = 100;

async function main() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error('✗ SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
    process.exit(1);
  }

  const db = createClient(url, key, { auth: { persistSession: false } });
  const keyring = loadKeyRing();

  console.log(`▶ Rotating to key version ${CURRENT_VERSION}`);
  console.log(`  Keyring loaded: [${keyring.availableVersions.join(', ')}]`);

  let offset = 0;
  let total = 0;
  let rotated = 0;
  let failed = 0;

  while (true) {
    const { data, error } = await db
      .from('discord_accounts')
      .select('id, token_ciphertext, token_iv, token_tag, key_version')
      .neq('status', 'removed')
      .range(offset, offset + PAGE_SIZE - 1);

    if (error) throw error;
    if (!data || data.length === 0) break;
    total += data.length;

    for (const row of data) {
      if (row.key_version === CURRENT_VERSION) {
        rotated++;
        continue;
      }
      try {
        const plaintext = decryptToken(
          {
            ciphertext: Buffer.from(row.token_ciphertext as string, 'base64'),
            iv: Buffer.from(row.token_iv as string, 'base64'),
            tag: Buffer.from(row.token_tag as string, 'base64'),
            keyVersion: row.key_version as number,
          },
          keyring,
        );
        const reenc = encryptToken(plaintext, keyring, CURRENT_VERSION);
        const { error: updErr } = await db
          .from('discord_accounts')
          .update({
            token_ciphertext: reenc.ciphertext.toString('base64'),
            token_iv: reenc.iv.toString('base64'),
            token_tag: reenc.tag.toString('base64'),
            key_version: CURRENT_VERSION,
            updated_at: new Date().toISOString(),
          })
          .eq('id', row.id);
        if (updErr) throw updErr;
        rotated++;
        process.stdout.write(`\r  progress: ${rotated}/${total}`);
      } catch (err) {
        failed++;
        console.error(`\n✗ Failed on account ${row.id}:`, (err as Error).message);
      }
    }

    offset += PAGE_SIZE;
  }

  console.log(`\n✓ Done. Total: ${total}, Rotated: ${rotated}, Failed: ${failed}`);
  if (failed > 0) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});