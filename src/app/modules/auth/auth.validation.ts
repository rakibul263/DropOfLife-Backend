import { z } from 'zod';

const registerUserZodSchema = z.object({
  body: z.object({
    name: z.string().min(2, { message: 'Full name must be at least 2 characters.' }),
    email: z.string().email({ message: 'A valid email address is required.' }),
    password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
    role: z.enum(['donor', 'provider', 'admin']).optional(),
    phone: z.string().min(11, { message: 'Valid contact phone number is required.' }).optional(),
    bloodGroup: z
      .enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'])
      .optional(),
    division: z.string().optional(),
    district: z.string().optional(),
    upazila: z.string().optional(),
    organizationName: z.string().optional(),
    licenseNumber: z.string().optional(),
  }),
});

const loginUserZodSchema = z.object({
  body: z.object({
    email: z.string().email({ message: 'A valid email address is required.' }),
    password: z.string().min(1, { message: 'Password is required.' }),
  }),
});

const refreshTokenZodSchema = z.object({
  cookies: z.object({
    refreshToken: z.string().optional(),
  }).optional(),
  body: z.object({
    refreshToken: z.string().optional(),
  }).optional(),
});

export const AuthValidation = {
  registerUserZodSchema,
  loginUserZodSchema,
  refreshTokenZodSchema,
};
