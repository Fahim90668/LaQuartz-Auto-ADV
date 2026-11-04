import fp from 'fastify-plugin';
import rateLimit from '@fastify/rate-limit';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

export default fp(
  async function rateLimitPlugin(app: FastifyInstance) {
    await app.register(rateLimit, {
      global: false,
      max: 60,
      timeWindow: '1 minute',
      keyGenerator: (req: FastifyRequest) => req.ip,
      errorResponseBuilder: (req: FastifyRequest, ctx) => ({
        error: {
          code: 'RATE_LIMITED',
          message: `Too many requests. Retry in ${Math.ceil(ctx.ttl / 1000)}s.`,
          requestId: req.id,
        },
      }),
      onExceeded: (req: FastifyRequest, _key: string) => {
        req.log.warn({ ip: req.ip, url: req.url }, 'rate limit exceeded');
      },
    });
  },
  { name: 'rate-limit' },
);

declare module 'fastify' {
  interface FastifyReply {
    _rateLimited?: boolean;
  }
}

export type RateLimitConfig = {
  max: number;
  timeWindow: string | number;
};

export function rateLimitConfig(max: number, timeWindow: string | number = '1 minute') {
  return { config: { rateLimit: { max, timeWindow } } };
}