import { dataStore } from '../../utils/dataStore';
import { EmailService } from '../../utils/emailService';
import { IBloodRequestFilter, ICreateBloodRequestPayload } from './bloodRequest.interface';

const getAllBloodRequests = async (filter: IBloodRequestFilter) => {
  const requests = await dataStore.getRequests({
    status: filter.status,
    bloodGroup: filter.bloodGroup,
    urgencyLevel: filter.urgencyLevel,
    targetDonorId: filter.targetDonorId,
    targetDonorEmail: filter.targetDonorEmail,
    targetDonorPhone: filter.targetDonorPhone,
  });

  return {
    total: requests.length,
    requests,
  };
};

const createBloodRequest = async (payload: ICreateBloodRequestPayload) => {
  let targetDonor: any = null;

  // If a specific donor was targeted for this request, resolve comprehensively
  if (payload.targetDonorId || payload.targetDonorEmail) {
    const rawTarget = payload.targetDonorId || payload.targetDonorEmail || '';
    targetDonor =
      (await dataStore.findUserById(rawTarget)) ||
      (await dataStore.findUserByEmail(rawTarget)) ||
      (payload.targetDonorEmail ? await dataStore.findUserByEmail(payload.targetDonorEmail) : null) ||
      dataStore.users.find(
        (u) =>
          u._id?.toString() === rawTarget.toString() ||
          u.id?.toString() === rawTarget.toString() ||
          u.email?.toLowerCase() === rawTarget.toString().toLowerCase() ||
          (payload.targetDonorEmail && u.email?.toLowerCase() === payload.targetDonorEmail.toLowerCase()) ||
          (u.phone && u.phone.replace(/\D/g, '') === rawTarget.replace(/\D/g, ''))
      );

    const candidateIds: string[] = [];
    if (payload.targetDonorId) candidateIds.push(payload.targetDonorId.toString());
    if (payload.targetDonorEmail) candidateIds.push(payload.targetDonorEmail.toLowerCase());
    if (targetDonor) {
      if (targetDonor._id) candidateIds.push(targetDonor._id.toString());
      if (targetDonor.id) candidateIds.push(targetDonor.id.toString());
      if (targetDonor.email) candidateIds.push(targetDonor.email.toLowerCase());
    }

    let lastReqTime = 0;
    for (const cid of candidateIds) {
      const iso = dataStore.getDonorLastRequestedAt(cid);
      if (iso) {
        const t = new Date(iso).getTime();
        if (t > lastReqTime) lastReqTime = t;
      }
    }
    if (targetDonor && (targetDonor as any).lastRequestedAt) {
      const donorLastReq = new Date((targetDonor as any).lastRequestedAt).getTime();
      if (donorLastReq > lastReqTime) lastReqTime = donorLastReq;
    }

    const COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours
    const elapsed = Date.now() - lastReqTime;

    if (lastReqTime > 0 && elapsed < COOLDOWN_MS) {
      const remainingMs = COOLDOWN_MS - elapsed;
      const totalMinutes = Math.max(1, Math.ceil(remainingMs / (1000 * 60)));
      const remainingHours = Math.floor(totalMinutes / 60);
      const remainingMinutes = totalMinutes % 60;

      let timeTextBn = '';
      if (remainingHours > 0) {
        timeTextBn += `${remainingHours} ঘণ্টা `;
      }
      if (remainingMinutes > 0 || remainingHours === 0) {
        timeTextBn += `${remainingMinutes} মিনিট`;
      }

      const errMsgBn = `এই রক্তদাতাকে ইতিমধ্যে অনুরোধ পাঠানো হয়েছে। পরবর্তী অনুরোধ পাঠানোর আগে আরও ${timeTextBn.trim()} অপেক্ষা করতে হবে (২৪ ঘণ্টার সীমাবদ্ধতা)।`;

      const err: any = new Error(errMsgBn);
      err.statusCode = 400;
      throw err;
    }

    // Record persistent lastRequestedAt on target donor for all identifiers
    const now = new Date();
    dataStore.recordDonorRequest(candidateIds, now);
    if (targetDonor) {
      (targetDonor as any).lastRequestedAt = now;
      if (targetDonor._id || targetDonor.id) {
        await dataStore.updateUser(targetDonor._id || targetDonor.id, { lastRequestedAt: now });
      }
    }
  }

  const resolvedTargetId = payload.targetDonorId || (targetDonor ? (targetDonor._id || targetDonor.id) : null);
  const resolvedTargetAltId = targetDonor ? (targetDonor.id || targetDonor._id) : null;
  const resolvedTargetEmail = targetDonor?.email ? targetDonor.email.toLowerCase() : (payload.targetDonorEmail ? payload.targetDonorEmail.toLowerCase() : null);
  const resolvedTargetPhone = targetDonor?.phone || payload.targetDonorPhone || null;
  const resolvedTargetName = targetDonor?.name || null;

  const newReq = await dataStore.createRequest({
    requesterId: payload.requesterId || 'anonymous',
    requesterName: payload.requesterName || payload.patientName,
    requesterPhone: payload.requesterPhone || payload.contactNumber,
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
    targetDonorId: resolvedTargetId,
    targetDonorAltId: resolvedTargetAltId,
    targetDonorEmail: resolvedTargetEmail,
    targetDonorPhone: resolvedTargetPhone,
    targetDonorName: resolvedTargetName,
  });

  // If targeted directly to a donor, notify them directly via dedicated Resend email
  if (resolvedTargetEmail || (targetDonor && targetDonor.email)) {
    const donorEmail = resolvedTargetEmail || targetDonor?.email;
    if (donorEmail) {
      EmailService.sendDirectDonorRequestEmail({
        recipientEmail: donorEmail,
        donorName: resolvedTargetName || targetDonor?.name || 'Valued Lifesaver',
        requesterName: newReq.requesterName || 'রোগীর স্বজন',
        requesterPhone: newReq.requesterPhone || newReq.contactNumber,
        patientName: newReq.patientName,
        hospitalName: newReq.hospitalName,
        hospitalAddress: newReq.hospitalAddress || newReq.hospitalName,
        district: newReq.district,
        division: newReq.division,
        urgencyLevel: newReq.urgencyLevel,
        bloodGroup: newReq.bloodGroup,
        units: newReq.unitsNeeded,
        contactPhone: newReq.contactNumber,
        reason: newReq.reason,
        requiredDate: newReq.requiredDate,
      }).catch((err) => console.warn('Direct request email alert error:', err));
    }
  } else if (['Urgent', 'Immediate', 'Critical'].includes(newReq.urgencyLevel)) {
    // Broadcast emergency alert email via Resend to matching donors
    const matchingDonors = dataStore.users.filter(
      (u) =>
        u.role === 'donor' &&
        u.isAvailable &&
        u.bloodGroup === newReq.bloodGroup
    );

    const recipients = matchingDonors.slice(0, 3);
    for (const donor of recipients) {
      if (donor.email) {
        EmailService.sendEmergencyRequestAlertEmail({
          recipientEmail: donor.email,
          donorName: donor.name || 'Valued Donor',
          patientName: newReq.patientName,
          hospitalName: newReq.hospitalName,
          bloodGroup: newReq.bloodGroup,
          units: newReq.unitsNeeded,
          location: `${newReq.hospitalAddress || newReq.hospitalName}, ${newReq.district}`,
          contactPhone: newReq.contactNumber,
        }).catch((err) => console.warn('Emergency alert email error:', err));
      }
    }
  }

  return newReq;
};

const updateBloodRequestStatus = async (
  id: string,
  status?: string,
  donorName?: string,
  action?: 'pledge' | 'cancel'
) => {
  const updated = await dataStore.updateRequestStatus(
    id,
    status,
    donorName,
    action
  );
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
