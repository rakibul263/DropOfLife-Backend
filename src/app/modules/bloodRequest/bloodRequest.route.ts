import { Router } from 'express';
import { BloodRequestController } from './bloodRequest.controller';
import { auth } from '../../middlewares/auth';

const router = Router();

router.get('/', BloodRequestController.getRequests);
router.post('/', BloodRequestController.createRequest);
router.patch('/:id/status', auth(), BloodRequestController.updateRequestStatus);

export const BloodRequestRoutes = router;
