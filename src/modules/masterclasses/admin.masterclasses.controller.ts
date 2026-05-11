import { Request, Response } from 'express';
import { prisma } from '../../config/database';
import { ok, created, notFound } from '../../utils/response';

export async function listMasterclasses(req: Request, res: Response) {
  const masterclasses = await prisma.masterclass.findMany({
    include: {
      _count: { select: { sessions: true, enrollments: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Calculate revenue for each masterclass
  const data = await Promise.all(
    masterclasses.map(async (mc) => {
      const revenueResult = await prisma.payment.aggregate({
        where: { masterclassId: mc.id, status: 'succeeded' },
        _sum: { amountCents: true },
      });

      return {
        id: mc.id,
        title: mc.title,
        status: mc.status,
        priceCents: mc.priceCents,
        isPublished: mc.isPublished,
        startsAt: mc.startsAt,
        endsAt: mc.endsAt,
        sessionsCount: mc._count.sessions,
        enrolledCount: mc._count.enrollments,
        revenueCents: revenueResult._sum.amountCents || 0,
        createdAt: mc.createdAt,
      };
    })
  );

  return ok(res, data);
}

export async function createMasterclass(req: Request, res: Response) {
  const data = {
    ...req.body,
    startsAt: new Date(req.body.startsAt),
    endsAt: new Date(req.body.endsAt),
  };
  const masterclass = await prisma.masterclass.create({ data });
  return created(res, masterclass);
}

export async function updateMasterclass(req: Request, res: Response) {
  const data = {
    ...req.body,
    ...(req.body.startsAt && { startsAt: new Date(req.body.startsAt) }),
    ...(req.body.endsAt && { endsAt: new Date(req.body.endsAt) }),
  };
  const masterclass = await prisma.masterclass.update({
    where: { id: req.params.id },
    data,
  });
  return ok(res, masterclass);
}

export async function deleteMasterclass(req: Request, res: Response) {
  // Soft delete — unpublish rather than destroy enrolled users' access
  const masterclass = await prisma.masterclass.update({
    where: { id: req.params.id },
    data: { isPublished: false, status: 'completed' },
  });
  return ok(res, masterclass);
}

export async function getMasterclassEnrollments(req: Request, res: Response) {
  const { id } = req.params;

  const masterclass = await prisma.masterclass.findUnique({ where: { id } });
  if (!masterclass) return notFound(res);

  const enrollments = await prisma.enrollment.findMany({
    where: { masterclassId: id },
    include: {
      user: {
        select: { id: true, email: true, firstName: true, lastName: true, avatarUrl: true },
      },
      payment: { select: { amountCents: true, status: true, createdAt: true } },
    },
    orderBy: { enrolledAt: 'desc' },
  });

  return ok(res, enrollments);
}

export async function addSession(req: Request, res: Response) {
  const masterclassId = req.params.id;

  const masterclass = await prisma.masterclass.findUnique({ where: { id: masterclassId } });
  if (!masterclass) return notFound(res, 'Masterclass not found');

  const data = {
    ...req.body,
    masterclassId,
    ...(req.body.scheduledAt && { scheduledAt: new Date(req.body.scheduledAt) }),
  };

  const session = await prisma.session.create({ data });
  return created(res, session);
}

export async function updateSession(req: Request, res: Response) {
  const data = {
    ...req.body,
    ...(req.body.scheduledAt && { scheduledAt: new Date(req.body.scheduledAt) }),
  };
  const session = await prisma.session.update({
    where: { id: req.params.sessionId },
    data,
  });
  return ok(res, session);
}

export async function deleteSession(req: Request, res: Response) {
  await prisma.session.delete({ where: { id: req.params.sessionId } });
  return ok(res, { success: true });
}
