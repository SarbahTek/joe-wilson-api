import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction) {
  console.error('[ERROR]', err.stack);

  if (env.NODE_ENV === 'production') {
    return res.status(500).json({ success: false, error: 'Something went wrong' });
  }

  return res.status(500).json({ success: false, error: err.message, stack: err.stack });
}
