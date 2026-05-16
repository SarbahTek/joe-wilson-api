import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { requireAdmin } from '../../middleware/requireAdmin';
import * as controller from './dashboard.controller';

const router = Router();

router.get('/', authenticate, requireAdmin, controller.getDashboard);

export default router;
