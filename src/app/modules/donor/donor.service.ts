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

  const donorEmail = safeDonor.email?.toLowerCase();
  const donorPhone = safeDonor.phone?.replace(/\D/g, '');
  const donorId = (safeDonor._id || safeDonor.id || id).toString().toLowerCase();

  const donorRequests = dataStore.requests.filter((r) => {
    const rTargetId = (r.targetDonorId || '').toString().toLowerCase();
    const rAltId = (r.targetDonorAltId || '').toString().toLowerCase();
    const rEmail = (r.targetDonorEmail || '').toLowerCase();
    const rPhone = (r.targetDonorPhone || '').replace(/\D/g, '');

    return (
      rTargetId === donorId ||
      rAltId === donorId ||
      (donorEmail && rEmail === donorEmail) ||
      (donorPhone && rPhone && (rPhone === donorPhone || rPhone.endsWith(donorPhone) || donorPhone.endsWith(rPhone)))
    );
  });
  let latestReqTime = (safeDonor as any).lastRequestedAt
    ? new Date((safeDonor as any).lastRequestedAt).getTime()
    : 0;
  if (donorRequests.length > 0) {
    const maxReq = Math.max(...donorRequests.map((r) => new Date(r.createdAt).getTime()));
    if (maxReq > latestReqTime) latestReqTime = maxReq;
  }

  return {
    ...safeDonor,
    lastRequestedAt: latestReqTime > 0 ? new Date(latestReqTime).toISOString() : null,
  };
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

const updateDonorProfile = async (userId: string, payload: any) => {
  const existingUser = await dataStore.findUserById(userId);
  if (!existingUser) {
    throw new Error('User not found.');
  }

  // Medical Safety Constraint: bloodGroup is strictly locked / immutable
  const updates: any = {};
  if (payload.name) updates.name = payload.name.trim();
  if (payload.phone) updates.phone = payload.phone.trim();
  if (payload.division) updates.division = payload.division;
  if (payload.district) updates.district = payload.district;
  if (payload.upazila !== undefined) updates.upazila = payload.upazila;
  if (payload.note !== undefined) updates.note = payload.note.trim(); // Can update or empty to remove
  if (payload.lastDonationDate) updates.lastDonationDate = new Date(payload.lastDonationDate);
  if (payload.isAvailable !== undefined) updates.isAvailable = Boolean(payload.isAvailable);
  if (payload.gender) updates.gender = payload.gender;
  if (payload.totalDonations !== undefined) updates.totalDonations = Math.max(0, Number(payload.totalDonations) || 0);

  const updatedUser = await dataStore.updateUser(userId, updates);
  const { password: _, ...safeUser } = updatedUser;
  return safeUser;
};

const addReview = async (donorId: string, reviewData: any) => {
  const donor = await dataStore.findUserById(donorId);
  if (!donor) {
    throw new Error('Donor not found.');
  }
  return await dataStore.addReview({
    donorId,
    donorName: donor.name,
    reviewerName: reviewData.reviewerName || 'কৃতজ্ঞ রোগী / স্বজন',
    reviewerContact: reviewData.reviewerContact || '',
    rating: Math.min(5, Math.max(1, Number(reviewData.rating) || 5)),
    comment: reviewData.comment || '',
  });
};

const getReviews = async (donorId: string) => {
  return await dataStore.getReviews(donorId);
};

const cancelDonorRequest = async (donorId: string) => {
  const donor = await dataStore.findUserById(donorId);
  const candidateIds: string[] = [donorId];
  if (donor) {
    if (donor._id) candidateIds.push(donor._id.toString());
    if (donor.id) candidateIds.push(donor.id.toString());
    if (donor.email) candidateIds.push(donor.email.toLowerCase());
    if (donor.phone) candidateIds.push(donor.phone.replace(/\D/g, ''));
  }
  await dataStore.clearDonorRequest(candidateIds);
  return { success: true };
};

export const DonorService = {
  getAllDonors,
  getDonorById,
  updateDonorAvailability,
  updateDonorProfile,
  addReview,
  getReviews,
  cancelDonorRequest,
};

