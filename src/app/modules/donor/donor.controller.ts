import { Request, Response } from 'express';
import { Secret } from 'jsonwebtoken';
import { DonorService } from './donor.service';
import { catchAsync } from '../../utils/catchAsync';
import { sendResponse } from '../../utils/sendResponse';
import { CustomAuthRequest } from '../../middlewares/auth';
import { jwtHelpers } from '../../utils/jwtHelpers';
import { config } from '../../config';

const getDonors = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const { bloodGroup, division, district, isAvailable, excludeUserId } = req.query;

  let excludeId = (excludeUserId as string) || '';

  // Optional: check Authorization header or cookie for logged-in user to exclude
  const authHeader = req.headers.authorization;
  if (!excludeId && authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.split(' ')[1];
      const decoded: any = jwtHelpers.verifyToken(token, config.jwtSecret as Secret);
      if (decoded && decoded.id) {
        excludeId = decoded.id;
      }
    } catch (e) {}
  } else if (!excludeId && (req as any).cookies?.token) {
    try {
      const decoded: any = jwtHelpers.verifyToken((req as any).cookies.token, config.jwtSecret as Secret);
      if (decoded && decoded.id) {
        excludeId = decoded.id;
      }
    } catch (e) {}
  }

  const parsedAvailable =
    isAvailable === 'true' ? true : isAvailable === 'false' ? false : undefined;

  const result = await DonorService.getAllDonors({
    bloodGroup: bloodGroup as string,
    division: division as string,
    district: district as string,
    isAvailable: parsedAvailable,
    excludeUserId: excludeId,
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

const updateProfile = catchAsync(
  async (req: CustomAuthRequest, res: Response): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const result = await DonorService.updateDonorProfile(req.user.id, req.body);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Donor profile and emergency note updated successfully',
      data: { user: result },
    });
  }
);

const addReview = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const donorId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const review = await DonorService.addReview(donorId, req.body);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'Thank you! Your feedback and rating have been posted.',
    data: { review },
  });
});

const getReviews = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const donorId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const reviews = await DonorService.getReviews(donorId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Donor reviews fetched successfully',
    data: { reviews },
  });
});

const cancelRequest = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const donorId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  await DonorService.cancelDonorRequest(donorId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Donor request cancelled successfully and cooldown lifted.',
    data: { donorId },
  });
});

export const DonorController = {
  getDonors,
  getDonorById,
  toggleAvailability,
  updateProfile,
  addReview,
  getReviews,
  cancelRequest,
};

