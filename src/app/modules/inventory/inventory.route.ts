import { Router } from 'express';
import { InventoryController } from './inventory.controller';
import { auth } from '../../middlewares/auth';

const router = Router();

router.get('/', InventoryController.getInventories);
router.patch('/:id/stock', auth('provider', 'admin'), InventoryController.updateInventoryStock);

export const InventoryRoutes = router;
