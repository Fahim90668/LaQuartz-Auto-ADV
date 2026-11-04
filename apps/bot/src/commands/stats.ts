import {
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
  type SlashCommandOptionsOnlyBuilder,
} from 'discord.js';
import { getServiceClient } from '@app/db';
import { brandEmbed } from '../lib/embeds.js';

export const data: SlashCommandOptionsOnlyBuilder = new SlashCommandBuilder()
  .setName('stats')
  .setDescription('Show platform stats (admin only).')
  .setDMPermission(false);

export async function execute(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  await interaction.deferReply({ ephemeral: true });

  const db = getServiceClient();

  const [users, codes, activeCodes, playgrounds, running, jobs24h, failed24h] =
    await Promise.all([
      db.from('profiles').select('id', { count: 'exact', head: true }),
      db.from('redeem_codes').select('id', { count: 'exact', head: true }),
      db
        .from('redeem_codes')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'active'),
      db.from('playgrounds').select('id', { count: 'exact', head: true }),
      db
        .from('playgrounds')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'running'),
      db
        .from('delivery_logs')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', new Date(Date.now() - 86_400_000).toISOString()),
      db
        .from('delivery_logs')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'failed')
        .gte('created_at', new Date(Date.now() - 86_400_000).toISOString()),
    ]);

  const embed = brandEmbed('📊 Platform Stats').addFields(
    { name: 'Users', value: String(users.count ?? 0), inline: true },
    { name: 'Codes (total)', value: String(codes.count ?? 0), inline: true },
    { name: 'Codes (active)', value: String(activeCodes.count ?? 0), inline: true },
    { name: 'Playgrounds', value: String(playgrounds.count ?? 0), inline: true },
    { name: 'Running', value: String(running.count ?? 0), inline: true },
    { name: '───────', value: '**Last 24h**', inline: false },
    { name: 'Sends', value: String(jobs24h.count ?? 0), inline: true },
    { name: 'Failed', value: String(failed24h.count ?? 0), inline: true },
  );

  await interaction.editReply({ embeds: [embed] });
}