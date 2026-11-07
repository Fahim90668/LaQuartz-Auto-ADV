import {
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
  type SlashCommandOptionsOnlyBuilder,
} from 'discord.js';
import { normalizeRedeemCode } from '@app/crypto';
import { getServiceClient } from '@app/db';
import { brandEmbed, warningEmbed } from '../lib/embeds.js';
import { formatDate } from '../lib/format.js';

export const data: SlashCommandOptionsOnlyBuilder = new SlashCommandBuilder()
  .setName('code-info')
  .setDescription('Show metadata for a code (admin only).')
  .addStringOption((opt) =>
    opt
      .setName('code')
      .setDescription('Full code value.')
      .setRequired(true)
      .setMinLength(19)
      .setMaxLength(19),
  )
  .setDMPermission(false);

export async function execute(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  const code = normalizeRedeemCode(interaction.options.getString('code', true));

  await interaction.deferReply({ ephemeral: true });

  const db = getServiceClient();
  const { data, error } = await db
    .from('redeem_codes')
    .select(
      'id, code_preview, duration, duration_days, playground_limit, status, redeemed_at, expires_at, destroyed_at, created_at, note',
    )
    .eq('code_preview', `ADVT-****-${code.slice(-4)}`)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    await interaction.editReply({
      embeds: [warningEmbed('⚠️ Lookup Failed', error.message)],
    });
    return;
  }

  if (!data) {
    await interaction.editReply({
      embeds: [
        warningEmbed(
          '⚠️ Code Not Found',
          'The code suffix does not match any known code. Note: only the last 4 characters are searchable.',
        ),
      ],
    });
    return;
  }

  const embed = brandEmbed('🔍 Code Details')
    .addFields(
      { name: 'Preview', value: `\`${data.code_preview}\``, inline: true },
      { name: 'Status', value: `\`${data.status}\``, inline: true },
      { name: 'Duration', value: `\`${data.duration}\``, inline: true },
      {
        name: 'Playgrounds',
        value: String(data.playground_limit),
        inline: true,
      },
      { name: 'Created', value: formatDate(data.created_at), inline: false },
      {
        name: 'Redeemed',
        value: formatDate(data.redeemed_at),
        inline: true,
      },
      { name: 'Expires', value: formatDate(data.expires_at), inline: true },
      {
        name: 'Destroyed',
        value: formatDate(data.destroyed_at),
        inline: true,
      },
    );

  if (data.note) {
    embed.addFields({ name: 'Note', value: data.note, inline: false });
  }

  await interaction.editReply({ embeds: [embed] });
    }
