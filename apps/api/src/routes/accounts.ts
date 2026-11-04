import type { FastifyPluginAsync } from 'fastify';
import {
  accountIdParamSchema,
  createAccountSchema,
  updateAccountLabelSchema,
} from '@app/shared';
import * as accountService from '../services/account.service.js';
import { recordAudit } from '../services/audit.service.js';
import { parseBody, parseParams } from '../utils/respond.js';
import { rateLimitConfig } from '../plugins/rate-limit.js';

const accountRoutes: FastifyPluginAsync = async (app) => {
  app.get('/accounts', async (req, reply) => {
    const items = await accountService.listAccounts(req.user!.id);
    return reply.code(200).send({ items });
  });

  app.post(
    '/accounts',
    rateLimitConfig(10, '1 minute'),
    async (req, reply) => {
      const input = parseBody(createAccountSchema, req.body);
      const account = await accountService.addAccount(req.user!.id, input);

      await recordAudit({
        actorType: 'user',
        actorId: req.user!.id,
        action: 'account.create',
        targetType: 'discord_account',
        targetId: account.id,
        metadata: { discordUserId: account.discordUserId },
        ip: req.ip,
        userAgent: req.headers['user-agent'] ?? null,
      });

      return reply.code(201).send(account);
    },
  );

  app.post(
    '/accounts/:id/validate',
    rateLimitConfig(20, '1 minute'),
    async (req, reply) => {
      const { id } = parseParams(accountIdParamSchema, req.params);
      const account = await accountService.validateAccount(req.user!.id, id);
      return reply.code(200).send(account);
    },
  );

  app.patch(
    '/accounts/:id',
    rateLimitConfig(20, '1 minute'),
    async (req, reply) => {
      const { id } = parseParams(accountIdParamSchema, req.params);
      const input = parseBody(updateAccountLabelSchema, req.body);
      const account = await accountService.updateLabel(req.user!.id, id, input);
      return reply.code(200).send(account);
    },
  );

  app.delete(
    '/accounts/:id',
    rateLimitConfig(20, '1 minute'),
    async (req, reply) => {
      const { id } = parseParams(accountIdParamSchema, req.params);
      await accountService.removeAccount(req.user!.id, id);

      await recordAudit({
        actorType: 'user',
        actorId: req.user!.id,
        action: 'account.delete',
        targetType: 'discord_account',
        targetId: id,
        ip: req.ip,
        userAgent: req.headers['user-agent'] ?? null,
      });

      return reply.code(204).send();
    },
  );
};

export default accountRoutes;