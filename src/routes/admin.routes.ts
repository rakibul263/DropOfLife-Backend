import { Router } from 'express';
import {
  getAnalytics,
  getAllUsers,
  verifyProvider,
} from '../controllers/admin.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';

const router = Router();

router.get('/analytics', getAnalytics); // Allow fast dashboard stats preview
router.get('/users', authenticate, requireRole('admin'), getAllUsers);
router.patch(
  '/providers/:id/verify',
  authenticate,
  requireRole('admin'),
  verifyProvider
);

export default router;
