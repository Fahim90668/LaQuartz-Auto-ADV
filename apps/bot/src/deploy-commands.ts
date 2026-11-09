import { REST, Routes } from 'discord.js';
import { getCommands } from './handlers/command-registry.js';

async function main() {
  const token = process.env.DISCORD_BOT_TOKEN;
  const guildId = process.env.DISCORD_GUILD_ID;

  if (!token) {
    throw new Error('DISCORD_BOT_TOKEN is not set.');
  }
  if (!guildId || !/^\d{17,20}$/.test(guildId)) {
    throw new Error('DISCORD_GUILD_ID is not set or not a valid snowflake.');
  }

  const commands = getCommands().map((c) => c.toJSON());
  const rest = new REST({ version: '10' }).setToken(token);

  console.info(`[deploy] registering ${commands.length} guild commands…`);

  try {
    const result = (await rest.put(
      Routes.applicationGuildCommands(clientIdFromToken(token), guildId),
      { body: commands },
    )) as Array<{ name: string }>;

    console.info(
      `[deploy] ✓ registered ${result.length} commands: ${result.map((c) => c.name).join(', ')}`,
    );
  } catch (err) {
    console.error('[deploy] ✗ failed:', err);
    process.exit(1);
  }
}

function clientIdFromToken(token: string): string {
  const part = token.split('.')[0];
  if (!part) throw new Error('Invalid bot token format.');
  try {
    const decoded = Buffer.from(part, 'base64').toString('utf8');
    if (!/^\d{17,20}$/.test(decoded)) {
      throw new Error('Token does not contain a valid client ID.');
    }
    return decoded;
  } catch {
    throw new Error('Could not extract client ID from bot token.');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
