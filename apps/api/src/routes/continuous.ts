import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { errors, UUID_PATTERN, SNOWFLAKE_PATTERN } from '@app/shared';
import { continuous as continuousDb } from '@app/db';
import { parseBody } from '../utils/respond.js';
import { rateLimitConfig } from '../plugins/rate-limit.js';

const createSchema = z
  .object({
    accountId: z.string().regex(UUID_PATTERN, 'Invalid account ID'),
    serviceType: z.enum(['onliner', 'vc', 'typer']),
    durationSeconds: z.number().int().min(60).max(2_592_000), // 1 min – 30 days
    config: z.record(z.unknown()).default({}),
  })
  .strict();

const idParam = z.object({ id: z.string().regex(UUID_PATTERN) });

const continuousRoutes: FastifyPluginAsync = async (app) => {
  app.get('/continuous', async (req, reply) => {
    const items = await continuousDb.listServicesForUser(req.user!.id);
    return reply.code(200).send({ items });
  });

  app.post(
    '/continuous',
    rateLimitConfig(10, '1 minute'),
    async (req, reply) => {
      const input = parseBody(createSchema, req.body);

      if (input.serviceType === 'vc' || input.serviceType === 'typer') {
        const cfg = (input.config ?? {}) as { channelId?: string };
        if (!cfg.channelId || !SNOWFLAKE_PATTERN.test(cfg.channelId)) {
          throw errors.validation(`${input.serviceType} requires a valid channelId.`);
        }
      }

      try {
        const result = await continuousDb.createService({
          userId: req.user!.id,
          accountId: input.accountId,
          serviceType: input.serviceType,
          config: input.config,
          durationSeconds: input.durationSeconds,
        });

        return reply.code(201).send({
          id: result.id,
          expiresAt: result.expiresAt,
          status: 'pending',
        });
      } catch (err) {
        // Quota / limit errors surface from the RPC with P0001 + hint
        const message = (err as { message?: string }).message ?? '';
        const hint = (err as { hint?: string }).hint ?? '';
        if (message.includes('NO_247_QUOTA')) {
          throw new (errors.noEntitlement().constructor as new (m: string, s?: number) => Error)(
            hint || 'Your code does not allow this 24/7 service.',
            403,
          );
        }
        if (message.includes('SERVICE_LIMIT_REACHED')) {
          throw new (errors.conflict('').constructor as new (m: string, s?: number) => Error)(
            hint || 'You have reached the limit for this service type.',
            409,
          );
        }
        throw err;
      }
    },
  );

  app.delete('/continuous/:id', async (req, reply) => {
    const { id } = idParam.parse(req.params);
    const ok = await continuousDb.stopService(id, req.user!.id);
    if (!ok) throw errors.notFound('Service');
    return reply.code(204).send();
  });
};

export default continuousRoutes;
