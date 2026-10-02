import { Request, Response } from 'express';
import { dataStore } from '../utils/dataStore';
import { AuthRequest } from '../middleware/auth.middleware';

export const getInventories = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { providerId } = req.query;
    const inventories = await dataStore.getInventories(providerId as string);

    res.status(200).json({
      success: true,
      data: {
        total: inventories.length,
        inventories,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updateInventoryStock = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { unitsInStock, criticalThreshold } = req.body;

    if (unitsInStock === undefined || unitsInStock < 0) {
      res.status(400).json({
        success: false,
        message: 'Valid unitsInStock is required.',
      });
      return;
    }

    const updated = await dataStore.updateInventory(
      id,
      Number(unitsInStock),
      criticalThreshold !== undefined ? Number(criticalThreshold) : undefined
    );

    if (!updated) {
      res.status(404).json({ success: false, message: 'Inventory item not found.' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Inventory stock level updated.',
      data: { inventory: updated },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};
