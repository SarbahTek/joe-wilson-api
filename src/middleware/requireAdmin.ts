import { Response, NextFunction } from 'express';
import { AuthRequest } from './authenticate';
import { forbidden } from '../utils/response';

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'owner') {
    return forbidden(res, 'Admin access required');
  }
  next();
}
