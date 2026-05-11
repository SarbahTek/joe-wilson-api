import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { requireAdmin } from '../../middleware/requireAdmin';
import { validate } from '../../middleware/validate';
import * as controller from './testimonials.controller';
import { z } from 'zod';

const testimonialSchema = z.object({
  quote: z.string().min(1),
  authorName: z.string().min(1).max(255),
  authorOrg: z.string().optional(),
  avatarUrl: z.string().url().optional(),
  isFeatured: z.boolean().optional(),
  orderIndex: z.number().int(),
});

const router = Router();

router.get('/', controller.listTestimonials);
router.post('/', authenticate, requireAdmin, validate(testimonialSchema), controller.createTestimonial);
router.patch('/:id', authenticate, requireAdmin, controller.updateTestimonial);
router.delete('/:id', authenticate, requireAdmin, controller.deleteTestimonial);

export default router;
