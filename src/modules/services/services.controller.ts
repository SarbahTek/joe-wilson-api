import { Request, Response } from 'express';
import { prisma } from '../../config/database';
import { ok, created, notFound } from '../../utils/response';

export async function listServices(req: Request, res: Response) {
  const services = await prisma.service.findMany({
    where: { isPublished: true },
    orderBy: { orderIndex: 'asc' },
  });
  return ok(res, services);
}

export async function getService(req: Request, res: Response) {
  const service = await prisma.service.findUnique({ where: { slug: req.params.slug, isPublished: true } });
  if (!service) return notFound(res);

  const related = await prisma.service.findMany({
    where: { isPublished: true, id: { not: service.id } },
    take: 3,
    orderBy: { orderIndex: 'asc' },
    select: { id: true, slug: true, title: true, coverImageUrl: true },
  });

  return ok(res, { service, relatedServices: related });
}

export async function createService(req: Request, res: Response) {
  const service = await prisma.service.create({ data: req.body });
  return created(res, service);
}

export async function updateService(req: Request, res: Response) {
  const service = await prisma.service.update({ where: { id: req.params.id }, data: req.body });
  return ok(res, service);
}

export async function deleteService(req: Request, res: Response) {
  await prisma.service.delete({ where: { id: req.params.id } });
  return ok(res, { success: true });
}
