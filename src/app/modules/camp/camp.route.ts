import { Router } from 'express';
import { CampController } from './camp.controller';
import { auth } from '../../middlewares/auth';

const router = Router();

router.get('/', CampController.getCamps);
router.post('/', auth('provider', 'admin'), CampController.createCamp);
router.post('/:id/register', auth('donor', 'provider', 'admin'), CampController.registerCampVolunteer);
router.post('/:id/volunteer', auth('donor', 'provider', 'admin'), CampController.registerCampVolunteer);

export const CampRoutes = router;
