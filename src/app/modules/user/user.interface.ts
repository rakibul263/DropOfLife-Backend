import { BloodGroup } from '../bloodRequest/bloodRequest.interface';

export type UserRole = 'donor' | 'provider' | 'admin';

export interface IUser {
  _id?: string;
  id?: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  phone?: string;
  bloodGroup?: BloodGroup;
  isAvailable: boolean;
  lastDonationDate?: Date | string;
  division?: string;
  district?: string;
  upazila?: string;
  organizationName?: string;
  licenseNumber?: string;
  isVerified: boolean;
  totalDonations: number;
  avatarUrl?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
