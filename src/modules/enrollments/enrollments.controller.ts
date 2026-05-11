import { Request, Response } from 'express';
import { AuthRequest } from '../../middleware/authenticate';
import { prisma } from '../../config/database';
import { ok } from '../../utils/response';

export async function getMyEnrollments(req: AuthRequest, res: Response) {
  const userId = req.user!.id;

  const enrollments = await prisma.enrollment.findMany({
    where: { userId },
    include: {
      masterclass: {
        include: { _count: { select: { sessions: true } } },
      },
    },
    orderBy: { enrolledAt: 'desc' },
  });

  // Calculate progress for each masterclass
  const data = await Promise.all(
    enrollments.map(async (enrollment) => {
      const totalSessions = enrollment.masterclass._count.sessions;
      const completedSessions = await prisma.sessionProgress.count({
        where: {
          userId,
          completedAt: { not: null },
          session: { masterclassId: enrollment.masterclassId },
        },
      });

      const progressPct = totalSessions > 0
        ? Math.round((completedSessions / totalSessions) * 100)
        : 0;

      return {
        id: enrollment.id,
        enrolledAt: enrollment.enrolledAt,
        accessExpiresAt: enrollment.accessExpiresAt,
        masterclass: {
          id: enrollment.masterclass.id,
          title: enrollment.masterclass.title,
          coverImageUrl: enrollment.masterclass.coverImageUrl,
          status: enrollment.masterclass.status,
          sessionsCount: totalSessions,
        },
        sessionsCompleted: completedSessions,
        progressPct,
      };
    })
  );

  return ok(res, data);
}

export async function getMasterclassEnrollments(req: Request, res: Response) {
  const { masterclassId } = req.params;

  const enrollments = await prisma.enrollment.findMany({
    where: { masterclassId },
    include: {
      user: {
        select: { id: true, email: true, firstName: true, lastName: true, avatarUrl: true },
      },
      payment: { select: { id: true, amountCents: true, status: true, createdAt: true } },
    },
    orderBy: { enrolledAt: 'desc' },
  });

  return ok(res, enrollments);
}
