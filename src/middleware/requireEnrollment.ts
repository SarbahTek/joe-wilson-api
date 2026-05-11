import { Response, NextFunction } from 'express';
import { AuthRequest } from './authenticate';
import { prisma } from '../config/database';
import { forbidden, notFound } from '../utils/response';

export async function requireEnrollment(req: AuthRequest, res: Response, next: NextFunction) {
  const userId = req.user?.id;
  const sessionId = req.params.id;

  if (!userId) return forbidden(res);

  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    select: { masterclassId: true },
  });

  if (!session) return notFound(res, 'Session not found');

  const enrollment = await prisma.enrollment.findFirst({
    where: { userId, masterclassId: session.masterclassId },
  });

  if (!enrollment) {
    return forbidden(res, 'You are not enrolled in this masterclass');
  }

  if (enrollment.accessExpiresAt && enrollment.accessExpiresAt < new Date()) {
    return forbidden(res, 'Your access to this masterclass has expired');
  }

  next();
}
