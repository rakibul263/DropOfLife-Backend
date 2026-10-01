import { Request, Response } from 'express';
import { dataStore } from '../utils/dataStore';
import { AuthRequest } from '../middleware/auth.middleware';

export const getDonors = async (req: Request, res: Response): Promise<void> => {
  try {
    const { bloodGroup, division, district, isAvailable } = req.query;

    const parsedAvailable =
      isAvailable === 'true' ? true : isAvailable === 'false' ? false : undefined;

    const donors = await dataStore.getDonors({
      bloodGroup: bloodGroup as string,
      division: division as string,
      district: district as string,
      isAvailable: parsedAvailable,
    });

    res.status(200).json({
      success: true,
      data: {
        total: donors.length,
        donors,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const toggleAvailability = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { isAvailable } = req.body;
    const updated = await dataStore.updateUser(req.user.id, {
      isAvailable: Boolean(isAvailable),
    });

    res.status(200).json({
      success: true,
      message: `Donor availability updated to ${isAvailable ? 'Available' : 'Resting'}`,
      data: { user: updated },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};
