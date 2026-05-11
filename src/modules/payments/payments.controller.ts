import { Request, Response } from 'express';
import { AuthRequest } from '../../middleware/authenticate';
import { prisma } from '../../config/database';
import { env } from '../../config/env';
import { ok, created, badRequest, notFound, serverError } from '../../utils/response';
import { sendPaymentReceiptEmail } from '../../utils/email';

// ── CHECKOUT ────────────────────────────────────────────────────────────────
export async function createCheckout(req: AuthRequest, res: Response) {
  const userId = req.user!.id;
  const { masterclassId } = req.body;

  if (!masterclassId) return badRequest(res, 'masterclassId is required');

  const masterclass = await prisma.masterclass.findUnique({ where: { id: masterclassId, isPublished: true } });
  if (!masterclass) return notFound(res, 'Masterclass not found');

  // Check already enrolled
  const existing = await prisma.enrollment.findFirst({ where: { userId, masterclassId } });
  if (existing) return badRequest(res, 'You are already enrolled in this masterclass');

  // ── Stripe integration (uncomment when STRIPE_SECRET_KEY is set) ──────────
  // if (!env.STRIPE_SECRET_KEY) return badRequest(res, 'Payment gateway not configured yet');
  // const stripe = new Stripe(env.STRIPE_SECRET_KEY);
  // const paymentIntent = await stripe.paymentIntents.create({
  //   amount: masterclass.priceCents,
  //   currency: masterclass.currency || 'usd',
  //   metadata: { userId, masterclassId },
  // });
  // Create a pending payment record
  // const payment = await prisma.payment.create({
  //   data: { userId, masterclassId, amountCents: masterclass.priceCents, currency: 'usd', status: 'pending', gatewayReference: paymentIntent.id },
  // });
  // return ok(res, { clientSecret: paymentIntent.client_secret, paymentIntentId: paymentIntent.id, amountCents: masterclass.priceCents });
  // ─────────────────────────────────────────────────────────────────────────

  // Placeholder response until payment gateway is chosen
  return ok(res, {
    message: 'Payment gateway not configured yet',
    masterclassId,
    amountCents: masterclass.priceCents,
    currency: 'usd',
  });
}

// ── STRIPE WEBHOOK ───────────────────────────────────────────────────────────
export async function stripeWebhook(req: Request, res: Response) {
  // ── Uncomment when Stripe is configured ──────────────────────────────────
  // const sig = req.headers['stripe-signature'] as string;
  // if (!env.STRIPE_WEBHOOK_SECRET) return res.sendStatus(400);
  // let event;
  // try {
  //   event = stripe.webhooks.constructEvent(req.body, sig, env.STRIPE_WEBHOOK_SECRET);
  // } catch {
  //   return res.status(400).send('Webhook signature verification failed');
  // }
  // switch (event.type) {
  //   case 'payment_intent.succeeded':
  //     await handlePaymentSucceeded(event.data.object);
  //     break;
  //   case 'payment_intent.payment_failed':
  //     await handlePaymentFailed(event.data.object);
  //     break;
  //   case 'charge.refunded':
  //     await handleRefund(event.data.object);
  //     break;
  // }
  // ─────────────────────────────────────────────────────────────────────────
  return res.sendStatus(200);
}

async function handlePaymentSucceeded(paymentIntent: { id: string; metadata: { userId: string; masterclassId: string } }) {
  const { userId, masterclassId } = paymentIntent.metadata;

  await prisma.$transaction(async (tx) => {
    const payment = await tx.payment.update({
      where: { gatewayReference: paymentIntent.id },
      data: { status: 'succeeded' },
    });

    await tx.enrollment.create({
      data: { userId, masterclassId, paymentId: payment.id },
    });
  });

  const user = await prisma.user.findUnique({ where: { id: userId } });
  const masterclass = await prisma.masterclass.findUnique({ where: { id: masterclassId } });
  if (user && masterclass) {
    await sendPaymentReceiptEmail(user.email, user.firstName, masterclass.title, masterclass.priceCents);
  }
}

async function handlePaymentFailed(paymentIntent: { id: string }) {
  await prisma.payment.updateMany({
    where: { gatewayReference: paymentIntent.id },
    data: { status: 'failed' },
  });
}

async function handleRefund(charge: { payment_intent: string }) {
  await prisma.payment.updateMany({
    where: { gatewayReference: charge.payment_intent as string },
    data: { status: 'refunded', refundedAt: new Date() },
  });
}

// ── MY PAYMENTS ───────────────────────────────────────────────────────────────
export async function getMyPayments(req: AuthRequest, res: Response) {
  const userId = req.user!.id;
  const payments = await prisma.payment.findMany({
    where: { userId },
    include: { masterclass: { select: { id: true, title: true, coverImageUrl: true } } },
    orderBy: { createdAt: 'desc' },
  });
  return ok(res, payments);
}
