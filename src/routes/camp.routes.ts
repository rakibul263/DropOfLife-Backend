import { Router } from 'express';
import {
  getCamps,
  createCamp,
  registerCampVolunteer,
} from '../controllers/camp.controller';
import { auth } from '../app/middlewares/auth';

const router = Router();

router.get('/', getCamps);
router.post('/', createCamp);
router.post('/:id/volunteer', auth('donor', 'provider', 'admin'), registerCampVolunteer);
router.post('/:id/register', auth('donor', 'provider', 'admin'), registerCampVolunteer);

export default router;
