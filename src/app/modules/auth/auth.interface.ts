export interface ILoginUser {
  email: string;
  password?: string;
}

export interface ILoginResponse {
  accessToken: string;
  token: string;
  refreshToken?: string;
  user: {
    _id?: string;
    id?: string;
    name: string;
    email: string;
    role: string;
    bloodGroup?: string;
    gender?: string;
    hasDonatedBefore?: boolean;
    totalDonations?: number;
    lastDonationDate?: Date | string;
    isAvailable?: boolean;
    division?: string;
    district?: string;
  };
}

export interface IRegisterUser {
  name: string;
  email: string;
  password?: string;
  role: 'donor' | 'provider' | 'admin';
  phone?: string;
  bloodGroup?: string;
  gender?: 'Male' | 'Female' | 'Other';
  hasDonatedBefore?: boolean;
  totalDonations?: number;
  lastDonationDate?: string;
  division?: string;
  district?: string;
  upazila?: string;
  organizationName?: string;
  licenseNumber?: string;
}
