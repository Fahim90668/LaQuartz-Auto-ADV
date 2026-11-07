import fp from 'fastify-plugin';
import type { FastifyError, FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';
import { isAppError } from '@app/shared';
import { DiscordHttpError } from '@app/discord';

interface PostgrestLikeError {
  message?: string;
  code?: string;
  details?: string | null;
  hint?: string | null;
}

function isPostgrestError(err: unknown): err is PostgrestLikeError {
  if (!err || typeof err !== 'object') return false;
  const e = err as PostgrestLikeError;
  return typeof e.code === 'string' && typeof e.message === 'string';
}

export default fp(
  async function errorHandlerPlugin(app: FastifyInstance) {
    app.setErrorHandler(
      (err: FastifyError | Error, req: FastifyRequest, reply: FastifyReply) => {
        // 1. App errors
        if (isAppError(err)) {
          req.log.info(
            { code: err.code, statusCode: err.statusCode, path: req.url },
            err.message,
          );
          return reply.code(err.statusCode).send(err.toJSON(req.id));
        }

        // 2. Zod
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

        // 3. Discord REST
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

        // 4. PostgREST / Postgres errors → real statuses + real messages
        if (isPostgrestError(err)) {
          const pgCode = err.code ?? '';
          const pgMessage = err.message ?? 'Database error';
          const pgDetails = err.details ?? undefined;
          const pgHint = err.hint ?? undefined;

          req.log.warn(
            { pgCode, pgMessage, pgDetails, pgHint, path: req.url },
            'Database error',
          );

          if (pgCode === 'P0001') {
            if (pgMessage.includes('PLAYGROUND_LIMIT_REACHED')) {
              return reply.code(409).send({
                error: {
                  code: 'PLAYGROUND_LIMIT_REACHED',
                  message:
                    'Playground limit reached. Delete an existing playground or redeem a code with a higher limit.',
                  details: { hint: pgHint },
                  requestId: req.id,
                },
              });
            }
            if (pgMessage.includes('NO_ENTITLEMENT')) {
              return reply.code(403).send({
                error: {
                  code: 'NO_ENTITLEMENT',
                  message: 'Your code has expired or been destroyed.',
                  requestId: req.id,
                },
              });
            }
            if (pgMessage.includes('CHANNEL_LIMIT_REACHED')) {
              return reply.code(409).send({
                error: {
                  code: 'CHANNEL_LIMIT_REACHED',
                  message: 'Maximum 5 channels per playground.',
                  requestId: req.id,
                },
              });
            }
            return reply.code(400).send({
              error: {
                code: 'DB_RAISE',
                message: pgMessage,
                details: { hint: pgHint },
                requestId: req.id,
              },
            });
          }

          if (pgCode === '23514') {
            return reply.code(422).send({
              error: {
                code: 'CHECK_CONSTRAINT_VIOLATION',
                message: pgMessage,
                details: { hint: pgHint },
                requestId: req.id,
              },
            });
          }

          if (pgCode === '23503') {
            return reply.code(409).send({
              error: {
                code: 'FOREIGN_KEY_VIOLATION',
                message: pgMessage,
                details: { hint: pgHint },
                requestId: req.id,
              },
            });
          }

          if (pgCode === '23505') {
            return reply.code(409).send({
              error: {
                code: 'UNIQUE_VIOLATION',
                message: pgMessage,
                details: { hint: pgHint },
                requestId: req.id,
              },
            });
          }

          if (pgCode === '23502') {
            return reply.code(422).send({
              error: {
                code: 'NOT_NULL_VIOLATION',
                message: pgMessage,
                requestId: req.id,
              },
            });
          }

          if (pgCode === '42501') {
            return reply.code(403).send({
              error: {
                code: 'PERMISSION_DENIED',
                message: pgMessage,
                requestId: req.id,
              },
            });
          }

          return reply.code(400).send({
            error: {
              code: 'DATABASE_ERROR',
              message: pgMessage,
              details: { code: pgCode, hint: pgHint },
              requestId: req.id,
            },
          });
        }

        // 5. Fastify schema validation
        if ((err as FastifyError).validation) {
          return reply.code(400).send({
            error: {
              code: 'VALIDATION_ERROR',
              message: err.message,
              requestId: req.id,
            },
          });
        }

        // 6. Other Fastify 4xx
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

        // 7. Unknown
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
