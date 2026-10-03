export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
export type UrgencyLevel = 'Standard' | 'Urgent' | 'Critical';
export type RequestStatus = 'Pending' | 'In Progress' | 'Fulfilled' | 'Cancelled';

export interface IBloodRequestFilter {
  status?: string;
  bloodGroup?: string;
  urgencyLevel?: string;
}

export interface ICreateBloodRequestPayload {
  requesterId?: string;
  requesterName?: string;
  patientName: string;
  bloodGroup: BloodGroup;
  unitsNeeded: number;
  urgencyLevel?: UrgencyLevel;
  hospitalName: string;
  hospitalAddress: string;
  district?: string;
  division?: string;
  reason?: string;
  contactNumber: string;
  requiredDate?: Date | string;
}
