import { Request, Response } from 'express';
import { CampService } from './camp.service';
import { catchAsync } from '../../utils/catchAsync';
import { sendResponse } from '../../utils/sendResponse';
import { CustomAuthRequest } from '../../middlewares/auth';

const getCamps = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const result = await CampService.getAllCamps();

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Blood donation camps list retrieved successfully',
    data: result,
  });
});

const createCamp = catchAsync(
  async (req: CustomAuthRequest, res: Response): Promise<void> => {
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

    const newCamp = await CampService.createCamp(
      {
        title,
        description,
        venueAddress,
        district,
        division,
        startDate,
        endDate,
        targetUnits,
        contactPhone,
      },
      providerId,
      providerName
    );

    sendResponse(res, {
      statusCode: 201,
      success: true,
      message: 'Blood camp drive successfully scheduled.',
      data: { camp: newCamp },
    });
  }
);

const registerCampVolunteer = catchAsync(
  async (req: CustomAuthRequest, res: Response): Promise<void> => {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    if (!req.user && !req.body.name) {
      res.status(401).json({
        success: false,
        message: 'Access Denied: You must be logged in to register as a volunteer.',
      });
      return;
    }
    const volunteerName = req.user ? req.user.name : req.body.name;

    const camp = await CampService.registerCampVolunteer(id, volunteerName);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Successfully registered as volunteer for this blood drive.',
      data: { camp },
    });
  }
);

export const CampController = {
  getCamps,
  createCamp,
  registerCampVolunteer,
};
