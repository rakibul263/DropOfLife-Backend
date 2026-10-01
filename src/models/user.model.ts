import mongoose, { Document, Schema } from 'mongoose';
import { BloodGroup, BLOOD_GROUPS, UserRole, USER_ROLES } from '../constants';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  phone?: string;
  bloodGroup?: BloodGroup;
  isAvailable: boolean;
  lastDonationDate?: Date;
  division?: string;
  district?: string;
  upazila?: string;
  organizationName?: string;
  licenseNumber?: string;
  isVerified: boolean;
  totalDonations: number;
  avatarUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, enum: USER_ROLES, default: 'donor' },
    phone: { type: String, default: '' },
    bloodGroup: { type: String, enum: BLOOD_GROUPS },
    isAvailable: { type: Boolean, default: true },
    lastDonationDate: { type: Date },
    division: { type: String, default: 'Dhaka' },
    district: { type: String, default: 'Dhaka' },
    upazila: { type: String, default: 'Mirpur' },
    organizationName: { type: String, default: '' },
    licenseNumber: { type: String, default: '' },
    isVerified: { type: Boolean, default: false },
    totalDonations: { type: Number, default: 0 },
    avatarUrl: { type: String, default: '' },
  },
  { timestamps: true }
);

export const UserModel = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
