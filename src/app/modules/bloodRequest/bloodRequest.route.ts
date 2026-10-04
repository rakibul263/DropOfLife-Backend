import { Router } from 'express';
import { BloodRequestController } from './bloodRequest.controller';
import { auth, authOptional } from '../../middlewares/auth';
import { validateRequest } from '../../middlewares/validateRequest';
import { BloodRequestValidation } from './bloodRequest.validation';

const router = Router();

router.get('/', BloodRequestController.getRequests);

router.post(
  '/',
  validateRequest(BloodRequestValidation.createBloodRequestZodSchema),
  BloodRequestController.createRequest
);

router.patch(
  '/:id/status',
  authOptional(),
  validateRequest(BloodRequestValidation.updateBloodRequestStatusZodSchema),
  BloodRequestController.updateRequestStatus
);

export const BloodRequestRoutes = router;
