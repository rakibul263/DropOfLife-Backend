import mongoose, { Document, Schema } from 'mongoose';

export interface ICamp extends Document {
  providerId: mongoose.Types.ObjectId | string;
  providerName: string;
  title: string;
  description: string;
  venueAddress: string;
  district: string;
  division: string;
  startDate: Date;
  endDate: Date;
  targetUnits: number;
  collectedUnits: number;
  status: 'Upcoming' | 'Ongoing' | 'Completed';
  contactPhone: string;
  volunteersCount: number;
  registeredVolunteers: string[];
}

const CampSchema = new Schema<ICamp>(
  {
    providerId: { type: Schema.Types.ObjectId, ref: 'User' },
    providerName: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    venueAddress: { type: String, required: true },
    district: { type: String, required: true, default: 'Dhaka' },
    division: { type: String, default: 'Dhaka' },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    targetUnits: { type: Number, default: 50 },
    collectedUnits: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['Upcoming', 'Ongoing', 'Completed'],
      default: 'Upcoming',
    },
    contactPhone: { type: String, required: true },
    volunteersCount: { type: Number, default: 0 },
    registeredVolunteers: [{ type: String }],
  },
  { timestamps: true }
);

export const CampModel =
  mongoose.models.Camp || mongoose.model<ICamp>('Camp', CampSchema);
