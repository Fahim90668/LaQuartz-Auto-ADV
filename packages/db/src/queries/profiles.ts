import type { ProfileDTO } from '@app/shared';
import { getServiceClient } from '../client-service.js';
import type { Database } from '../types.generated.js';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];

export function toProfileDTO(row: ProfileRow): ProfileDTO {
  return {
    id: row.id,
    discordId: row.discord_id,
    username: row.username,
    globalName: row.global_name,
    discriminator: row.discriminator,
    email: row.email,
    avatarUrl: row.avatar_url,
    role: row.role,
    isBanned: row.is_banned,
    lastLoginAt: row.last_login_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getProfileById(id: string): Promise<ProfileDTO | null> {
  const { data, error } = await getServiceClient()
    .from('profiles')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data ? toProfileDTO(data) : null;
}

export async function getProfileByDiscordId(discordId: string): Promise<ProfileDTO | null> {
  const { data, error } = await getServiceClient()
    .from('profiles')
    .select('*')
    .eq('discord_id', discordId)
    .maybeSingle();

  if (error) throw error;
  return data ? toProfileDTO(data) : null;
}

export async function touchLastLogin(id: string): Promise<void> {
  const { error } = await getServiceClient()
    .from('profiles')
    .update({ last_login_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw error;
}

export async function setRole(id: string, role: 'user' | 'admin'): Promise<void> {
  const { error } = await getServiceClient()
    .from('profiles')
    .update({ role })
    .eq('id', id);

  if (error) throw error;
}