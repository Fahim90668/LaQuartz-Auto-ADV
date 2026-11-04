import {
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
  type SlashCommandOptionsOnlyBuilder,
} from 'discord.js';
import type { CodeDuration } from '@app/shared';
import { createCode } from '../services/code.service.js';
import { recordBotAudit } from '../services/audit.service.js';
import { formatDurationLabel } from '../lib/format.js';
import { successEmbed, errorEmbed } from '../lib/embeds.js';

export const data: SlashCommandOptionsOnlyBuilder = new SlashCommandBuilder()
  .setName('create-code')
  .setDescription('Create a new redeem code (admin only).')
  .addStringOption((opt) =>
    opt
      .setName('time')
      .setDescription('Lifetime of the code.')
      .setRequired(true)
      .addChoices(
        { name: 'Lifetime', value: 'lifetime' },
        { name: '1 Month (30 days)', value: '1m' },
        { name: '3 Months (90 days)', value: '3m' },
      ),
  )
  .addIntegerOption((opt) =>
    opt
      .setName('playground')
      .setDescription('Maximum number of playgrounds this code allows (1–50).')
      .setRequired(true)
      .setMinValue(1)
      .setMaxValue(50),
  )
  .addStringOption((opt) =>
    opt
      .setName('note')
      .setDescription('Optional note for internal tracking.')
      .setRequired(false)
      .setMaxLength(200),
  )
  .setDMPermission(false);

export async function execute(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  const duration = interaction.options.getString('time', true) as CodeDuration;
  const playgroundLimit = interaction.options.getInteger('playground', true);
  const note = interaction.options.getString('note') ?? undefined;

  await interaction.deferReply({ ephemeral: true });

  try {
    const result = await createCode({
      duration,
      playgroundLimit,
      adminDiscordId: interaction.user.id,
      note,
    });

    await recordBotAudit({
      adminDiscordId: interaction.user.id,
      action: 'code.create',
      targetType: 'redeem_code',
      targetId: result.codeId,
      metadata: {
        duration: result.duration,
        playgroundLimit: result.playgroundLimit,
        preview: result.preview,
        source: 'discord-bot',
      },
    });

    const embed = successEmbed('✅ Redeem Code Created')
      .addFields(
        { name: 'Code', value: `\`\`\`\n${result.code}\n\`\`\``, inline: false },
        {
          name: 'Duration',
          value: formatDurationLabel(result.duration),
          inline: true,
        },
        {
          name: 'Playgrounds',
          value: String(result.playgroundLimit),
          inline: true,
        },
        { name: 'Code ID', value: `\`${result.codeId}\``, inline: false },
      )
      .setFooter({
        text: 'Redeem at the web panel · This message is only visible to you.',
      });

    if (note) embed.addFields({ name: 'Note', value: note, inline: false });

    await interaction.editReply({ embeds: [embed] });
  } catch (err) {
    const message = (err as Error).message || 'Failed to create code.';
    await interaction.editReply({
      embeds: [errorEmbed('❌ Code Creation Failed', message)],
    });
  }
}