import mongoose, { Document, Schema } from 'mongoose';
import {
  BloodGroup,
  BLOOD_GROUPS,
  ComponentType,
  COMPONENT_TYPES,
} from '../constants';

export interface IInventory extends Document {
  providerId: mongoose.Types.ObjectId | string;
  providerName: string;
  bloodGroup: BloodGroup;
  componentType: ComponentType;
  unitsInStock: number;
  criticalThreshold: number;
  lastUpdated: Date;
}

const InventorySchema = new Schema<IInventory>(
  {
    providerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    providerName: { type: String, required: true },
    bloodGroup: { type: String, enum: BLOOD_GROUPS, required: true },
    componentType: {
      type: String,
      enum: COMPONENT_TYPES,
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
  mongoose.model<IInventory>('Inventory', InventorySchema);
