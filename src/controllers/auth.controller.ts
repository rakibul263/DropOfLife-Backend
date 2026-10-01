import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { dataStore } from '../utils/dataStore';
import { AuthRequest } from '../middleware/auth.middleware';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      name,
      email,
      password,
      role = 'donor',
      phone,
      bloodGroup,
      division,
      district,
      upazila,
      organizationName,
      licenseNumber,
    } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({
        success: false,
        message: 'Name, email, and password are required.',
      });
      return;
    }

    const existingUser = await dataStore.findUserByEmail(email);
    if (existingUser) {
      res.status(409).json({
        success: false,
        message: 'A user with this email already exists.',
      });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await dataStore.createUser({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role,
      phone: phone || '',
      bloodGroup: role === 'donor' ? bloodGroup || 'O+' : undefined,
      division: division || 'Dhaka',
      district: district || 'Dhaka',
      upazila: upazila || 'Mirpur',
      organizationName: role === 'provider' ? organizationName : undefined,
      licenseNumber: role === 'provider' ? licenseNumber : undefined,
      isVerified: role === 'admin' || role === 'donor', // Providers require admin verification
      isAvailable: true,
      totalDonations: 0,
      avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`,
    });

    const token = jwt.sign(
      {
        id: newUser._id,
        email: newUser.email,
        role: newUser.role,
        name: newUser.name,
      },
      config.jwtSecret,
      { expiresIn: '7d' }
    );

    const { password: _, ...safeUser } = newUser;

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({
      success: true,
      message: 'Account registered successfully',
      data: {
        token,
        user: safeUser,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({
        success: false,
        message: 'Email and password are required.',
      });
      return;
    }

    const user = await dataStore.findUserByEmail(email);
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
      return;
    }

    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        role: user.role,
        name: user.name,
      },
      config.jwtSecret,
      { expiresIn: '7d' }
    );

    const { password: _, ...safeUser } = user;

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: safeUser,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const user = await dataStore.findUserById(req.user.id);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    const { password: _, ...safeUser } = user;
    res.status(200).json({
      success: true,
      data: { user: safeUser },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  res.clearCookie('token');
  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
};
