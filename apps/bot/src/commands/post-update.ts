import {
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
  type SlashCommandOptionsOnlyBuilder,
} from 'discord.js';
import { getServiceClient } from '@app/db';
import { successEmbed, errorEmbed } from '../lib/embeds.js';

export const data: SlashCommandOptionsOnlyBuilder = new SlashCommandBuilder()
  .setName('post-update')
  .setDescription("Publish a What's New entry (admin only).")
  .addStringOption((opt) =>
    opt
      .setName('title')
      .setDescription('Short headline (max 200 chars)')
      .setRequired(true)
      .setMaxLength(200),
  )
  .addStringOption((opt) =>
    opt
      .setName('body')
      .setDescription('Body text (max 4000 chars)')
      .setRequired(true)
      .setMaxLength(4000),
  )
  .addStringOption((opt) =>
    opt
      .setName('version')
      .setDescription('Version tag (e.g. 1.4.0)')
      .setRequired(false)
      .setMaxLength(30),
  )
  .addStringOption((opt) =>
    opt
      .setName('tags')
      .setDescription('Comma-separated tags (e.g. feature,fix)')
      .setRequired(false)
      .setMaxLength(200),
  )
  .setDMPermission(false);

export async function execute(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  const title = interaction.options.getString('title', true);
  const body = interaction.options.getString('body', true);
  const version = interaction.options.getString('version');
  const tagsRaw = interaction.options.getString('tags');

  const tags = (tagsRaw ?? '')
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 10);

  await interaction.deferReply({ ephemeral: true });

  try {
    const { data, error } = await getServiceClient()
      .from('updates')
      .insert({
        title,
        body,
        version: version || null,
        tags,
        created_by: interaction.user.id,
      })
      .select('id')
      .single();

    if (error) throw error;

    const embed = successEmbed('📣 Published').addFields(
      { name: 'Title', value: title, inline: false },
      { name: 'Version', value: version || '—', inline: true },
      { name: 'Tags', value: tags.length ? tags.join(', ') : '—', inline: true },
      { name: 'ID', value: `\`${data.id}\``, inline: false },
    );

    await interaction.editReply({ embeds: [embed] });
  } catch (err) {
    await interaction.editReply({
      embeds: [errorEmbed('❌ Publish failed', (err as Error).message)],
    });
  }
  }
