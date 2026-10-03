import { Request, Response } from 'express';
import { DonorService } from './donor.service';
import { catchAsync } from '../../utils/catchAsync';
import { sendResponse } from '../../utils/sendResponse';
import { CustomAuthRequest } from '../../middlewares/auth';

const getDonors = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const { bloodGroup, division, district, isAvailable } = req.query;

  const parsedAvailable =
    isAvailable === 'true' ? true : isAvailable === 'false' ? false : undefined;

  const result = await DonorService.getAllDonors({
    bloodGroup: bloodGroup as string,
    division: division as string,
    district: district as string,
    isAvailable: parsedAvailable,
  });

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Donors directory retrieved successfully',
    data: result,
  });
});

const getDonorById = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const result = await DonorService.getDonorById(id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Donor profile fetched successfully',
    data: { donor: result },
  });
});

const toggleAvailability = catchAsync(
  async (req: CustomAuthRequest, res: Response): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { isAvailable } = req.body;
    const result = await DonorService.updateDonorAvailability(
      req.user.id,
      Boolean(isAvailable)
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: `Donor availability updated to ${isAvailable ? 'Available' : 'Resting'}`,
      data: { user: result },
    });
  }
);

export const DonorController = {
  getDonors,
  getDonorById,
  toggleAvailability,
};
