import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { catchAsync } from '../../utils/catchAsync';
import { sendResponse } from '../../utils/sendResponse';
import { CustomAuthRequest } from '../../middlewares/auth';

const register = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const result = await AuthService.registerUser(req.body);

  res.cookie('token', result.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'User registered successfully and JWT generated',
    data: result,
  });
});

const login = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const result = await AuthService.loginUser(req.body);

  res.cookie('token', result.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  if (result.refreshToken) {
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });
  }

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Login successful. JWT token issued.',
    data: result,
  });
});

const getMe = catchAsync(async (req: CustomAuthRequest, res: Response): Promise<void> => {
  if (!req.user?.id) {
    res.status(401).json({ success: false, message: 'Unauthorized: User not authenticated' });
    return;
  }

  const user = await AuthService.getProfile(req.user.id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Authenticated user profile retrieved successfully',
    data: { user },
  });
});

const refreshToken = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const token = req.cookies?.refreshToken || req.body?.refreshToken;
  if (!token) {
    res.status(400).json({ success: false, message: 'Refresh token is required.' });
    return;
  }

  const result = await AuthService.refreshToken(token);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'New access token generated successfully',
    data: result,
  });
});

const logout = catchAsync(async (req: Request, res: Response): Promise<void> => {
  res.clearCookie('token');
  res.clearCookie('refreshToken');

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Logged out successfully. JWT session terminated.',
    data: null,
  });
});

export const AuthController = {
  register,
  login,
  getMe,
  refreshToken,
  logout,
};
