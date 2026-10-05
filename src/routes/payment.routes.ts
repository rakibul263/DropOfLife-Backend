import { Router } from 'express';
import {
  createPaymentIntent,
  confirmPayment,
  handleStripeWebhook,
} from '../controllers/payment.controller';

const router = Router();

router.post('/create-payment-intent', createPaymentIntent);
router.post('/confirm', confirmPayment);
router.post('/webhook', handleStripeWebhook);
router.get('/webhook', (req, res) => res.json({ status: 'active', gateway: 'Stripe' }));

export default router;
