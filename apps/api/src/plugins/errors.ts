import type { ApiError } from '@tigu/shared';
import type { FastifyError, FastifyInstance } from 'fastify';

/** Domain error serialized into the common `{ error: { code, message, details? } }` envelope. */
export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

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
    const status = err.statusCode ?? 500;
    if (status >= 500) {
      request.log.error({ err }, 'unhandled error');
      return reply.status(500).send(errorBody('INTERNAL_ERROR', 'Internal server error'));
    }
    return reply.status(status).send(errorBody(err.code ?? 'REQUEST_ERROR', err.message));
  });

  app.setNotFoundHandler((request, reply) => {
    reply
      .status(404)
      .send(errorBody('NOT_FOUND', `Route ${request.method} ${request.url} not found`));
  });
}
