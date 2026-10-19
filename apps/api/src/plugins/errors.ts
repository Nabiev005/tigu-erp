import { Prisma } from '@prisma/client';
import type { ApiError, ErrorCode } from '@tigu/shared';
import type { FastifyError, FastifyInstance } from 'fastify';

/** Domain error serialized into the common `{ error: { code, message, details? } }` envelope. */
export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: ErrorCode | string,
    message: string,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const notFound = (what = 'Resource') => new AppError(404, 'NOT_FOUND', `${what} not found`);
export const forbidden = (message = 'Forbidden') => new AppError(403, 'FORBIDDEN', message);
export const unauthorized = (message = 'Unauthorized') =>
  new AppError(401, 'UNAUTHORIZED', message);

function errorBody(code: string, message: string, details?: Record<string, unknown>): ApiError {
  return { error: details ? { code, message, details } : { code, message } };
}

export function registerErrorHandlers(app: FastifyInstance): void {
  app.setErrorHandler((err: FastifyError | AppError, request, reply) => {
    if (err instanceof AppError) {
      return reply.status(err.statusCode).send(errorBody(err.code, err.message, err.details));
    }
    if ('validation' in err && err.validation) {
      return reply
        .status(400)
        .send(
          errorBody('VALIDATION_ERROR', 'Request validation failed', { issues: err.validation }),
        );
    }
    // Record outside the tenant (or deleted) — same answer as "never existed".
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      return reply.status(404).send(errorBody('NOT_FOUND', 'Resource not found'));
    }
    const fastifyError = err as FastifyError;
    const status = fastifyError.statusCode ?? 500;
    if (status >= 500) {
      request.log.error({ err }, 'unhandled error');
      return reply.status(500).send(errorBody('INTERNAL_ERROR', 'Internal server error'));
    }
    return reply
      .status(status)
      .send(errorBody(fastifyError.code ?? 'REQUEST_ERROR', fastifyError.message));
  });

  app.setNotFoundHandler((request, reply) => {
    reply
      .status(404)
      .send(errorBody('NOT_FOUND', `Route ${request.method} ${request.url} not found`));
  });
}
