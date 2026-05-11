import { Request, Response } from 'express';
import { prisma } from '../../config/database';
import { ok, created, notFound } from '../../utils/response';
import { sendQuoteNotificationEmail } from '../../utils/email';

export async function submitQuote(req: Request, res: Response) {
  const data = { ...req.body, eventDate: req.body.eventDate ? new Date(req.body.eventDate) : undefined };
  const quote = await prisma.quoteRequest.create({ data });

  const service = await prisma.service.findUnique({ where: { id: req.body.serviceId } });
  await sendQuoteNotificationEmail(req.body.clientName, req.body.clientEmail, service?.title || 'Unknown');

  return created(res, { id: quote.id });
}

export async function listQuotes(req: Request, res: Response) {
  const { status } = req.query;
  const quotes = await prisma.quoteRequest.findMany({
    where: status ? { status: status as 'new' | 'reviewing' | 'quoted' | 'booked' | 'closed' } : undefined,
    include: { service: { select: { id: true, title: true } } },
    orderBy: { createdAt: 'desc' },
  });
  return ok(res, quotes);
}

export async function getQuote(req: Request, res: Response) {
  const quote = await prisma.quoteRequest.findUnique({
    where: { id: req.params.id },
    include: { service: true },
  });
  if (!quote) return notFound(res);
  return ok(res, quote);
}

export async function updateQuoteStatus(req: Request, res: Response) {
  const quote = await prisma.quoteRequest.update({
    where: { id: req.params.id },
    data: { status: req.body.status, adminNotes: req.body.adminNotes },
  });
  return ok(res, quote);
}
