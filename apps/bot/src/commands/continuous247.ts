import {
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
  type SlashCommandOptionsOnlyBuilder,
} from 'discord.js';
import { getServiceClient } from '@app/db';
import { successEmbed, errorEmbed } from '../lib/embeds.js';

export const data: SlashCommandOptionsOnlyBuilder = new SlashCommandBuilder()
  .setName('247')
  .setDescription('Create a 24/7 continuous service for a Discord account.')
  .addStringOption((opt) =>
    opt
      .setName('service')
      .setDescription('Which service to start')
      .setRequired(true)
      .addChoices(
        { name: 'Onliner (keep account online)', value: 'onliner' },
        { name: 'VC (stay in a voice channel)', value: 'vc' },
        { name: 'Typer (keep typing indicator)', value: 'typer' },
      ),
  )
  .addStringOption((opt) =>
    opt.setName('account').setDescription('Account UUID to use').setRequired(true),
  )
  .addIntegerOption((opt) =>
    opt
      .setName('hours')
      .setDescription('Duration — hours (0–720)')
      .setRequired(true)
      .setMinValue(0)
      .setMaxValue(720),
  )
  .addIntegerOption((opt) =>
    opt
      .setName('minutes')
      .setDescription('Duration — minutes (0–59)')
      .setRequired(false)
      .setMinValue(0)
      .setMaxValue(59),
  )
  .addIntegerOption((opt) =>
    opt
      .setName('seconds')
      .setDescription('Duration — seconds (0–59)')
      .setRequired(false)
      .setMinValue(0)
      .setMaxValue(59),
  )
  .addStringOption((opt) =>
    opt
      .setName('channel_id')
      .setDescription('Required for VC and Typer — the channel snowflake')
      .setRequired(false),
  )
  .addStringOption((opt) =>
    opt
      .setName('presence')
      .setDescription('For Onliner only')
      .setRequired(false)
      .addChoices(
        { name: 'online', value: 'online' },
        { name: 'idle', value: 'idle' },
        { name: 'dnd', value: 'dnd' },
        { name: 'invisible', value: 'invisible' },
      ),
  )
  .setDMPermission(false);

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const serviceType = interaction.options.getString('service', true) as
    | 'onliner'
    | 'vc'
    | 'typer';
  const accountId = interaction.options.getString('account', true);
  const hours = interaction.options.getInteger('hours', true);
  const minutes = interaction.options.getInteger('minutes') ?? 0;
  const seconds = interaction.options.getInteger('seconds') ?? 0;
  const channelId = interaction.options.getString('channel_id');
  const presence = interaction.options.getString('presence') ?? 'online';

  const durationSeconds = hours * 3600 + minutes * 60 + seconds;
  if (durationSeconds < 60) {
    await interaction.reply({
      embeds: [errorEmbed('Duration too short', 'Minimum duration is 60 seconds.')],
      ephemeral: true,
    });
    return;
  }

  if ((serviceType === 'vc' || serviceType === 'typer') && !channelId) {
    await interaction.reply({
      embeds: [errorEmbed('Missing channel_id', `${serviceType} requires a channel_id.`)],
      ephemeral: true,
    });
    return;
  }

  await interaction.deferReply({ ephemeral: true });

  try {
    const db = getServiceClient();

    const { data: prof } = await db
      .from('profiles')
      .select('id')
      .eq('discord_id', interaction.user.id)
      .maybeSingle();

    if (!prof) {
      await interaction.editReply({
        embeds: [
          errorEmbed(
            'Account not linked',
            'Sign in to the panel first to create your profile.',
          ),
        ],
      });
      return;
    }

    const config: Record<string, unknown> =
      serviceType === 'onliner' ? { presence } : { channelId };

    const { data, error } = await db.rpc('create_continuous_service', {
      p_user_id: prof.id,
      p_account_id: accountId,
      p_service: serviceType,
      p_config: config,
      p_duration_s: durationSeconds,
    });

    if (error) throw error;
    const row = Array.isArray(data) ? data[0] : data;
    if (!row) throw new Error('create_continuous_service returned no row');

    const embed = successEmbed('🕒 24/7 Service Scheduled').addFields(
      { name: 'Service', value: serviceType, inline: true },
      { name: 'Account', value: `\`${accountId}\``, inline: true },
      {
        name: 'Expires',
        value: `<t:${Math.floor(new Date(row.expires_at).getTime() / 1000)}:F>`,
        inline: false,
      },
      { name: 'Service ID', value: `\`${row.service_id}\``, inline: false },
    );

    await interaction.editReply({ embeds: [embed] });
  } catch (err) {
    await interaction.editReply({
      embeds: [errorEmbed('Service creation failed', (err as Error).message)],
    });
  }
                   }
