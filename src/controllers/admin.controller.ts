import { Request, Response } from 'express';
import { dataStore } from '../utils/dataStore';
import { AuthRequest } from '../middleware/auth.middleware';

export const getAnalytics = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const stats = await dataStore.getPlatformAnalytics();
    res.status(200).json({
      success: true,
      data: { stats },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getAllUsers = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { role } = req.query;
    let users = [...dataStore.users];
    if (role) {
      users = users.filter((u) => u.role === role);
    }
    const safeUsers = users.map(({ password, ...u }) => u);
    res.status(200).json({
      success: true,
      data: {
        total: safeUsers.length,
        users: safeUsers,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const verifyProvider = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { isVerified } = req.body;

    const updated = await dataStore.updateUser(id, {
      isVerified: Boolean(isVerified),
    });

    if (!updated) {
      res.status(404).json({ success: false, message: 'Provider not found.' });
      return;
    }

    res.status(200).json({
      success: true,
      message: `Provider status set to ${isVerified ? 'Verified' : 'Unverified'}`,
      data: { user: updated },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};
