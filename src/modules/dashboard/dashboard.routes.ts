import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { requireAdmin } from '../../middleware/requireAdmin';
import * as controller from './dashboard.controller';

const router = Router();

/**
 * @openapi
 * /v1/admin/dashboard:
 *   get:
 *     summary: Get admin dashboard data
 *     description: Returns platform statistics, recent payments, inquiries, and active masterclasses
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DashboardResponse'
 *       401:
 *         description: Unauthorized (missing or invalid token)
 *       403:
 *         description: Forbidden (admin access required)
 */
router.get('/', authenticate, requireAdmin, controller.getDashboard);

export default router;