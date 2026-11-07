import fp from 'fastify-plugin';
import type { FastifyError, FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';
import { isAppError } from '@app/shared';
import { DiscordHttpError } from '@app/discord';

export default fp(
  async function errorHandlerPlugin(app: FastifyInstance) {
    app.setErrorHandler(
      (err: FastifyError | Error, req: FastifyRequest, reply: FastifyReply) => {
        // 1. App errors carry their own code + statusCode
        if (isAppError(err)) {
          req.log.info(
            { code: err.code, statusCode: err.statusCode, path: req.url },
            err.message,
          );
          return reply.code(err.statusCode).send(err.toJSON(req.id));
        }

        // 2. Zod validation errors
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

        // 3. Discord REST errors → 502
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

        // 4. Fastify schema validation (route params, querystring)
        if ((err as FastifyError).validation) {
          return reply.code(400).send({
            error: {
              code: 'VALIDATION_ERROR',
              message: err.message,
              requestId: req.id,
            },
          });
        }

        // 5. Any FastifyError with a statusCode (400, 401, 404, 413, 415, 429, ...)
        //    Respect it instead of forcing 500.
        const fe = err as FastifyError;
        if (typeof fe.statusCode === 'number' && fe.statusCode >= 400 && fe.statusCode < 500) {
          req.log.warn(
            { code: fe.code, statusCode: fe.statusCode, path: req.url },
            fe.message,
          );
          return reply.code(fe.statusCode).send({
            error: {
              code: fe.code ?? 'CLIENT_ERROR',
              message: fe.message,
              requestId: req.id,
            },
          });
        }

        // 6. Everything else → 500
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
