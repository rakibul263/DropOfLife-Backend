import mongoose, { Document, Schema } from 'mongoose';
import { ComponentType } from './inventory.interface';
import { BloodGroup } from '../bloodRequest/bloodRequest.interface';

export interface IInventoryDocument extends Document {
  providerId: mongoose.Types.ObjectId | string;
  providerName: string;
  bloodGroup: BloodGroup;
  componentType: ComponentType;
  unitsInStock: number;
  criticalThreshold: number;
  lastUpdated: Date;
}

const InventorySchema = new Schema<IInventoryDocument>(
  {
    providerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    providerName: { type: String, required: true },
    bloodGroup: {
      type: String,
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
      required: true,
    },
    componentType: {
      type: String,
      default: 'Whole Blood',
    },
    unitsInStock: { type: Number, required: true, default: 0, min: 0 },
    criticalThreshold: { type: Number, default: 5 },
    lastUpdated: { type: Date, default: () => new Date() },
  },
  { timestamps: true }
);

export const InventoryModel =
  mongoose.models.Inventory ||
  mongoose.model<IInventoryDocument>('Inventory', InventorySchema);
