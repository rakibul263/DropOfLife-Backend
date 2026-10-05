import { Router } from 'express';
import { PaymentController } from './payment.controller';

const router = Router();

router.post('/create-payment-intent', PaymentController.createPaymentIntent);
router.post('/confirm', PaymentController.confirmPayment);
router.post('/webhook', PaymentController.handleStripeWebhook);
router.get('/webhook', (req, res) => res.json({ status: 'active', gateway: 'Stripe' }));

export const PaymentRoutes = router;

