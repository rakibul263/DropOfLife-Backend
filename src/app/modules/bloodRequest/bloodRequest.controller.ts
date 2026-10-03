import { Request, Response } from 'express';
import { BloodRequestService } from './bloodRequest.service';
import { catchAsync } from '../../utils/catchAsync';
import { sendResponse } from '../../utils/sendResponse';
import { CustomAuthRequest } from '../../middlewares/auth';

const getRequests = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const { status, bloodGroup, urgencyLevel } = req.query;

  const result = await BloodRequestService.getAllBloodRequests({
    status: status as string,
    bloodGroup: bloodGroup as string,
    urgencyLevel: urgencyLevel as string,
  });

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Blood requests feed retrieved successfully',
    data: result,
  });
});

const createRequest = catchAsync(
  async (req: CustomAuthRequest, res: Response): Promise<void> => {
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

    const newReq = await BloodRequestService.createBloodRequest({
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
      requiredDate,
    });

    sendResponse(res, {
      statusCode: 201,
      success: true,
      message: 'Emergency blood request created and broadcasted.',
      data: { request: newReq },
    });
  }
);

const updateRequestStatus = catchAsync(
  async (req: CustomAuthRequest, res: Response): Promise<void> => {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { status, donorName } = req.body;

    const updated = await BloodRequestService.updateBloodRequestStatus(
      id,
      status,
      donorName || req.user?.name
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: `Request status updated to ${status}`,
      data: { request: updated },
    });
  }
);

export const BloodRequestController = {
  getRequests,
  createRequest,
  updateRequestStatus,
};
