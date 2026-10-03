import { dataStore } from '../../utils/dataStore';
import { IDonorFilter } from './donor.interface';

const getAllDonors = async (filters: IDonorFilter) => {
  const donors = await dataStore.getDonors(filters);
  return {
    total: donors.length,
    donors,
  };
};

const getDonorById = async (id: string) => {
  const donor = await dataStore.findUserById(id);
  if (!donor) {
    throw new Error('Donor profile not found.');
  }
  const { password: _, ...safeDonor } = donor;
  return safeDonor;
};

const updateDonorAvailability = async (userId: string, isAvailable: boolean) => {
  const updatedUser = await dataStore.updateUser(userId, {
    isAvailable,
  });
  if (!updatedUser) {
    throw new Error('User not found.');
  }
  const { password: _, ...safeUser } = updatedUser;
  return safeUser;
};

export const DonorService = {
  getAllDonors,
  getDonorById,
  updateDonorAvailability,
};
