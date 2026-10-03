import { dataStore } from '../../utils/dataStore';
import { ICreateCampPayload } from './camp.interface';

const getAllCamps = async () => {
  const camps = await dataStore.getCamps();
  return {
    total: camps.length,
    camps,
  };
};

const createCamp = async (
  payload: ICreateCampPayload,
  providerId: string,
  providerName: string
) => {
  const newCamp = await dataStore.createCamp({
    providerId: providerId || 'unknown',
    providerName: providerName || 'DropOfLife Partner Hospital',
    title: payload.title,
    description: payload.description || '',
    venueAddress: payload.venueAddress,
    district: payload.district || 'Dhaka',
    division: payload.division || 'Dhaka',
    startDate: new Date(payload.startDate),
    endDate: new Date(payload.endDate),
    targetUnits: Number(payload.targetUnits || 100),
    contactPhone: payload.contactPhone,
  });

  return newCamp;
};

const registerCampVolunteer = async (campId: string, volunteerName: string) => {
  const updatedCamp = await dataStore.registerCampVolunteer(campId, volunteerName);
  if (!updatedCamp) {
    throw new Error('Camp not found.');
  }
  return updatedCamp;
};

export const CampService = {
  getAllCamps,
  createCamp,
  registerCampVolunteer,
};
