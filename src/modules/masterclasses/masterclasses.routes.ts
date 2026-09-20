import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { requireEnrollment } from '../../middleware/requireEnrollment';
import * as controller from './masterclasses.controller';

const router = Router();

// Public catalog: visitors can browse published masterclasses before signing up.
router.get('/', controller.listMasterclasses);
router.get('/:id', authenticate, controller.getMasterclass);
router.get('/:id/sessions', authenticate, controller.getMasterclassSessions);

export default router;
