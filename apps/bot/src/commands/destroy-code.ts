import {
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
  type SlashCommandOptionsOnlyBuilder,
} from 'discord.js';
import { destroyCode } from '../services/code.service.js';
import { recordBotAudit } from '../services/audit.service.js';
import { successEmbed, errorEmbed, warningEmbed } from '../lib/embeds.js';

export const data: SlashCommandOptionsOnlyBuilder = new SlashCommandBuilder()
  .setName('destroy-code')
  .setDescription('Destroy a redeem code and revoke access (admin only).')
  .addStringOption((opt) =>
    opt
      .setName('code')
      .setDescription('The full code to destroy (e.g. ADVT-XXXX-XXXX-XXXX).')
      .setRequired(true)
      .setMinLength(19)
      .setMaxLength(19),
  )
  .setDMPermission(false);

export async function execute(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  const code = interaction.options.getString('code', true);

  await interaction.deferReply({ ephemeral: true });

  try {
    const result = await destroyCode(code, interaction.user.id);

    if (!result.found) {
      await interaction.editReply({
        embeds: [
          warningEmbed(
            '⚠️ Code Not Found',
            'No code matches that value. It may have been mistyped or already destroyed.',
          ),
        ],
      });
      return;
    }

    await recordBotAudit({
      adminDiscordId: interaction.user.id,
      action: 'code.destroy',
      targetType: 'redeem_code',
      targetId: code,
      metadata: {
        affectedEntitlements: result.affectedEntitlements,
        stoppedPlaygrounds: result.stoppedPlaygrounds,
        source: 'discord-bot',
      },
    });

    const embed = successEmbed('🗑️ Code Destroyed')
      .addFields(
        { name: 'Code', value: `\`${code}\``, inline: false },
        {
          name: 'Entitlements Revoked',
          value: String(result.affectedEntitlements),
          inline: true,
        },
        {
          name: 'Playgrounds Stopped',
          value: String(result.stoppedPlaygrounds),
          inline: true,
        },
      )
      .setFooter({
        text:
          result.affectedEntitlements > 0
            ? 'The user will lose access immediately and their playgrounds are paused.'
            : 'No active entitlements were tied to this code.',
      });

    await interaction.editReply({ embeds: [embed] });
  } catch (err) {
    const message = (err as Error).message || 'Failed to destroy code.';
    await interaction.editReply({
      embeds: [errorEmbed('❌ Destruction Failed', message)],
    });
  }
}
