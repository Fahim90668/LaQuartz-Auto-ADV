import type { FastifyPluginAsync } from 'fastify';
import {
  redeemCodeInputSchema,
  redeemCode as redeemCodeHash,
  errors,
} from '@app/shared';
import { entitlements as entitlementsDb, codes as codesDb } from '@app/db';
import { hashRedeemCode } from '@app/crypto';
import { recordAudit } from '../services/audit.service.js';
import { parseBody } from '../utils/respond.js';
import { rateLimitConfig } from '../plugins/rate-limit.js';

const entitlementRoutes: FastifyPluginAsync = async (app) => {
  app.get('/me/access', async (req, reply) => {
    const snapshot = await entitlementsDb.getAccessSnapshot(req.user!.id);
    return reply.code(200).send(snapshot);
  });

  app.post(
    '/redeem',
    rateLimitConfig(5, '1 minute'),
    async (req, reply) => {
      const input = parseBody(redeemCodeInputSchema, req.body);
      const codeHash = hashRedeemCode(input.code);

      const result = await codesDb.redeemCode(codeHash);

      if (!result.success) {
        const message = result.message.toLowerCase();
        if (message.includes('already')) throw errors.alreadyRedeemed();
        if (message.includes('revoked')) throw errors.codeDestroyed();
        if (message.includes('expired')) throw errors.codeExpired();
        throw errors.invalidCode();
      }

      await recordAudit({
        actorType: 'user',
        actorId: req.user!.id,
        action: 'code.redeem',
        targetType: 'redeem_code',
        targetId: result.entitlement?.id ?? null,
        metadata: { playgroundLimit: result.entitlement?.playgroundLimit ?? null },
        ip: req.ip,
        userAgent: req.headers['user-agent'] ?? null,
      });

      return reply.code(200).send(result);
    },
  );
};

export default entitlementRoutes;