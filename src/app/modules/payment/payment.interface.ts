export type PaymentStatus = 'succeeded' | 'pending' | 'failed';

export interface IPayment {
  userId?: string;
  userName?: string;
  userEmail?: string;
  stripePaymentIntentId: string;
  amount: number;
  currency: string;
  paymentPurpose: string;
  status: PaymentStatus;
  receiptUrl?: string;
  createdAt?: Date;
}

export interface ICreatePaymentIntentPayload {
  amount: number;
  currency?: string;
  purpose?: string;
}

export interface IConfirmPaymentPayload {
  paymentIntentId: string;
  amount: number;
  purpose?: string;
}
