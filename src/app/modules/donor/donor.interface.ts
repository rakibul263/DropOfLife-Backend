export interface IDonorFilter {
  bloodGroup?: string;
  division?: string;
  district?: string;
  isAvailable?: boolean;
}

export interface IToggleAvailabilityPayload {
  isAvailable: boolean;
}
