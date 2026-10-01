import { Router } from 'express';
import { getDonors, toggleAvailability } from '../controllers/donor.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.get('/', getDonors);
router.patch('/availability', authenticate, toggleAvailability);

export default router;
