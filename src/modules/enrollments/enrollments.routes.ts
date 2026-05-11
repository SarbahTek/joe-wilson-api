import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { requireAdmin } from '../../middleware/requireAdmin';
import * as controller from './enrollments.controller';

const router = Router();

router.get('/my', authenticate, controller.getMyEnrollments);
router.get('/admin/masterclass/:masterclassId', authenticate, requireAdmin, controller.getMasterclassEnrollments);

export default router;
