import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';
import { logger } from '../config/logger';

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction) {
  // Log with structured pino (not console.error) so Railway/Render log viewer can parse it
  logger.error(
    { err, method: req.method, path: req.path, ip: req.ip },
    'Unhandled error'
  );

  // In production: never leak stack traces or internal error messages
  if (env.NODE_ENV === 'production') {
    return res.status(500).json({ success: false, error: 'Something went wrong' });
  }

  return res.status(500).json({ success: false, error: err.message, stack: err.stack });
}
