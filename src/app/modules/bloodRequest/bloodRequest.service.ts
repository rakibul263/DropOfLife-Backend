import { dataStore } from '../../utils/dataStore';
import { IBloodRequestFilter, ICreateBloodRequestPayload } from './bloodRequest.interface';

const getAllBloodRequests = async (filter: IBloodRequestFilter) => {
  const requests = await dataStore.getRequests({
    status: filter.status,
    bloodGroup: filter.bloodGroup,
    urgencyLevel: filter.urgencyLevel,
  });

  return {
    total: requests.length,
    requests,
  };
};

const createBloodRequest = async (payload: ICreateBloodRequestPayload) => {
  const newReq = await dataStore.createRequest({
    requesterId: payload.requesterId || 'anonymous',
    requesterName: payload.requesterName || payload.patientName,
    patientName: payload.patientName,
    bloodGroup: payload.bloodGroup,
    unitsNeeded: Number(payload.unitsNeeded || 1),
    urgencyLevel: payload.urgencyLevel || 'Urgent',
    hospitalName: payload.hospitalName,
    hospitalAddress: payload.hospitalAddress || payload.hospitalName,
    district: payload.district || 'Dhaka',
    division: payload.division || 'Dhaka',
    reason: payload.reason || 'Urgent medical transfusion needed.',
    contactNumber: payload.contactNumber,
    requiredDate: payload.requiredDate ? new Date(payload.requiredDate) : new Date(),
  });

  return newReq;
};

const updateBloodRequestStatus = async (
  id: string,
  status: string,
  donorName?: string
) => {
  const updated = await dataStore.updateRequestStatus(id, status, donorName);
  if (!updated) {
    throw new Error('Blood request not found');
  }
  return updated;
};

export const BloodRequestService = {
  getAllBloodRequests,
  createBloodRequest,
  updateBloodRequestStatus,
};
