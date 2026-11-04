import {
  Client,
  GatewayIntentBits,
  Partials,
  type ClientOptions,
} from 'discord.js';
import type { Env } from './env.js';
import { registerInteractionHandler } from './handlers/interaction-create.js';

export function createDiscordClient(env: Env): Client {
  const options: ClientOptions = {
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
    partials: [Partials.GuildMember],
  };

  const client = new Client(options);

  registerInteractionHandler(client, env);

  client.once('ready', () => {
    if (!client.user) return;
    console.info(
      `[bot] logged in as ${client.user.tag} (${client.user.id}) · ` +
        `guilds=${client.guilds.cache.size}`,
    );
  });

  client.on('error', (err) => {
    console.error('[bot] client error:', err);
  });

  client.on('warn', (msg) => {
    console.warn('[bot] warn:', msg);
  });

  return client;
}