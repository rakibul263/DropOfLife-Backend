import { Router } from 'express';
import {
  getInventories,
  updateInventoryStock,
} from '../controllers/inventory.controller';

const router = Router();

router.get('/', getInventories);
router.patch('/:id', updateInventoryStock);

export default router;
