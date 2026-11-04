import fp from 'fastify-plugin';
import type { FastifyError, FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';
import { isAppError } from '@app/shared';
import { DiscordHttpError } from '@app/discord';

export default fp(
  async function errorHandlerPlugin(app: FastifyInstance) {
    app.setErrorHandler(
      (err: FastifyError | Error, req: FastifyRequest, reply: FastifyReply) => {
        if (isAppError(err)) {
          req.log.info(
            { code: err.code, statusCode: err.statusCode, path: req.url },
            err.message,
          );
          return reply.code(err.statusCode).send(err.toJSON(req.id));
        }

        if (err instanceof ZodError) {
          return reply.code(422).send({
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Invalid request payload.',
              details: err.flatten(),
              requestId: req.id,
            },
          });
        }

        if (err instanceof DiscordHttpError) {
          req.log.warn({ mapped: err.mapped, path: req.url }, 'Discord API error');
          return reply.code(502).send({
            error: {
              code: 'DISCORD_ERROR',
              message: err.mapped.message,
              details: {
                status: err.mapped.status,
                errorCode: err.mapped.errorCode,
                retryable: err.mapped.retryable,
              },
              requestId: req.id,
            },
          });
        }

        if ((err as FastifyError).validation) {
          return reply.code(400).send({
            error: {
              code: 'VALIDATION_ERROR',
              message: err.message,
              requestId: req.id,
            },
          });
        }

        if ((err as FastifyError).statusCode === 429) {
          return reply.code(429).send({
            error: {
              code: 'RATE_LIMITED',
              message: err.message,
              requestId: req.id,
            },
          });
        }

        req.log.error({ err, path: req.url }, 'Unhandled error');
        return reply.code(500).send({
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Internal server error.',
            requestId: req.id,
          },
        });
      },
    );

    app.setNotFoundHandler((req: FastifyRequest, reply: FastifyReply) => {
      return reply.code(404).send({
        error: {
          code: 'NOT_FOUND',
          message: `Route ${req.method} ${req.url} not found.`,
          requestId: req.id,
        },
      });
    });
  },
  { name: 'error-handler' },
);