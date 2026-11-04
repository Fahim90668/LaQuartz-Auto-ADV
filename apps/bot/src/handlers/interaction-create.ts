import {
  Events,
  type Client,
  type ChatInputCommandInteraction,
  type Interaction,
} from 'discord.js';
import { ensureAdmin } from '../guards/is-admin.js';
import { getHandler } from './command-registry.js';
import { errorEmbed, warningEmbed } from '../lib/embeds.js';
import type { Env } from '../env.js';

export function registerInteractionHandler(client: Client, env: Env): void {
  client.on(Events.InteractionCreate, async (interaction: Interaction) => {
    if (!interaction.isChatInputCommand()) return;
    await handleChatInput(interaction, env);
  });
}

async function handleChatInput(
  interaction: ChatInputCommandInteraction,
  env: Env,
): Promise<void> {
  const handler = getHandler(interaction.commandName);
  if (!handler) {
    await safeReply(interaction, {
      embeds: [warningEmbed('Unknown Command', 'This command is not registered.')],
    });
    return;
  }

  const guard = ensureAdmin(interaction, env);
  if (!guard.isAdmin) {
    await safeReply(interaction, {
      embeds: [
        errorEmbed(
          '🔒 Access Denied',
          guard.reason ?? 'You do not have permission to use this command.',
        ),
      ],
    });
    return;
  }

  try {
    await handler.execute(interaction);
  } catch (err) {
    const message = (err as Error).message || 'Unexpected error.';
    console.error(`[bot] command ${interaction.commandName} failed:`, err);
    await safeReply(interaction, {
      embeds: [errorEmbed('❌ Command Failed', message)],
    });
  }
}

async function safeReply(
  interaction: ChatInputCommandInteraction,
  payload: Parameters<ChatInputCommandInteraction['reply']>[0],
): Promise<void> {
  try {
    if (interaction.deferred || interaction.replied) {
      await interaction.editReply(payload);
    } else {
      await interaction.reply({ ...payload, ephemeral: true });
    }
  } catch (err) {
    console.warn('[bot] failed to send reply:', (err as Error).message);
  }
}