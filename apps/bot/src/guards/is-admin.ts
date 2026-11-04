import type { GuildMember, Interaction } from 'discord.js';
import type { Env } from '../env.js';

export interface AdminCheckResult {
  isAdmin: boolean;
  reason?: string;
}

export function isAdmin(
  member: GuildMember | null,
  userId: string,
  env: Env,
): AdminCheckResult {
  if (env.DISCORD_ADMIN_USER_IDS.includes(userId)) {
    return { isAdmin: true };
  }

  if (!member) {
    return { isAdmin: false, reason: 'Could not resolve guild member.' };
  }

  if (env.DISCORD_ADMIN_ROLE_IDS.length === 0) {
    return { isAdmin: false, reason: 'No admin roles configured.' };
  }

  const hasRole = env.DISCORD_ADMIN_ROLE_IDS.some((roleId) =>
    member.roles.cache.has(roleId),
  );

  if (hasRole) {
    return { isAdmin: true };
  }

  return {
    isAdmin: false,
    reason: 'You need an admin role to use this command.',
  };
}

export function ensureAdmin(interaction: Interaction, env: Env): AdminCheckResult {
  if (!interaction.inGuild() || !interaction.guild) {
    return { isAdmin: false, reason: 'This command is only available in a server.' };
  }
  return isAdmin(interaction.member as GuildMember | null, interaction.user.id, env);
}