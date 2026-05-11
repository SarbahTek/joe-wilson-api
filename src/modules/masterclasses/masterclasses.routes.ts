import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { requireEnrollment } from '../../middleware/requireEnrollment';
import * as controller from './masterclasses.controller';

const router = Router();

router.get('/', authenticate, controller.listMasterclasses);
router.get('/:id', authenticate, controller.getMasterclass);
router.get('/:id/sessions', authenticate, controller.getMasterclassSessions);

export default router;
