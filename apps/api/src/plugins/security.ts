import fp from 'fastify-plugin';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import type { FastifyInstance } from 'fastify';
import type { Env } from '../env.js';

export interface SecurityPluginOptions {
  env: Env;
}

export default fp<SecurityPluginOptions>(
  async function securityPlugin(app: FastifyInstance, opts: SecurityPluginOptions) {
    await app.register(helmet, {
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    });

    await app.register(cors, {
      origin: [opts.env.WEB_BASE_URL],
      credentials: true,
      methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      maxAge: 3600,
    });
  },
  { name: 'security' },
);