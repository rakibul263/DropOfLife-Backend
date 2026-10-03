import { BloodGroup } from '../bloodRequest/bloodRequest.interface';

export type ComponentType =
  | 'Whole Blood'
  | 'Packed Red Cells (PRBC)'
  | 'Fresh Frozen Plasma (FFP)'
  | 'Platelet Concentrate'
  | 'Cryoprecipitate';

export interface IInventory {
  providerId: string;
  providerName: string;
  bloodGroup: BloodGroup;
  componentType: ComponentType;
  unitsInStock: number;
  criticalThreshold: number;
  lastUpdated: Date;
}

export interface IUpdateInventoryStockPayload {
  unitsInStock: number;
  criticalThreshold?: number;
}
