import type { DiscordAccountDTO } from '@app/shared';
import { getServiceClient } from '../client-service.js';
import type { Database } from '../types.generated.js';

type AccountRow = Database['public']['Tables']['discord_accounts']['Row'];

export interface EncryptedTokenBundle {
  ciphertext: Uint8Array;
  iv: Uint8Array;
  tag: Uint8Array;
  keyVersion: number;
}

export interface StoredTokenBundle extends EncryptedTokenBundle {
  id: string;
  userId: string;
  status: 'active' | 'invalid' | 'checking' | 'removed';
}

export function toAccountDTO(row: AccountRow): DiscordAccountDTO {
  return {
    id: row.id,
    label: row.label,
    discordUserId: row.discord_user_id,
    username: row.username,
    globalName: row.global_name,
    avatarUrl: row.avatar_url,
    status: row.status,
    lastValidatedAt: row.last_validated_at,
    lastError: row.last_error,
    lastErrorAt: row.last_error_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export interface CreateAccountInput {
  userId: string;
  label: string;
  discordUserId: string;
  username: string;
  globalName: string | null;
  avatarUrl: string | null;
  token: EncryptedTokenBundle;
  fingerprint: string;
}

export async function insertAccount(input: CreateAccountInput): Promise<DiscordAccountDTO> {
  const { data, error } = await getServiceClient()
    .from('discord_accounts')
    .insert({
      user_id: input.userId,
      label: input.label,
      discord_user_id: input.discordUserId,
      username: input.username,
      global_name: input.globalName,
      avatar_url: input.avatarUrl,
      token_ciphertext: Buffer.from(input.token.ciphertext).toString('base64'),
      token_iv: Buffer.from(input.token.iv).toString('base64'),
      token_tag: Buffer.from(input.token.tag).toString('base64'),
      key_version: input.token.keyVersion,
      token_fingerprint: input.fingerprint,
      status: 'active',
      last_validated_at: new Date().toISOString(),
    })
    .select('*')
    .single();

  if (error) throw error;
  return toAccountDTO(data);
}

export async function listAccountsForUser(userId: string): Promise<DiscordAccountDTO[]> {
  const { data, error } = await getServiceClient()
    .from('discord_accounts')
    .select('*')
    .eq('user_id', userId)
    .neq('status', 'removed')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map(toAccountDTO);
}

export async function getAccountById(
  accountId: string,
  userId: string,
): Promise<DiscordAccountDTO | null> {
  const { data, error } = await getServiceClient()
    .from('discord_accounts')
    .select('*')
    .eq('id', accountId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  return data ? toAccountDTO(data) : null;
}

export async function getAccountTokenBundle(
  accountId: string,
): Promise<StoredTokenBundle | null> {
  const { data, error } = await getServiceClient()
    .from('discord_accounts')
    .select('id, user_id, token_ciphertext, token_iv, token_tag, key_version, status')
    .eq('id', accountId)
    .neq('status', 'removed')
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return {
    id: data.id,
    userId: data.user_id,
    ciphertext: Buffer.from(data.token_ciphertext, 'base64'),
    iv: Buffer.from(data.token_iv, 'base64'),
    tag: Buffer.from(data.token_tag, 'base64'),
    keyVersion: data.key_version,
    status: data.status,
  };
}

export async function updateAccountLabel(
  accountId: string,
  userId: string,
  label: string,
): Promise<DiscordAccountDTO | null> {
  const { data, error } = await getServiceClient()
    .from('discord_accounts')
    .update({ label })
    .eq('id', accountId)
    .eq('user_id', userId)
    .select('*')
    .maybeSingle();

  if (error) throw error;
  return data ? toAccountDTO(data) : null;
}

export async function setAccountValidationStatus(
  accountId: string,
  status: 'active' | 'invalid' | 'checking',
  error?: string | null,
): Promise<void> {
  const now = new Date().toISOString();
  const { error: dbError } = await getServiceClient()
    .from('discord_accounts')
    .update({
      status,
      last_validated_at: now,
      last_error: error ?? null,
      last_error_at: error ? now : null,
    })
    .eq('id', accountId);

  if (dbError) throw dbError;
}

export async function softDeleteAccount(accountId: string, userId: string): Promise<boolean> {
  const { data, error } = await getServiceClient()
    .from('discord_accounts')
    .update({ status: 'removed', removed_at: new Date().toISOString() })
    .eq('id', accountId)
    .eq('user_id', userId)
    .select('id')
    .maybeSingle();

  if (error) throw error;
  return Boolean(data);
}

export async function findByFingerprint(
  userId: string,
  fingerprint: string,
): Promise<DiscordAccountDTO | null> {
  const { data, error } = await getServiceClient()
    .from('discord_accounts')
    .select('*')
    .eq('user_id', userId)
    .eq('token_fingerprint', fingerprint)
    .maybeSingle();

  if (error) throw error;
  return data ? toAccountDTO(data) : null;
}