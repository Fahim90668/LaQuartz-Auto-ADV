import {
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
  type SlashCommandOptionsOnlyBuilder,
} from 'discord.js';
import type { CodeDuration } from '@app/shared';
import { createCode } from '../services/code.service.js';
import { recordBotAudit } from '../services/audit.service.js';
import { successEmbed, errorEmbed } from '../lib/embeds.js';

const FEATURE_CHOICES = [
  { name: 'Onliner only', value: 'onliner' },
  { name: 'VC only', value: 'vc' },
  { name: 'Typer only', value: 'typer' },
  { name: 'Onliner + VC', value: 'onliner+vc' },
  { name: 'Onliner + Typer', value: 'onliner+typer' },
  { name: 'VC + Typer', value: 'vc+typer' },
  { name: 'All three (Onliner + VC + Typer)', value: 'onliner+vc+typer' },
] as const;

export const data: SlashCommandOptionsOnlyBuilder = new SlashCommandBuilder()
  .setName('create-code')
  .setDescription('Create a new redeem code (admin only).')
  .addStringOption((opt) =>
    opt
      .setName('time')
      .setDescription('Duration: "lifetime" or a number of days (7-365)')
      .setRequired(true)
      .setMinLength(2)
      .setMaxLength(10),
  )
  .addIntegerOption((opt) =>
    opt
      .setName('playground')
      .setDescription('Max playgrounds this code allows (1-50)')
      .setRequired(true)
      .setMinValue(1)
      .setMaxValue(50),
  )
  .addStringOption((opt) =>
    opt
      .setName('feature')
      .setDescription('Optional — which 24/7 feature slot(s) this code grants')
      .setRequired(false)
      .addChoices(...FEATURE_CHOICES),
  )
  .addStringOption((opt) =>
    opt
      .setName('note')
      .setDescription('Optional internal note')
      .setRequired(false)
      .setMaxLength(200),
  )
  .setDMPermission(false);

export async function execute(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  const timeInput = interaction.options.getString('time', true).trim().toLowerCase();
  const playgroundLimit = interaction.options.getInteger('playground', true);
  const featureChoice = interaction.options.getString('feature'); // optional now
  const note = interaction.options.getString('note') ?? undefined;

  // ── Parse time ─────────────────────────────────────────────────────
  let duration: CodeDuration;
  let durationDays: number | undefined;

  if (timeInput === 'lifetime') {
    duration = 'lifetime';
  } else {
    const days = parseInt(timeInput, 10);
    if (!Number.isFinite(days) || days < 7 || days > 365) {
      await interaction.reply({
        embeds: [
          errorEmbed(
            'Invalid time value',
            'Enter `lifetime` or a number of days between **7** and **365**.\nExamples: `lifetime`, `30`, `90`, `180`.',
          ),
        ],
        ephemeral: true,
      });
      return;
    }
    duration = 'custom';
    durationDays = days;
  }

  // ── Parse feature (optional — null means no 24/7 slots) ────────────
  let limitOnliner = 0;
  let limitVc = 0;
  let limitTyper = 0;

  if (featureChoice) {
    const features = featureChoice.split('+');
    limitOnliner = features.includes('onliner') ? 1 : 0;
    limitVc = features.includes('vc') ? 1 : 0;
    limitTyper = features.includes('typer') ? 1 : 0;
  }

  await interaction.deferReply({ ephemeral: true });

  try {
    const result = await createCode({
      duration,
      durationDays,
      playgroundLimit,
      limitOnliner,
      limitVc,
      limitTyper,
      adminDiscordId: interaction.user.id,
      note,
    });

    await recordBotAudit({
      adminDiscordId: interaction.user.id,
      action: 'code.create',
      targetType: 'redeem_code',
      targetId: result.codeId,
      metadata: {
        duration,
        durationDays,
        playgroundLimit,
        limitOnliner,
        limitVc,
        limitTyper,
        preview: result.preview,
        source: 'discord-bot',
      },
    });

    const durationLabel =
      result.duration === 'lifetime'
        ? 'Lifetime'
        : result.duration === 'custom'
          ? `${result.durationDays} days`
          : result.duration === '1m'
            ? '30 days (1m)'
            : '90 days (3m)';

    const featureLabels = [
      limitOnliner ? '1× Onliner' : null,
      limitVc ? '1× VC' : null,
      limitTyper ? '1× Typer' : null,
    ]
      .filter(Boolean)
      .join(' · ');

    const embed = successEmbed('✅ Redeem Code Created').addFields(
      { name: 'Code', value: `\`\`\`\n${result.code}\n\`\`\``, inline: false },
      { name: 'Duration', value: durationLabel, inline: true },
      { name: 'Playgrounds', value: String(result.playgroundLimit), inline: true },
      { name: 'Features', value: featureLabels || 'None', inline: false },
      { name: 'Code ID', value: `\`${result.codeId}\``, inline: false },
    );

    if (note) {
      embed.addFields({ name: 'Note', value: note, inline: false });
    }

    await interaction.editReply({ embeds: [embed] });
  } catch (err) {
    const message = (err as Error).message || 'Failed to create code.';
    await interaction.editReply({
      embeds: [errorEmbed('❌ Code Creation Failed', message)],
    });
  }
  }
