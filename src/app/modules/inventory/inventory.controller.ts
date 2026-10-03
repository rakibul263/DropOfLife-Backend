import { Request, Response } from 'express';
import { InventoryService } from './inventory.service';
import { catchAsync } from '../../utils/catchAsync';
import { sendResponse } from '../../utils/sendResponse';
import { CustomAuthRequest } from '../../middlewares/auth';

const getInventories = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const { providerId } = req.query;
  const result = await InventoryService.getInventories(providerId as string);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Blood bank inventory list retrieved successfully',
    data: result,
  });
});

const updateInventoryStock = catchAsync(
  async (req: CustomAuthRequest, res: Response): Promise<void> => {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { unitsInStock, criticalThreshold } = req.body;

    if (unitsInStock === undefined || unitsInStock < 0) {
      res.status(400).json({
        success: false,
        message: 'Valid non-negative unitsInStock is required.',
      });
      return;
    }

    const updated = await InventoryService.updateInventoryStock(
      id,
      Number(unitsInStock),
      criticalThreshold !== undefined ? Number(criticalThreshold) : undefined
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Inventory stock level updated successfully',
      data: { inventory: updated },
    });
  }
);

export const InventoryController = {
  getInventories,
  updateInventoryStock,
};
