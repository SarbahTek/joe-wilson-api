import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { requireAdmin } from '../../middleware/requireAdmin';
import * as controller from './admin.payments.controller';

const router = Router();

router.use(authenticate, requireAdmin);

router.get('/', controller.listPayments);
router.post('/:id/refund', controller.refundPayment);
router.get('/export/csv', controller.exportCsv);

export default router;
