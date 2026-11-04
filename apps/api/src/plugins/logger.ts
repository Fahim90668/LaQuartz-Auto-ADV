import fp from 'fastify-plugin';
import type { FastifyInstance } from 'fastify';
import type { Env } from '../env.js';

export interface LoggerPluginOptions {
  env: Env;
}

export default fp<LoggerPluginOptions>(
  async function loggerPlugin(app: FastifyInstance, opts: LoggerPluginOptions) {
    app.log.info(
      { env: opts.env.NODE_ENV, logLevel: opts.env.LOG_LEVEL },
      'logger configured',
    );
  },
  { name: 'logger' },
);