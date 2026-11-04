import { loadEnv } from './env.js';
import { createDiscordClient } from './client.js';

async function main() {
  const env = loadEnv();
  const client = createDiscordClient(env);

  const shutdown = async (signal: string) => {
    console.info(`[bot] ${signal} received, shutting down…`);
    try {
      await client.destroy();
      process.exit(0);
    } catch (err) {
      console.error('[bot] shutdown error:', err);
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('unhandledRejection', (reason) => {
    console.error('[bot] unhandled rejection:', reason);
  });
  process.on('uncaughtException', (err) => {
    console.error('[bot] uncaught exception:', err);
    process.exit(1);
  });

  try {
    await client.login(env.DISCORD_BOT_TOKEN);
  } catch (err) {
    console.error('[bot] login failed:', err);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});