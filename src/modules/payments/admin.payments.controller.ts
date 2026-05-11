import { Request, Response } from 'express';
import { prisma } from '../../config/database';
import { ok, notFound, badRequest } from '../../utils/response';
import { getPaginationParams, getPaginationMeta, getSkip } from '../../utils/pagination';

export async function listPayments(req: Request, res: Response) {
  const { from, to, status } = req.query;
  const params = getPaginationParams(req.query as { page?: string; limit?: string });

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (from || to) {
    where.createdAt = {
      ...(from ? { gte: new Date(from as string) } : {}),
      ...(to ? { lte: new Date(to as string) } : {}),
    };
  }

  const [payments, total] = await Promise.all([
    prisma.payment.findMany({
      where,
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true, avatarUrl: true } },
        masterclass: { select: { id: true, title: true } },
      },
      skip: getSkip(params),
      take: params.limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.payment.count({ where }),
  ]);

  // Aggregate stats
  const [netResult, refundedResult, failedCount] = await Promise.all([
    prisma.payment.aggregate({ where: { ...where, status: 'succeeded' }, _sum: { amountCents: true } }),
    prisma.payment.aggregate({ where: { ...where, status: 'refunded' }, _sum: { amountCents: true } }),
    prisma.payment.count({ where: { ...where, status: 'failed' } }),
  ]);

  const stats = {
    netRevenueCents: netResult._sum.amountCents || 0,
    refundedCents: refundedResult._sum.amountCents || 0,
    failedCount,
  };

  return ok(res, { payments, stats }, getPaginationMeta(total, params));
}

export async function refundPayment(req: Request, res: Response) {
  const payment = await prisma.payment.findUnique({ where: { id: req.params.id } });
  if (!payment) return notFound(res);
  if (payment.status !== 'succeeded') return badRequest(res, 'Only succeeded payments can be refunded');

  // ── Uncomment when Stripe is configured ────────────────────────────────
  // const stripe = new Stripe(env.STRIPE_SECRET_KEY!);
  // const refund = await stripe.refunds.create({ payment_intent: payment.gatewayReference! });
  // The webhook (charge.refunded) will update the DB automatically
  // return ok(res, { message: 'Refund initiated', refundId: refund.id });
  // ─────────────────────────────────────────────────────────────────────

  // Placeholder until payment gateway is configured
  const updated = await prisma.payment.update({
    where: { id: req.params.id },
    data: { status: 'refunded', refundedAt: new Date() },
  });

  return ok(res, updated);
}

export async function exportCsv(req: Request, res: Response) {
  const { from, to } = req.query;

  const where: Record<string, unknown> = {};
  if (from || to) {
    where.createdAt = {
      ...(from ? { gte: new Date(from as string) } : {}),
      ...(to ? { lte: new Date(to as string) } : {}),
    };
  }

  const payments = await prisma.payment.findMany({
    where,
    include: {
      user: { select: { email: true, firstName: true, lastName: true } },
      masterclass: { select: { title: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  const headers = ['Date', 'User', 'Email', 'Masterclass', 'Amount (USD)', 'Status'];
  const rows = payments.map((p) => [
    p.createdAt.toISOString().split('T')[0],
    `${p.user.firstName} ${p.user.lastName}`,
    p.user.email,
    p.masterclass.title,
    (p.amountCents / 100).toFixed(2),
    p.status,
  ]);

  const csv = [headers, ...rows].map((row) => row.map((v) => `"${v}"`).join(',')).join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="payments-export-${Date.now()}.csv"`);
  return res.send(csv);
}
