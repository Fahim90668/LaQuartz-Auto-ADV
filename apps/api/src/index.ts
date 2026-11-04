import { loadEnv } from './env.js';
import { buildServer } from './server.js';

async function main() {
  const env = loadEnv();
  const app = await buildServer(env);

  const shutdown = async (signal: string) => {
    app.log.info({ signal }, 'shutting down');
    try {
      await app.close();
      process.exit(0);
    } catch (err) {
      app.log.error({ err }, 'shutdown failed');
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('unhandledRejection', (reason) => {
    app.log.error({ reason }, 'unhandled rejection');
  });
  process.on('uncaughtException', (err) => {
    app.log.fatal({ err }, 'uncaught exception');
    process.exit(1);
  });

  try {
    await app.listen({ port: env.PORT, host: env.HOST });
    app.log.info(
      { port: env.PORT, host: env.HOST, env: env.NODE_ENV },
      'api listening',
    );
  } catch (err) {
    app.log.fatal({ err }, 'failed to start');
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});