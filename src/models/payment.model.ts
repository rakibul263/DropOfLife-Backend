import mongoose, { Document, Schema } from 'mongoose';

export interface IPayment extends Document {
  userId?: mongoose.Types.ObjectId | string;
  userName?: string;
  userEmail?: string;
  stripePaymentIntentId: string;
  amount: number; // in cents or BDT
  currency: string;
  paymentPurpose: string;
  status: 'succeeded' | 'pending' | 'failed';
  receiptUrl?: string;
  createdAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    userName: { type: String, default: 'Supporter' },
    userEmail: { type: String, default: '' },
    stripePaymentIntentId: { type: String, required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'bdt' },
    paymentPurpose: {
      type: String,
      default: 'Lifesaver_Supporter_Fund',
    },
    status: {
      type: String,
      enum: ['succeeded', 'pending', 'failed'],
      default: 'pending',
    },
    receiptUrl: { type: String, default: '' },
  },
  { timestamps: true }
);

export const PaymentModel =
  mongoose.models.Payment || mongoose.model<IPayment>('Payment', PaymentSchema);
