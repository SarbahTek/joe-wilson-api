import { Request, Response } from 'express';
import { prisma } from '../../config/database';
import { ok, created } from '../../utils/response';

export async function listEvents(req: Request, res: Response) {
  const events = await prisma.event.findMany({
    where: { isPublished: true, eventDate: { gte: new Date() } },
    orderBy: { eventDate: 'asc' },
  });
  return ok(res, events);
}

export async function createEvent(req: Request, res: Response) {
  const data = { ...req.body, eventDate: new Date(req.body.eventDate) };
  const event = await prisma.event.create({ data });
  return created(res, event);
}

export async function updateEvent(req: Request, res: Response) {
  const data = req.body.eventDate ? { ...req.body, eventDate: new Date(req.body.eventDate) } : req.body;
  const event = await prisma.event.update({ where: { id: req.params.id }, data });
  return ok(res, event);
}

export async function deleteEvent(req: Request, res: Response) {
  await prisma.event.delete({ where: { id: req.params.id } });
  return ok(res, { success: true });
}
