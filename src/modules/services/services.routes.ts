import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { requireAdmin } from '../../middleware/requireAdmin';
import { validate } from '../../middleware/validate';
import * as controller from './services.controller';
import { z } from 'zod';

const serviceSchema = z.object({
  slug: z.string().min(1).max(100),
  title: z.string().min(1),
  tagline: z.string().optional(),
  description: z.string().optional(),
  coverImageUrl: z.string().url().optional(),
  isPublished: z.boolean().optional(),
  orderIndex: z.number().int(),
});

const router = Router();

router.get('/', controller.listServices);
router.get('/:slug', controller.getService);
router.post('/', authenticate, requireAdmin, validate(serviceSchema), controller.createService);
router.patch('/:id', authenticate, requireAdmin, controller.updateService);
router.delete('/:id', authenticate, requireAdmin, controller.deleteService);

export default router;
