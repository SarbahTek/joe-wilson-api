import { Router, Request, Response } from 'express';
import express from 'express';
import { authenticate } from '../../middleware/authenticate';
import * as controller from './payments.controller';

const router = Router();

// IMPORTANT: Webhook route must use raw body parser before express.json()
router.post('/webhook', express.raw({ type: 'application/json' }), controller.stripeWebhook);

router.post('/checkout', authenticate, controller.createCheckout);
router.get('/my', authenticate, controller.getMyPayments);

export default router;
