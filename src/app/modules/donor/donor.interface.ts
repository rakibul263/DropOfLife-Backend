export interface IDonorFilter {
  bloodGroup?: string;
  division?: string;
  district?: string;
  isAvailable?: boolean;
  excludeUserId?: string;
}

export interface IToggleAvailabilityPayload {
  isAvailable: boolean;
}
