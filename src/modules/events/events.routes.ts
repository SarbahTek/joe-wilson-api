import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { requireAdmin } from '../../middleware/requireAdmin';
import * as controller from './events.controller';

const router = Router();

router.get('/', controller.listEvents);
router.post('/', authenticate, requireAdmin, controller.createEvent);
router.patch('/:id', authenticate, requireAdmin, controller.updateEvent);
router.delete('/:id', authenticate, requireAdmin, controller.deleteEvent);

export default router;
