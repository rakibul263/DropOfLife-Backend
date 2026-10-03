import { Router } from 'express';
import { PaymentController } from './payment.controller';

const router = Router();

router.post('/create-payment-intent', PaymentController.createPaymentIntent);
router.post('/confirm', PaymentController.confirmPayment);

export const PaymentRoutes = router;
