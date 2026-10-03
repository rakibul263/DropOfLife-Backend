export type CampStatus = 'Upcoming' | 'Ongoing' | 'Completed';

export interface ICamp {
  providerId: string;
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
  status: CampStatus;
  contactPhone: string;
  volunteersCount: number;
  registeredVolunteers: string[];
}

export interface ICreateCampPayload {
  title: string;
  description?: string;
  venueAddress: string;
  district?: string;
  division?: string;
  startDate: string | Date;
  endDate: string | Date;
  targetUnits?: number;
  contactPhone: string;
}
