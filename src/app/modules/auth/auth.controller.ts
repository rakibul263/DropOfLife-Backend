import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { catchAsync } from '../../utils/catchAsync';
import { sendResponse } from '../../utils/sendResponse';
import { CustomAuthRequest } from '../../middlewares/auth';

const register = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const result = await AuthService.registerUser(req.body);

  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
  };

  // 1-day Access Token cookie
  res.cookie('accessToken', result.accessToken, {
    ...cookieOptions,
    maxAge: 24 * 60 * 60 * 1000,
  });
  res.cookie('token', result.accessToken, {
    ...cookieOptions,
    maxAge: 24 * 60 * 60 * 1000,
  });
  res.cookie('dropoflife_token', result.accessToken, {
    ...cookieOptions,
    httpOnly: false,
    maxAge: 24 * 60 * 60 * 1000,
  });
  if (result.user?.role) {
    res.cookie('dropoflife_role', result.user.role, {
      ...cookieOptions,
      httpOnly: false,
      maxAge: 24 * 60 * 60 * 1000,
    });
  }

  // 30-day Refresh Token cookie
  if (result.refreshToken) {
    res.cookie('refreshToken', result.refreshToken, {
      ...cookieOptions,
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });
  }

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'User registered successfully with dual JWT access & refresh tokens',
    data: result,
  });
});

const login = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const result = await AuthService.loginUser(req.body);

  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
  };

  // 1-day Access Token cookie
  res.cookie('accessToken', result.accessToken, {
    ...cookieOptions,
    maxAge: 24 * 60 * 60 * 1000,
  });
  res.cookie('token', result.accessToken, {
    ...cookieOptions,
    maxAge: 24 * 60 * 60 * 1000,
  });
  res.cookie('dropoflife_token', result.accessToken, {
    ...cookieOptions,
    httpOnly: false,
    maxAge: 24 * 60 * 60 * 1000,
  });
  if (result.user?.role) {
    res.cookie('dropoflife_role', result.user.role, {
      ...cookieOptions,
      httpOnly: false,
      maxAge: 24 * 60 * 60 * 1000,
    });
  }

  // 30-day Refresh Token cookie
  if (result.refreshToken) {
    res.cookie('refreshToken', result.refreshToken, {
      ...cookieOptions,
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });
  }

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Login successful. JWT Access & Refresh tokens issued.',
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
    res.status(401).json({ success: false, message: 'Refresh token is required.' });
    return;
  }

  const result = await AuthService.refreshToken(token);

  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
  };

  res.cookie('accessToken', result.accessToken, {
    ...cookieOptions,
    maxAge: 24 * 60 * 60 * 1000,
  });
  res.cookie('token', result.accessToken, {
    ...cookieOptions,
    maxAge: 24 * 60 * 60 * 1000,
  });

  if (result.refreshToken) {
    res.cookie('refreshToken', result.refreshToken, {
      ...cookieOptions,
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });
  }

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'New access token generated successfully',
    data: result,
  });
});

const logout = catchAsync(async (req: Request, res: Response): Promise<void> => {
  res.clearCookie('accessToken');
  res.clearCookie('token');
  res.clearCookie('refreshToken');

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Logged out successfully. JWT session terminated.',
    data: null,
  });
});

const googleAuth = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const result = await AuthService.googleAuthUser(req.body);

  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
  };

  if (result.accessToken) {
    res.cookie('accessToken', result.accessToken, {
      ...cookieOptions,
      maxAge: 24 * 60 * 60 * 1000,
    });
    res.cookie('token', result.accessToken, {
      ...cookieOptions,
      maxAge: 24 * 60 * 60 * 1000,
    });
    res.cookie('dropoflife_token', result.accessToken, {
      ...cookieOptions,
      httpOnly: false,
      maxAge: 24 * 60 * 60 * 1000,
    });
    if (result.user?.role) {
      res.cookie('dropoflife_role', result.user.role, {
        ...cookieOptions,
        httpOnly: false,
        maxAge: 24 * 60 * 60 * 1000,
      });
    }
  }

  if (result.refreshToken) {
    res.cookie('refreshToken', result.refreshToken, {
      ...cookieOptions,
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });
  }

  sendResponse(res, {
    statusCode: result.isNewUser && !result.isProfileComplete ? 200 : 200,
    success: true,
    message: result.isNewUser
      ? result.isProfileComplete
        ? 'Account registered successfully with Google'
        : 'Google identity verified. Step 2 donor profile required.'
      : 'Google sign-in successful',
    data: result,
  });
});

const forgotPassword = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body;
  const result = await AuthService.forgotPassword(email);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: result.message,
    data: result,
  });
});

const resetPassword = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const result = await AuthService.resetPassword(req.body);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: result.message,
    data: result,
  });
});

export const AuthController = {
  register,
  login,
  googleAuth,
  getMe,
  refreshToken,
  logout,
  forgotPassword,
  resetPassword,
};


