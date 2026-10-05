import { dataStore } from '../../utils/dataStore';
import bcrypt from 'bcryptjs';
import { EmailService } from '../../utils/emailService';

const getPlatformAnalytics = async () => {
  const stats = await dataStore.getPlatformAnalytics();
  return { stats };
};

const getAllUsers = async (role?: string) => {
  let users = [...dataStore.users];
  if (role) {
    users = users.filter((u) => u.role === role);
  }
  const safeUsers = users.map(({ password: _, ...u }) => u);
  return {
    total: safeUsers.length,
    users: safeUsers,
  };
};

const verifyProvider = async (providerId: string, isVerified: boolean) => {
  const updated = await dataStore.updateUser(providerId, {
    isVerified,
  });
  if (!updated) {
    throw new Error('Provider account not found.');
  }
  const { password: _, ...safeUser } = updated;
  return safeUser;
};

const getComplaints = async (filter?: { type?: string; status?: string }) => {
  const complaints = await dataStore.getComplaints(filter);
  return {
    total: complaints.length,
    complaints,
  };
};

const updateComplaint = async (id: string, status: string, adminNotes?: string) => {
  const updated = await dataStore.updateComplaintStatus(id, status, adminNotes);
  if (!updated) {
    throw new Error('Report or complaint not found.');
  }
  return updated;
};

const suspendUser = async (userId: string, isSuspended: boolean, reason?: string) => {
  const user = await dataStore.suspendUser(userId, isSuspended, reason);
  if (!user) {
    throw new Error('User not found.');
  }
  const { password: _, ...safeUser } = user;
  return safeUser;
};

const deleteUser = async (userId: string) => {
  const deleted = await dataStore.deleteUser(userId);
  if (!deleted) {
    throw new Error('User not found or already removed.');
  }
  return { id: userId, message: 'User permanently deleted.' };
};

const updateUserRole = async (userId: string, role: string) => {
  const updated = await dataStore.updateUser(userId, { role });
  if (!updated) {
    throw new Error('User not found.');
  }
  const { password: _, ...safeUser } = updated;
  return safeUser;
};

const getPayments = async () => {
  const payments = await dataStore.getPayments();
  const totalAmount = payments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
  return {
    total: payments.length,
    totalAmount,
    payments,
  };
};

const getProviders = async () => {
  const providers = dataStore.users.filter((u) => u.role === 'provider');
  const safeProviders = providers.map(({ password: _, ...u }) => u);
  return {
    total: safeProviders.length,
    providers: safeProviders,
  };
};

const resetUserPassword = async (userId: string, newPassword: string) => {
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(newPassword, salt);
  const updated = await dataStore.updateUser(userId, {
    password: hashedPassword,
  });
  if (!updated) {
    throw new Error('User not found.');
  }
  const { password: _, ...safeUser } = updated;

  // Send email notice via Resend
  if (updated.email) {
    EmailService.sendPasswordResetNoticeEmail({
      email: updated.email,
      name: updated.name || 'User',
      newPassword,
    }).catch((err) => console.warn('Password reset notice email error:', err));
  }

  return safeUser;
};

const updateUser = async (userId: string, payload: any) => {
  const allowedUpdates: any = {};
  if (payload.name !== undefined) allowedUpdates.name = payload.name;
  if (payload.email !== undefined) allowedUpdates.email = payload.email.toLowerCase().trim();
  if (payload.phone !== undefined) allowedUpdates.phone = payload.phone;
  if (payload.bloodGroup !== undefined) allowedUpdates.bloodGroup = payload.bloodGroup;
  if (payload.gender !== undefined) allowedUpdates.gender = payload.gender;
  if (payload.role !== undefined) allowedUpdates.role = payload.role;
  if (payload.division !== undefined) allowedUpdates.division = payload.division;
  if (payload.district !== undefined) allowedUpdates.district = payload.district;
  if (payload.upazila !== undefined) allowedUpdates.upazila = payload.upazila;
  if (payload.organizationName !== undefined) allowedUpdates.organizationName = payload.organizationName;
  if (payload.licenseNumber !== undefined) allowedUpdates.licenseNumber = payload.licenseNumber;
  if (payload.isVerified !== undefined) allowedUpdates.isVerified = Boolean(payload.isVerified);
  if (payload.isAvailable !== undefined) allowedUpdates.isAvailable = Boolean(payload.isAvailable);
  if (payload.totalDonations !== undefined) allowedUpdates.totalDonations = Number(payload.totalDonations);
  if (payload.note !== undefined) allowedUpdates.note = payload.note;
  if (payload.isSuspended !== undefined) allowedUpdates.isSuspended = Boolean(payload.isSuspended);
  if (payload.suspendedReason !== undefined) allowedUpdates.suspendedReason = payload.suspendedReason;

  const updated = await dataStore.updateUser(userId, allowedUpdates);
  if (!updated) {
    throw new Error('User not found.');
  }
  const { password: _, ...safeUser } = updated;
  return safeUser;
};

export const AdminService = {
  getPlatformAnalytics,
  getAllUsers,
  getProviders,
  verifyProvider,
  getComplaints,
  updateComplaint,
  suspendUser,
  deleteUser,
  updateUserRole,
  resetUserPassword,
  updateUser,
  getPayments,
};

