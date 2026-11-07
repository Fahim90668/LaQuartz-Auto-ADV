import Fastify, { type FastifyInstance } from 'fastify';
import loggerPlugin from './plugins/logger.js';
import securityPlugin from './plugins/security.js';
import rateLimitPlugin from './plugins/rate-limit.js';
import authPlugin from './plugins/auth.js';
import errorHandlerPlugin from './plugins/error-handler.js';
import healthRoutes from './routes/health.js';
import entitlementRoutes from './routes/entitlement.js';
import accountRoutes from './routes/accounts.js';
import discordRoutes from './routes/discord.js';
import playgroundRoutes from './routes/playgrounds.js';
import logRoutes from './routes/logs.js';
import type { Env } from './env.js';

export async function buildServer(env: Env): Promise<FastifyInstance> {
  const app = Fastify({
    logger: {
      level: env.LOG_LEVEL,
      redact: {
        paths: [
          'req.headers.authorization',
          'req.headers.cookie',
          'req.body.token',
          'req.body.code',
        ],
        censor: '[REDACTED]',
      },
    },
    trustProxy: true,
    disableRequestLogging: false,
    requestIdHeader: 'x-request-id',
    requestIdLogLabel: 'reqId',
    bodyLimit: 1024 * 1024,
  });

  // ── Custom JSON parser ──────────────────────────────────────────────────
  // Fastify's default parser rejects requests that carry a
  // `Content-Type: application/json` header but have an empty body with
  //   FST_ERR_CTP_EMPTY_JSON_BODY (400)
  // This breaks legitimate bodyless POSTs like /playgrounds/:id/start,
  // /playgrounds/:id/stop, /accounts/:id/validate.
  //
  // This parser keeps the same behavior for real bodies and treats an
  // empty body as `undefined` so route handlers that don't expect a body
  // just work. Malformed JSON is still rejected with a 400.
  app.addContentTypeParser(
    'application/json',
    { parseAs: 'string' },
    (_req, body, done) => {
      const raw = body as string;
      if (!raw || raw.trim() === '') {
        done(null, undefined);
        return;
      }
      try {
        done(null, JSON.parse(raw));
      } catch (err) {
        const e = err as Error & { statusCode?: number };
        e.statusCode = 400;
        done(e, undefined);
      }
    },
  );

  await app.register(errorHandlerPlugin);
  await app.register(loggerPlugin, { env });
  await app.register(securityPlugin, { env });
  await app.register(rateLimitPlugin);
  await app.register(authPlugin, { env });

  await app.register(healthRoutes);
  await app.register(entitlementRoutes);
  await app.register(accountRoutes);
  await app.register(discordRoutes);
  await app.register(playgroundRoutes);
  await app.register(logRoutes);

  return app;
  }
