import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { requireAdmin } from '../../middleware/requireAdmin';
import { validate } from '../../middleware/validate';
import * as controller from './quotes.controller';
import { z } from 'zod';

const submitSchema = z.object({
  serviceId: z.string().uuid(),
  clientName: z.string().min(1),
  clientEmail: z.string().email(),
  clientPhone: z.string().optional(),
  eventDate: z.string().optional(),
  eventType: z.string().optional(),
  location: z.string().optional(),
  durationNotes: z.string().optional(),
  budgetMinCents: z.number().int().positive().optional(),
  budgetMaxCents: z.number().int().positive().optional(),
  projectNotes: z.string().optional(),
});

const statusSchema = z.object({
  status: z.enum(['new', 'reviewing', 'quoted', 'booked', 'closed']),
  adminNotes: z.string().optional(),
});

const router = Router();

router.post('/', validate(submitSchema), controller.submitQuote);
router.get('/', authenticate, requireAdmin, controller.listQuotes);
router.get('/:id', authenticate, requireAdmin, controller.getQuote);
router.patch('/:id/status', authenticate, requireAdmin, validate(statusSchema), controller.updateQuoteStatus);

export default router;
