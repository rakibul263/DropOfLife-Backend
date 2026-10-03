import { dataStore } from '../../utils/dataStore';

const getInventories = async (providerId?: string) => {
  const inventories = await dataStore.getInventories(providerId);
  return {
    total: inventories.length,
    inventories,
  };
};

const updateInventoryStock = async (
  id: string,
  unitsInStock: number,
  criticalThreshold?: number
) => {
  const updated = await dataStore.updateInventory(
    id,
    unitsInStock,
    criticalThreshold
  );

  if (!updated) {
    throw new Error('Inventory record not found.');
  }

  return updated;
};

export const InventoryService = {
  getInventories,
  updateInventoryStock,
};
