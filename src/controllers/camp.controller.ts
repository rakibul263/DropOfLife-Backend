import { Request, Response } from 'express';
import { dataStore } from '../utils/dataStore';
import { AuthRequest } from '../middleware/auth.middleware';

export const getCamps = async (req: Request, res: Response): Promise<void> => {
  try {
    const camps = await dataStore.getCamps();
    res.status(200).json({
      success: true,
      data: {
        total: camps.length,
        camps,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const createCamp = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const {
      title,
      description,
      venueAddress,
      district = 'Dhaka',
      division = 'Dhaka',
      startDate,
      endDate,
      targetUnits = 100,
      contactPhone,
    } = req.body;

    if (!title || !venueAddress || !startDate || !endDate || !contactPhone) {
      res.status(400).json({
        success: false,
        message: 'Title, venue, dates, and contact phone are required.',
      });
      return;
    }

    const providerId = req.user ? req.user.id : 'unknown';
    const providerName = req.user ? req.user.name : 'DropOfLife Partner Hospital';

    const newCamp = await dataStore.createCamp({
      providerId,
      providerName,
      title,
      description: description || '',
      venueAddress,
      district,
      division,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      targetUnits: Number(targetUnits),
      contactPhone,
    });

    res.status(201).json({
      success: true,
      message: 'Blood camp drive successfully scheduled.',
      data: { camp: newCamp },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const registerCampVolunteer = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const volunteerName = req.user ? req.user.name : req.body.name || 'Volunteer Supporter';

    const camp = await dataStore.registerCampVolunteer(id, volunteerName);
    if (!camp) {
      res.status(404).json({ success: false, message: 'Camp not found.' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Successfully registered as volunteer for this blood drive.',
      data: { camp },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};
