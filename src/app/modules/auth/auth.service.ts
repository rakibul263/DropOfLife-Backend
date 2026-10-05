import bcrypt from 'bcryptjs';
import { Secret } from 'jsonwebtoken';
import { dataStore } from '../../utils/dataStore';
import { jwtHelpers } from '../../utils/jwtHelpers';
import { config } from '../../config';
import { ILoginUser, IRegisterUser } from './auth.interface';
import { EmailService } from '../../utils/emailService';

const registerUser = async (payload: IRegisterUser) => {
  const existingUser = await dataStore.findUserByEmail(payload.email);
  if (existingUser) {
    throw new Error('A user with this email address already exists.');
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(payload.password || 'Donor@123', salt);

  const newUser = await dataStore.createUser({
    name: payload.name,
    email: payload.email.toLowerCase(),
    password: hashedPassword,
    role: payload.role || 'donor',
    phone: payload.phone || '+8801521711716',
    bloodGroup: payload.role === 'donor' ? payload.bloodGroup || 'O+' : undefined,
    division: payload.division || 'Dhaka',
    district: payload.district || 'Dhaka',
    upazila: payload.upazila || 'Mirpur',
    organizationName: payload.role === 'provider' ? payload.organizationName : undefined,
    licenseNumber: payload.role === 'provider' ? payload.licenseNumber : undefined,
    isVerified: payload.role === 'admin' || payload.role === 'donor',
    isAvailable: true,
    totalDonations: 0,
    avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(payload.name)}`,
  });

  const token = jwtHelpers.createToken(
    {
      id: newUser._id,
      email: newUser.email,
      role: newUser.role,
      name: newUser.name,
      bloodGroup: newUser.bloodGroup,
    },
    config.jwtSecret as Secret,
    config.jwtExpiresIn as string
  );

  const refreshToken = jwtHelpers.createToken(
    {
      id: newUser._id,
      email: newUser.email,
      role: newUser.role,
    },
    config.jwtSecret as Secret,
    '30d'
  );

  const { password: _, ...safeUser } = newUser;

  // Trigger automated email notifications via Resend (Welcome + Donor notification)
  EmailService.sendWelcomeEmail({
    name: newUser.name,
    email: newUser.email,
    role: newUser.role,
    bloodGroup: newUser.bloodGroup,
  }).catch((err) => console.warn('Welcome email error:', err));

  if (newUser.role === 'donor') {
    EmailService.sendDonorConfirmationEmail({
      name: newUser.name,
      email: newUser.email,
      bloodGroup: newUser.bloodGroup || 'O+',
      district: newUser.district || 'Dhaka',
    }).catch((err) => console.warn('Donor email error:', err));
  }

  return { token, refreshToken, user: safeUser };
};

const loginUser = async (payload: ILoginUser) => {
  const user = await dataStore.findUserByEmail(payload.email);
  if (!user) {
    throw new Error('Invalid email or password.');
  }

  const isPasswordValid = await bcrypt.compare(payload.password || '', user.password);
  if (!isPasswordValid) {
    throw new Error('Invalid email or password.');
  }

  const token = jwtHelpers.createToken(
    {
      id: user._id,
      email: user.email,
      role: user.role,
      name: user.name,
      bloodGroup: user.bloodGroup,
    },
    config.jwtSecret as Secret,
    config.jwtExpiresIn as string
  );

  const refreshToken = jwtHelpers.createToken(
    {
      id: user._id,
      email: user.email,
      role: user.role,
    },
    config.jwtSecret as Secret,
    '30d'
  );

  const { password: _, ...safeUser } = user;
  return { token, refreshToken, user: safeUser };
};

const refreshToken = async (incomingToken: string) => {
  const verifiedUser = jwtHelpers.verifyToken(
    incomingToken,
    config.jwtSecret as Secret
  ) as any;

  const user = await dataStore.findUserById(verifiedUser.id);
  if (!user) {
    throw new Error('User no longer exists.');
  }

  const newAccessToken = jwtHelpers.createToken(
    {
      id: user._id,
      email: user.email,
      role: user.role,
      name: user.name,
      bloodGroup: user.bloodGroup,
    },
    config.jwtSecret as Secret,
    config.jwtExpiresIn as string
  );

  return { token: newAccessToken };
};

const getProfile = async (userId: string) => {
  const user = await dataStore.findUserById(userId);
  if (!user) {
    throw new Error('User account not found.');
  }
  const { password: _, ...safeUser } = user;
  return safeUser;
};

export const AuthService = {
  registerUser,
  loginUser,
  refreshToken,
  getProfile,
};
