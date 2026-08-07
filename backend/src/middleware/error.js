import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { AppError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import { isProd } from '../config/env.js';

export const notFoundHandler = (_req, res) => {
  res.status(404).json({ error: 'Route not found', code: 'ROUTE_NOT_FOUND' });
};

// Single global error handler. Must be the LAST middleware mounted.
// Translates known error shapes into clean JSON; never leaks stack traces.
export const errorHandler = (err, req, res, _next) => {
  // 1. Operational AppError — trusted, send as-is
  if (err instanceof AppError) {
    return res.status(err.status).json({
      error: err.message,
      code: err.code,
      ...(err.details && { details: err.details }),
    });
  }

  // 2. Zod parse failure thrown outside the validate middleware
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: err.flatten().fieldErrors,
    });
  }

  // 3. Prisma known errors — translate the common ones
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      return res.status(409).json({
        error: 'Resource already exists',
        code: 'UNIQUE_CONSTRAINT',
        details: { target: err.meta?.target },
      });
    }
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Resource not found', code: 'NOT_FOUND' });
    }
    if (err.code === 'P2003') {
      return res.status(409).json({
        error: 'Foreign key constraint failed',
        code: 'FK_CONSTRAINT',
        details: { field: err.meta?.field_name },
      });
    }
  }

  // 4. Body parser
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Request body too large', code: 'PAYLOAD_TOO_LARGE' });
  }
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Malformed JSON body', code: 'BAD_JSON' });
  }

  // 5. Unknown — log full detail, return generic message
  logger.error('unhandled error', {
    method: req.method,
    path: req.path,
    err: err.message,
    stack: err.stack,
  });

  res.status(500).json({
    error: 'Internal server error',
    code: 'INTERNAL_ERROR',
    ...(isProd ? {} : { debug: err.message }),
  });
};
