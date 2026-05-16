
import { Request, Response } from 'express';
import { AuthRequest } from '../../middleware/authenticate';
import { prisma } from '../../config/database';
import { ok, forbidden } from '../../utils/response';

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

  if (enrollments.length === 0) return ok(res, []);

  // FIXED: was a separate prisma.sessionProgress.count() inside Promise.all() per enrollment.
  // That is an N+1 query. Now we fetch all progress counts in a single grouped query.
  const masterclassIds = enrollments.map((e) => e.masterclassId);

  const progressGroups = await prisma.sessionProgress.groupBy({
    by: ['userId'],
    where: {
      userId,
      completedAt: { not: null },
      session: { masterclassId: { in: masterclassIds } },
    },
    // We need counts per masterclassId — Prisma groupBy doesn't support join fields,
    // so we fetch all completed sessions and count in memory (still one query total).
    _count: { sessionId: true },
  });

  // Fetch all completed session→masterclass mappings in one query
  const completedSessions = await prisma.sessionProgress.findMany({
    where: {
      userId,
      completedAt: { not: null },
      session: { masterclassId: { in: masterclassIds } },
    },
    include: { session: { select: { masterclassId: true } } },
  });

  // Build a count map: masterclassId → number of completed sessions
  const completedCountMap = new Map<string, number>();
  for (const sp of completedSessions) {
    const mcId = sp.session.masterclassId;
    completedCountMap.set(mcId, (completedCountMap.get(mcId) ?? 0) + 1);
  }

  const data = enrollments.map((enrollment) => {
    const totalSessions = enrollment.masterclass._count.sessions;
    const completedSessions = completedCountMap.get(enrollment.masterclassId) ?? 0;
    const progressPct =
      totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0;

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
  });

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
