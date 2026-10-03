import mongoose, { Document, Schema } from 'mongoose';
import { BloodGroup, RequestStatus, UrgencyLevel } from './bloodRequest.interface';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const URGENCY_LEVELS = ['Standard', 'Urgent', 'Critical'];
const REQUEST_STATUS = ['Pending', 'In Progress', 'Fulfilled', 'Cancelled'];

export interface IBloodRequestDocument extends Document {
  requesterId: mongoose.Types.ObjectId | string;
  requesterName: string;
  requesterPhone: string;
  patientName: string;
  bloodGroup: BloodGroup;
  unitsNeeded: number;
  urgencyLevel: UrgencyLevel;
  hospitalName: string;
  hospitalAddress: string;
  district: string;
  division?: string;
  reason: string;
  contactNumber: string;
  requiredDate: Date;
  status: RequestStatus;
  matchedDonorsCount: number;
  assignedDonors: string[];
  createdAt: Date;
  updatedAt: Date;
}

const BloodRequestSchema = new Schema<IBloodRequestDocument>(
  {
    requesterId: { type: Schema.Types.ObjectId, ref: 'User' },
    requesterName: { type: String, required: true },
    requesterPhone: { type: String, default: '' },
    patientName: { type: String, required: true },
    bloodGroup: { type: String, enum: BLOOD_GROUPS, required: true },
    unitsNeeded: { type: Number, required: true, min: 1, default: 1 },
    urgencyLevel: {
      type: String,
      enum: URGENCY_LEVELS,
      default: 'Urgent',
    },
    hospitalName: { type: String, required: true },
    hospitalAddress: { type: String, required: true },
    district: { type: String, required: true, default: 'Dhaka' },
    division: { type: String, default: 'Dhaka' },
    reason: { type: String, default: 'Emergency Medical Need' },
    contactNumber: { type: String, required: true },
    requiredDate: { type: Date, default: () => new Date() },
    status: { type: String, enum: REQUEST_STATUS, default: 'Pending' },
    matchedDonorsCount: { type: Number, default: 0 },
    assignedDonors: [{ type: String }],
  },
  { timestamps: true }
);

export const BloodRequestModel =
  mongoose.models.BloodRequest ||
  mongoose.model<IBloodRequestDocument>('BloodRequest', BloodRequestSchema);
