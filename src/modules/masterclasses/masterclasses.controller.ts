import { Response } from 'express';
import { AuthRequest } from '../../middleware/authenticate';
import { prisma } from '../../config/database';
import { ok, notFound } from '../../utils/response';

export async function listMasterclasses(req: AuthRequest, res: Response) {
  const userId = req.user!.id;

  const masterclasses = await prisma.masterclass.findMany({
    where: { isPublished: true },
    include: { _count: { select: { sessions: true, enrollments: true } } },
    orderBy: { createdAt: 'desc' },
  });

  const enrollments = await prisma.enrollment.findMany({ where: { userId }, select: { masterclassId: true } });
  const enrolledIds = new Set(enrollments.map((e) => e.masterclassId));

  const data = masterclasses.map((mc) => ({
    id: mc.id,
    title: mc.title,
    description: mc.description,
    coverImageUrl: mc.coverImageUrl,
    priceCents: mc.priceCents,
    status: mc.status,
    startsAt: mc.startsAt,
    endsAt: mc.endsAt,
    sessionsCount: mc._count.sessions,
    enrollmentsCount: mc._count.enrollments,
    isEnrolled: enrolledIds.has(mc.id),
  }));

  return ok(res, data);
}

export async function getMasterclass(req: AuthRequest, res: Response) {
  const userId = req.user!.id;
  const { id } = req.params;

  const mc = await prisma.masterclass.findUnique({
    where: { id, isPublished: true },
    include: {
      sessions: { orderBy: { orderIndex: 'asc' } },
      resources: { include: { media: true }, orderBy: { orderIndex: 'asc' } },
    },
  });

  if (!mc) return notFound(res);

  const enrollment = await prisma.enrollment.findFirst({ where: { userId, masterclassId: id } });

  const progressRecords = enrollment
    ? await prisma.sessionProgress.findMany({
        where: { userId, session: { masterclassId: id } },
        select: { sessionId: true, completedAt: true, lastWatchedSeconds: true },
      })
    : [];

  const progressMap = new Map(progressRecords.map((p) => [p.sessionId, p]));

  const sessions = mc.sessions.map((s) => ({
    id: s.id,
    title: s.title,
    description: s.description,
    orderIndex: s.orderIndex,
    status: s.status,
    scheduledAt: s.scheduledAt,
    durationSeconds: s.durationSeconds,
    progress: progressMap.get(s.id) || null,
  }));

  return ok(res, { ...mc, sessions, isEnrolled: !!enrollment });
}

export async function getMasterclassSessions(req: AuthRequest, res: Response) {
  const { id } = req.params;
  const sessions = await prisma.session.findMany({
    where: { masterclassId: id },
    orderBy: { orderIndex: 'asc' },
  });
  return ok(res, sessions);
}
