import { Router } from 'express';
import { AdminController } from './admin.controller';
import { auth } from '../../middlewares/auth';

const router = Router();

router.get('/analytics', auth('admin'), AdminController.getAnalytics);
router.get('/users', auth('admin'), AdminController.getAllUsers);
router.delete('/users/:id', auth('admin'), AdminController.deleteUser);
router.patch('/users/:id', auth('admin'), AdminController.updateUser);
router.patch('/users/:id/role', auth('admin'), AdminController.updateUserRole);
router.patch('/users/:id/suspend', auth('admin'), AdminController.suspendUser);
router.patch('/users/:id/reset-password', auth('admin'), AdminController.resetUserPassword);
router.get('/providers', auth('admin'), AdminController.getProviders);
router.patch('/providers/:id/verify', auth('admin'), AdminController.verifyProvider);
router.get('/complaints', auth('admin'), AdminController.getComplaints);
router.patch('/complaints/:id', auth('admin'), AdminController.updateComplaint);
router.get('/payments', auth('admin'), AdminController.getPayments);

export const AdminRoutes = router;
