import { Response } from 'express';
import { PaymentService } from './payment.service';
import { catchAsync } from '../../utils/catchAsync';
import { sendResponse } from '../../utils/sendResponse';
import { CustomAuthRequest } from '../../middlewares/auth';

const createPaymentIntent = catchAsync(
  async (req: CustomAuthRequest, res: Response): Promise<void> => {
    const { amount = 1000, currency = 'bdt', purpose = 'Lifesaver_Supporter_Fund' } = req.body;

    const result = await PaymentService.createPaymentIntent(
      amount,
      currency,
      purpose,
      req.user
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
    const { paymentIntentId, amount = 2500, purpose = 'Lifesaver_Supporter_Fund' } = req.body;

    const receipt = await PaymentService.confirmPayment(
      paymentIntentId,
      amount,
      purpose,
      req.user
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Payment confirmed successfully. Thank you for saving lives!',
      data: { receipt },
    });
  }
);

export const PaymentController = {
  createPaymentIntent,
  confirmPayment,
};
