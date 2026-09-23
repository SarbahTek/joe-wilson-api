import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { unauthorized } from '../utils/response';

export interface AuthRequest extends Request {
  user?: { id: string; email: string; role: string };
}

export function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  console.log('[AUTH] Authorization header:', authHeader ? 'PRESENT' : 'MISSING');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('[AUTH] Missing/invalid Authorization header');
    return unauthorized(res);
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = verifyAccessToken(token);

    console.log('[AUTH] Decoded JWT payload:', {
      sub: payload.sub,
      email: payload.email,
      role: payload.role,
    });

    req.user = {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
    };

    console.log('[AUTH] req.user:', req.user);

    next();

  } catch (error) {
    console.error('[AUTH] JWT verification failed:', error);
    return unauthorized(res, 'Invalid or expired token');
  }
}