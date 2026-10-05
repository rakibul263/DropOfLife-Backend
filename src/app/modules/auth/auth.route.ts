import { Router } from 'express';
import { AuthController } from './auth.controller';
import { auth } from '../../middlewares/auth';
import { validateRequest } from '../../middlewares/validateRequest';
import { AuthValidation } from './auth.validation';
import { authLimiter, otpLimiter } from '../../middlewares/rateLimiter';

const router = Router();

router.post(
  '/register',
  authLimiter,
  validateRequest(AuthValidation.registerUserZodSchema),
  AuthController.register
);

router.post(
  '/login',
  authLimiter,
  validateRequest(AuthValidation.loginUserZodSchema),
  AuthController.login
);

router.post('/google', authLimiter, AuthController.googleAuth);

router.get('/me', auth(), AuthController.getMe);

router.post(
  '/refresh-token',
  validateRequest(AuthValidation.refreshTokenZodSchema),
  AuthController.refreshToken
);

router.post('/logout', AuthController.logout);

router.post('/forgot-password', otpLimiter, AuthController.forgotPassword);
router.post('/reset-password', otpLimiter, AuthController.resetPassword);

export const AuthRoutes = router;


