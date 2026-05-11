import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { requireAdmin } from '../../middleware/requireAdmin';
import { validate } from '../../middleware/validate';
import * as controller from './inquiries.controller';
import { z } from 'zod';

const submitSchema = z.object({
  senderName: z.string().min(1).max(255),
  senderEmail: z.string().email(),
  senderPhone: z.string().optional(),
  type: z.enum(['general', 'booking']),
  subject: z.string().optional(),
  message: z.string().min(1),
});

const replySchema = z.object({ replyText: z.string().min(1) });

const router = Router();

// Public
router.post('/', validate(submitSchema), controller.submitInquiry);

// Admin
router.get('/', authenticate, requireAdmin, controller.listInquiries);
router.get('/:id', authenticate, requireAdmin, controller.getInquiry);
router.post('/:id/reply', authenticate, requireAdmin, validate(replySchema), controller.replyToInquiry);
router.patch('/:id/handle', authenticate, requireAdmin, controller.handleInquiry);

export default router;
