import { Router } from 'express';
import { DonorController } from './donor.controller';
import { auth } from '../../middlewares/auth';

const router = Router();

router.get('/', DonorController.getDonors);
router.get('/:id', DonorController.getDonorById);
router.patch('/availability', auth('donor', 'admin'), DonorController.toggleAvailability);

export const DonorRoutes = router;
