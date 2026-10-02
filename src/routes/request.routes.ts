import { Router } from 'express';
import {
  getRequests,
  createRequest,
  updateRequestStatus,
} from '../controllers/request.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.get('/', getRequests);
router.post('/', createRequest); // Can be created as guest or logged in user
router.patch('/:id/status', updateRequestStatus);

export default router;
