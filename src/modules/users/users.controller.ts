import { Request, Response } from 'express';
import { prisma } from '../../config/database';
import { ok, notFound } from '../../utils/response';
import { getPaginationParams, getPaginationMeta, getSkip } from '../../utils/pagination';

export async function listUsers(req: Request, res: Response) {
  const { q } = req.query;
  const params = getPaginationParams(req.query as { page?: string; limit?: string });

  const where = q
    ? {
        OR: [
          { email: { contains: q as string, mode: 'insensitive' as const } },
          { firstName: { contains: q as string, mode: 'insensitive' as const } },
          { lastName: { contains: q as string, mode: 'insensitive' as const } },
        ],
      }
    : {};

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip: getSkip(params),
      take: params.limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        role: true,
        createdAt: true,
        _count: { select: { enrollments: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);

  const data = users.map((u) => ({
    ...u,
    cohortsCount: u._count.enrollments,
    _count: undefined,
  }));

  return ok(res, data, getPaginationMeta(total, params));
}

export async function getUser(req: Request, res: Response) {
  const user = await prisma.user.findUnique({
    where: { id: req.params.id },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      avatarUrl: true,
      role: true,
      emailVerified: true,
      createdAt: true,
      enrollments: {
        include: { masterclass: { select: { id: true, title: true, status: true } } },
        orderBy: { enrolledAt: 'desc' },
      },
      payments: {
        include: { masterclass: { select: { id: true, title: true } } },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!user) return notFound(res);
  return ok(res, user);
}
