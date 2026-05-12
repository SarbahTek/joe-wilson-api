import { Request, Response } from 'express';
import { prisma } from '../../config/database';
import { ok, created, notFound } from '../../utils/response';
import { sendInquiryNotificationEmail, sendInquiryReplyEmail } from '../../utils/email';

// FIXED: sanitize user-supplied strings before embedding in HTML emails.
// Prevents HTML injection / stored XSS in the admin's inbox.
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export async function submitInquiry(req: Request, res: Response) {
  // Input is already validated by the Zod schema in inquiries.routes.ts
  const inquiry = await prisma.inquiry.create({ data: req.body });

  // Pass escaped values to the email utility
  await sendInquiryNotificationEmail(
    escapeHtml(inquiry.senderName),
    escapeHtml(inquiry.senderEmail),
    escapeHtml(inquiry.message)
  );

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

  await sendInquiryReplyEmail(inquiry.senderEmail, escapeHtml(inquiry.senderName), req.body.replyText);
  return ok(res, updated);
}

export async function handleInquiry(req: Request, res: Response) {
  const inquiry = await prisma.inquiry.update({
    where: { id: req.params.id },
    data: { status: 'closed', handledAt: new Date() },
  });
  return ok(res, inquiry);
}
