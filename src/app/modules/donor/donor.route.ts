import { Router } from 'express';
import { DonorController } from './donor.controller';
import { auth } from '../../middlewares/auth';

const router = Router();

router.get('/', DonorController.getDonors);
router.patch('/profile', auth('donor', 'admin', 'provider'), DonorController.updateProfile);
router.patch('/availability', auth('donor', 'admin'), DonorController.toggleAvailability);
router.get('/:id/reviews', DonorController.getReviews);
router.post('/:id/reviews', DonorController.addReview);
router.post('/:id/cancel-request', DonorController.cancelRequest);
router.delete('/:id/request', DonorController.cancelRequest);
router.get('/:id', DonorController.getDonorById);

export const DonorRoutes = router;
