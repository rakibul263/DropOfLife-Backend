import { Router } from 'express';
import { AuthController } from './auth.controller';
import { auth } from '../../middlewares/auth';
import { validateRequest } from '../../middlewares/validateRequest';
import { AuthValidation } from './auth.validation';

const router = Router();

router.post(
  '/register',
  validateRequest(AuthValidation.registerUserZodSchema),
  AuthController.register
);

router.post(
  '/login',
  validateRequest(AuthValidation.loginUserZodSchema),
  AuthController.login
);

router.get('/me', auth(), AuthController.getMe);

router.post(
  '/refresh-token',
  validateRequest(AuthValidation.refreshTokenZodSchema),
  AuthController.refreshToken
);

router.post('/logout', AuthController.logout);

export const AuthRoutes = router;
