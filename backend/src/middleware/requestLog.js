import { logger } from '../utils/logger.js';

// One log line per request, emitted on response finish. Keeps logs cheap and
// structured. Skips the noisy /api/health probe.
export const requestLog = (req, res, next) => {
  if (req.path === '/api/health') return next();
  const start = process.hrtime.bigint();

  res.on('finish', () => {
    const durMs = Number(process.hrtime.bigint() - start) / 1e6;
    logger.info('http', {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      durMs: Math.round(durMs),
      userId: req.user?.id,
    });
  });

  next();
};
