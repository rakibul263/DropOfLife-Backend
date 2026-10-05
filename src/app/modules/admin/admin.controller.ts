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

const getComplaints = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const { type, status } = req.query;
  const result = await AdminService.getComplaints({
    type: type as string,
    status: status as string,
  });

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Complaints and issue reports retrieved successfully',
    data: result,
  });
});

const updateComplaint = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const { status, adminNotes } = req.body;

  const updated = await AdminService.updateComplaint(id, status, adminNotes);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: `Report status updated to ${status}`,
    data: { complaint: updated },
  });
});

const suspendUser = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const { isSuspended, reason } = req.body;

  const updatedUser = await AdminService.suspendUser(id, Boolean(isSuspended), reason);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: `User has been ${isSuspended ? 'suspended' : 'reactivated'} successfully`,
    data: { user: updatedUser },
  });
});

const deleteUser = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const result = await AdminService.deleteUser(id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'User removed permanently from DropOfLife database',
    data: result,
  });
});

const updateUserRole = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const { role } = req.body;
  const updated = await AdminService.updateUserRole(id, role);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: `User role updated to ${role}`,
    data: { user: updated },
  });
});

const getPayments = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const result = await AdminService.getPayments();

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Financial audit transactions retrieved successfully',
    data: result,
  });
});

const getProviders = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const result = await AdminService.getProviders();

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Hospital providers list retrieved successfully',
    data: result,
  });
});

const resetUserPassword = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const { newPassword } = req.body;
  if (!newPassword || newPassword.length < 6) {
    res.status(400).json({
      success: false,
      message: 'New password must be at least 6 characters long.',
    });
    return;
  }
  const updatedUser = await AdminService.resetUserPassword(id, newPassword);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'User password has been successfully reset.',
    data: { user: updatedUser },
  });
});

const updateUser = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const updatedUser = await AdminService.updateUser(id, req.body);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'User profile updated successfully by administrator.',
    data: { user: updatedUser },
  });
});

export const AdminController = {
  getAnalytics,
  getAllUsers,
  getProviders,
  verifyProvider,
  getComplaints,
  updateComplaint,
  suspendUser,
  deleteUser,
  updateUserRole,
  resetUserPassword,
  updateUser,
  getPayments,
};

