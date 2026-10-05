import { Response } from 'express';
import { PaymentService } from './payment.service';
import { catchAsync } from '../../utils/catchAsync';
import { sendResponse } from '../../utils/sendResponse';
import { CustomAuthRequest } from '../../middlewares/auth';
import { config } from '../../config';

const createPaymentIntent = catchAsync(
  async (req: CustomAuthRequest, res: Response): Promise<void> => {
    const {
      amount = 1000,
      currency = 'bdt',
      purpose = 'Lifesaver_Supporter_Fund',
      donorName,
      donorEmail,
    } = req.body;

    const userObj = {
      id: req.user?.id || 'anonymous',
      name: donorName || req.user?.name || 'Lifesaver Supporter',
      email: donorEmail || req.user?.email || 'supporter@dropoflife.org',
    };

    const result = await PaymentService.createPaymentIntent(
      amount,
      currency,
      purpose,
      userObj
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Stripe payment intent generated successfully',
      data: result,
    });
  }
);

const confirmPayment = catchAsync(
  async (req: CustomAuthRequest, res: Response): Promise<void> => {
    const {
      paymentIntentId,
      amount = 2500,
      purpose = 'Lifesaver_Supporter_Fund',
      donorName,
      donorEmail,
    } = req.body;

    const userObj = {
      id: req.user?.id || 'anonymous',
      name: donorName || req.user?.name || 'Lifesaver Supporter',
      email: donorEmail || req.user?.email || 'supporter@dropoflife.org',
    };

    const receipt = await PaymentService.confirmPayment(
      paymentIntentId,
      amount,
      purpose,
      userObj
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Payment confirmed successfully. Thank you for saving lives!',
      data: { receipt },
    });
  }
);

const handleStripeWebhook = catchAsync(
  async (req: CustomAuthRequest, res: Response): Promise<void> => {
    const sig = req.headers['stripe-signature'] as string;
    const stripe = PaymentService.getStripeClient();
    const webhookSecret = config.stripeWebhookSecret;

    let event: any;
    if (stripe && webhookSecret && sig && !webhookSecret.includes('mock')) {
      try {
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
      } catch (err: any) {
        console.warn('⚠️ [Stripe Webhook Signature Verification]:', err.message);
        event = req.body;
      }
    } else {
      event = req.body;
    }

    console.log(`⚡ [Stripe Webhook Event]: ${event?.type || 'unknown'}`);
    res.status(200).json({ received: true, type: event?.type });
  }
);

export const PaymentController = {
  createPaymentIntent,
  confirmPayment,
  handleStripeWebhook,
};
