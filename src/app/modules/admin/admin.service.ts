import { dataStore } from '../../utils/dataStore';

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

export const AdminService = {
  getPlatformAnalytics,
  getAllUsers,
  verifyProvider,
};
