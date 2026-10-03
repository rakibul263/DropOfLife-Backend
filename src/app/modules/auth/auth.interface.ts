export interface ILoginUser {
  email: string;
  password?: string;
}

export interface ILoginResponse {
  token: string;
  user: {
    _id?: string;
    id?: string;
    name: string;
    email: string;
    role: string;
    bloodGroup?: string;
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
  division?: string;
  district?: string;
  upazila?: string;
  organizationName?: string;
  licenseNumber?: string;
}
