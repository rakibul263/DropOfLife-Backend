import { z } from 'zod';

const createBloodRequestZodSchema = z.object({
  body: z.object({
    patientName: z.string().min(2, { message: 'Patient name is required.' }),
    bloodGroup: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'], {
      message: 'Valid blood group (e.g. O+, A+, B-) is required.',
    }),
    unitsNeeded: z.number().min(1, { message: 'At least 1 unit is required.' }).default(1),
    urgencyLevel: z.enum(['Standard', 'Urgent', 'Critical']).optional().default('Urgent'),
    hospitalName: z.string().min(3, { message: 'Hospital name is required.' }),
    hospitalAddress: z.string().optional(),
    district: z.string().optional().default('Dhaka'),
    division: z.string().optional().default('Dhaka'),
    reason: z.string().optional(),
    contactNumber: z.string().min(11, { message: 'Valid contact phone number is required.' }),
    requiredDate: z.string().or(z.date()).optional(),
  }),
});

const updateBloodRequestStatusZodSchema = z.object({
  body: z.object({
    status: z.enum(['Pending', 'In Progress', 'Fulfilled', 'Cancelled'], {
      message: 'Valid status is required.',
    }),
    donorName: z.string().optional(),
  }),
});

export const BloodRequestValidation = {
  createBloodRequestZodSchema,
  updateBloodRequestStatusZodSchema,
};
