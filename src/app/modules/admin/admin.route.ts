import { Router } from 'express';
import { AdminController } from './admin.controller';
import { auth } from '../../middlewares/auth';

const router = Router();

router.get('/analytics', auth('admin'), AdminController.getAnalytics);
router.get('/users', auth('admin'), AdminController.getAllUsers);
router.patch('/providers/:id/verify', auth('admin'), AdminController.verifyProvider);

export const AdminRoutes = router;
