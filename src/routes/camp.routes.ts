import { Router } from 'express';
import {
  getCamps,
  createCamp,
  registerCampVolunteer,
} from '../controllers/camp.controller';

const router = Router();

router.get('/', getCamps);
router.post('/', createCamp);
router.post('/:id/volunteer', registerCampVolunteer);

export default router;
