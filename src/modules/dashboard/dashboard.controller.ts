/**
 * @openapi
 * components:
 *   schemas:
 *     DashboardStats:
 *       type: object
 *       properties:
 *         totalUsers:
 *           type: integer
 *           example: 120
 *         totalMasterclasses:
 *           type: integer
 *           example: 8
 *         totalEnrollments:
 *           type: integer
 *           example: 340
 *         netRevenueCents:
 *           type: integer
 *           example: 150000
 *         refundedCents:
 *           type: integer
 *           example: 20000
 *         failedPayments:
 *           type: integer
 *           example: 5
 *
 *     RecentPayment:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         amountCents:
 *           type: integer
 *         status:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         user:
 *           type: object
 *           properties:
 *             firstName:
 *               type: string
 *             lastName:
 *               type: string
 *             email:
 *               type: string
 *             avatarUrl:
 *               type: string
 *               nullable: true
 *         masterclass:
 *           type: object
 *           properties:
 *             title:
 *               type: string
 *
 *     Inquiry:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         email:
 *           type: string
 *         message:
 *           type: string
 *         status:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *
 *     ActiveMasterclass:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         title:
 *           type: string
 *         status:
 *           type: string
 *         enrolledCount:
 *           type: integer
 *
 *     DashboardResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           type: object
 *           properties:
 *             stats:
 *               $ref: '#/components/schemas/DashboardStats'
 *             recentPayments:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/RecentPayment'
 *             recentInquiries:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Inquiry'
 *             activeMasterclasses:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ActiveMasterclass'
 */
import { Request, Response } from 'express';
import { prisma } from '../../config/database';
import { ok } from '../../utils/response';

export async function getDashboard(req: Request, res: Response) {
  const [
    totalUsers,
    totalMasterclasses,
    totalEnrollments,
    revenueResult,
    refundedResult,
    failedPayments,
    recentPayments,
    recentInquiries,
    activeMasterclasses,
  ] = await Promise.all([
    prisma.user.count({ where: { role: 'member' } }),
    prisma.masterclass.count({ where: { isPublished: true } }),
    prisma.enrollment.count(),
    prisma.payment.aggregate({ where: { status: 'succeeded' }, _sum: { amountCents: true } }),
    prisma.payment.aggregate({ where: { status: 'refunded' }, _sum: { amountCents: true } }),
    prisma.payment.count({ where: { status: 'failed' } }),
    prisma.payment.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { firstName: true, lastName: true, email: true, avatarUrl: true } },
        masterclass: { select: { title: true } },
      },
    }),
    prisma.inquiry.findMany({
      take: 5,
      where: { status: 'open' },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.masterclass.findMany({
      where: { status: 'active', isPublished: true },
      include: { _count: { select: { enrollments: true } } },
    }),
  ]);

  return ok(res, {
    stats: {
      totalUsers,
      totalMasterclasses,
      totalEnrollments,
      netRevenueCents: revenueResult._sum.amountCents || 0,
      refundedCents: refundedResult._sum.amountCents || 0,
      failedPayments,
    },
    recentPayments,
    recentInquiries,
    activeMasterclasses: activeMasterclasses.map((mc) => ({
      ...mc,
      enrolledCount: mc._count.enrollments,
    })),
  });
}
