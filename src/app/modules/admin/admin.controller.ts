import { Request, Response } from 'express';
import { AdminService } from './admin.service';
import { catchAsync } from '../../utils/catchAsync';
import { sendResponse } from '../../utils/sendResponse';
import { CustomAuthRequest } from '../../middlewares/auth';

const getAnalytics = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const result = await AdminService.getPlatformAnalytics();

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'DropOfLife platform operational analytics retrieved',
    data: result,
  });
});

const getAllUsers = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const { role } = req.query;
  const result = await AdminService.getAllUsers(role as string);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Registered platform users retrieved successfully',
    data: result,
  });
});

const verifyProvider = catchAsync(
  async (req: CustomAuthRequest, res: Response): Promise<void> => {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { isVerified } = req.body;

    const updated = await AdminService.verifyProvider(id, Boolean(isVerified));

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: `Provider status updated to ${isVerified ? 'Verified' : 'Unverified'}`,
      data: { user: updated },
    });
  }
);

export const AdminController = {
  getAnalytics,
  getAllUsers,
  verifyProvider,
};
