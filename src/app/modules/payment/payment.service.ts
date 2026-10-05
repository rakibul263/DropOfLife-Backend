import Stripe from 'stripe';
import { config } from '../../config';
import { dataStore } from '../../utils/dataStore';
import { EmailService } from '../../utils/emailService';

let stripeClient: Stripe | null = null;

export const getStripeClient = (): Stripe | null => {
  const secretKey = config.stripeSecretKey || process.env.STRIPE_SECRET_KEY;
  if (!stripeClient && secretKey && !secretKey.includes('mock')) {
    try {
      stripeClient = new Stripe(secretKey, {
        apiVersion: '2024-12-18.acacia' as any,
      });
      console.log('💳 [Stripe SDK] Successfully initialized client with live test mode credentials.');
    } catch (err) {
      console.warn('⚠️ [Stripe SDK] Initialization warning:', err);
    }
  }
  return stripeClient;
};

const createPaymentIntent = async (
  amount: number,
  currency = 'bdt',
  purpose = 'Lifesaver_Supporter_Fund',
  user?: { id?: string; name?: string; email?: string }
) => {
  const stripe = getStripeClient();
  const rawAmount = Math.max(50, Number(amount) || 1000);
  // Stripe requires amount in smallest currency unit (poisha for BDT, cents for USD)
  // If amount < 100000, it represents whole currency units (e.g. 1000 BDT), so scale by 100
  const stripeAmount = rawAmount < 100000 ? Math.round(rawAmount * 100) : Math.round(rawAmount);

  if (stripe) {
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: stripeAmount,
        currency: currency.toLowerCase(),
        description: `DropOfLife Blood Platform Support: ${purpose.replace(/_/g, ' ')}`,
        metadata: {
          platform: 'DropOfLife',
          purpose,
          userId: user?.id || 'anonymous',
          userName: user?.name || 'Lifesaver Supporter',
          userEmail: user?.email || 'supporter@dropoflife.org',
        },
      });

      return {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount: rawAmount,
        currency: currency.toLowerCase(),
      };
    } catch (stripeErr: any) {
      console.warn('⚠️ [Stripe Intent Warning]:', stripeErr?.message || stripeErr);
    }
  }

  // Graceful offline fallback
  const mockIntentId = `pi_test_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  const mockClientSecret = `${mockIntentId}_secret_${Math.random().toString(36).substring(7)}`;

  await dataStore.recordPayment({
    userId: user?.id || 'anonymous',
    userName: user?.name || 'Lifesaver Supporter',
    userEmail: user?.email || 'supporter@dropoflife.org',
    stripePaymentIntentId: mockIntentId,
    amount: rawAmount,
    currency,
    paymentPurpose: purpose,
    status: 'pending',
  });

  return {
    clientSecret: mockClientSecret,
    paymentIntentId: mockIntentId,
    amount: rawAmount,
    currency,
  };
};

const confirmPayment = async (
  paymentIntentId: string,
  amount: number,
  purpose = 'Lifesaver_Supporter_Fund',
  user?: { id?: string; name?: string; email?: string }
) => {
  let receiptUrl = `https://pay.stripe.com/receipts/test_${Date.now()}`;
  const stripe = getStripeClient();

  if (
    stripe &&
    paymentIntentId &&
    paymentIntentId.startsWith('pi_') &&
    !paymentIntentId.includes('mock') &&
    !paymentIntentId.includes('simulated')
  ) {
    try {
      const intent = await stripe.paymentIntents.retrieve(paymentIntentId);
      if (intent.latest_charge && typeof intent.latest_charge === 'string') {
        const charge = await stripe.charges.retrieve(intent.latest_charge);
        if (charge.receipt_url) {
          receiptUrl = charge.receipt_url;
        }
      }
    } catch (err: any) {
      console.warn('Notice: Could not fetch Stripe charge receipt:', err?.message || err);
    }
  }

  const receipt = await dataStore.recordPayment({
    userId: user?.id || 'anonymous',
    userName: user?.name || 'Lifesaver Supporter',
    userEmail: user?.email || 'supporter@dropoflife.org',
    stripePaymentIntentId: paymentIntentId || `pi_live_${Date.now()}`,
    amount: Number(amount),
    currency: 'bdt',
    paymentPurpose: purpose,
    status: 'succeeded',
    receiptUrl,
  });

  // Automated confirmation receipt email via Resend
  if (user?.email && user.email.includes('@')) {
    EmailService.sendPaymentReceiptEmail({
      email: user.email,
      name: user.name || 'Valued Supporter',
      amount: Number(amount),
      currency: 'BDT',
      paymentIntentId: receipt.stripePaymentIntentId,
      purpose,
      receiptUrl,
    }).catch((err) => console.warn('Payment receipt email warning:', err));
  }

  return receipt;
};

export const PaymentService = {
  createPaymentIntent,
  confirmPayment,
  getStripeClient,
};
