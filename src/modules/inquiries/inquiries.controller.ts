import { Request, Response } from 'express';
import { prisma } from '../../config/database';
import { ok, created, notFound } from '../../utils/response';
import { sendInquiryNotificationEmail, sendInquiryReplyEmail } from '../../utils/email';

export async function submitInquiry(req: Request, res: Response) {
  const inquiry = await prisma.inquiry.create({ data: req.body });
  await sendInquiryNotificationEmail(inquiry.senderName, inquiry.senderEmail, inquiry.message);
  return created(res, { id: inquiry.id });
}

export async function listInquiries(req: Request, res: Response) {
  const { status, sort } = req.query;
  const inquiries = await prisma.inquiry.findMany({
    where: status ? { status: status as 'open' | 'closed' } : undefined,
    orderBy: { createdAt: sort === 'oldest' ? 'asc' : 'desc' },
  });
  return ok(res, inquiries);
}

export async function getInquiry(req: Request, res: Response) {
  const inquiry = await prisma.inquiry.findUnique({ where: { id: req.params.id } });
  if (!inquiry) return notFound(res);
  return ok(res, inquiry);
}

export async function replyToInquiry(req: Request, res: Response) {
  const inquiry = await prisma.inquiry.findUnique({ where: { id: req.params.id } });
  if (!inquiry) return notFound(res);

  const updated = await prisma.inquiry.update({
    where: { id: req.params.id },
    data: { adminReply: req.body.replyText, repliedAt: new Date(), status: 'closed' },
  });

  await sendInquiryReplyEmail(inquiry.senderEmail, inquiry.senderName, req.body.replyText);
  return ok(res, updated);
}

export async function handleInquiry(req: Request, res: Response) {
  const inquiry = await prisma.inquiry.update({
    where: { id: req.params.id },
    data: { status: 'closed', handledAt: new Date() },
  });
  return ok(res, inquiry);
}
