import { Request, Response } from 'express';
import { dataStore } from '../utils/dataStore';
import { AuthRequest } from '../middleware/auth.middleware';
import { EmailService } from '../app/utils/emailService';

export const getRequests = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, bloodGroup, urgencyLevel } = req.query;

    const requests = await dataStore.getRequests({
      status: status as string,
      bloodGroup: bloodGroup as string,
      urgencyLevel: urgencyLevel as string,
    });

    res.status(200).json({
      success: true,
      data: {
        total: requests.length,
        requests,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const createRequest = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const {
      patientName,
      bloodGroup,
      unitsNeeded = 1,
      urgencyLevel = 'Urgent',
      hospitalName,
      hospitalAddress,
      district = 'Dhaka',
      division = 'Dhaka',
      reason,
      contactNumber,
      requiredDate,
    } = req.body;

    if (!patientName || !bloodGroup || !hospitalName || !contactNumber) {
      res.status(400).json({
        success: false,
        message:
          'Patient name, blood group, hospital name, and contact number are required.',
      });
      return;
    }

    const requesterId = req.user ? req.user.id : 'anonymous';
    const requesterName = req.user ? req.user.name : patientName;

    const newReq = await dataStore.createRequest({
      requesterId,
      requesterName,
      patientName,
      bloodGroup,
      unitsNeeded: Number(unitsNeeded),
      urgencyLevel,
      hospitalName,
      hospitalAddress: hospitalAddress || hospitalName,
      district,
      division,
      reason: reason || 'Urgent medical transfusion needed.',
      contactNumber,
      requiredDate: requiredDate ? new Date(requiredDate) : new Date(),
    });

    // Broadcast emergency alert email via Resend to matching donors
    if (['Urgent', 'Immediate', 'Critical'].includes(newReq.urgencyLevel)) {
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

    res.status(201).json({
      success: true,
      message: 'Emergency blood request created and broadcasted.',
      data: { request: newReq },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updateRequestStatus = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { status, donorName, action } = req.body;

    const updated = await dataStore.updateRequestStatus(
      id,
      status,
      donorName,
      action
    );
    if (!updated) {
      res.status(404).json({ success: false, message: 'Request not found' });
      return;
    }

    res.status(200).json({
      success: true,
      message:
        action === 'cancel'
          ? 'Pledge cancelled successfully'
          : `Request status updated to ${updated.status}`,
      data: { request: updated },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};
