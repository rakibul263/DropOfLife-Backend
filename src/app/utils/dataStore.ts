import { SEED_USERS, SEED_REQUESTS, SEED_INVENTORIES, SEED_CAMPS } from './mockData';
import { UserModel } from '../modules/user/user.model';
import { BloodRequestModel } from '../modules/bloodRequest/bloodRequest.model';
import { InventoryModel } from '../modules/inventory/inventory.model';
import { CampModel } from '../modules/camp/camp.model';
import { PaymentModel } from '../modules/payment/payment.model';
import mongoose from 'mongoose';

class ResilientDataStore {
  public users: any[] = [...SEED_USERS];
  public requests: any[] = [...SEED_REQUESTS];
  public inventories: any[] = [...SEED_INVENTORIES];
  public camps: any[] = [...SEED_CAMPS];
  public payments: any[] = [];
  public isMongoConnected = false;

  constructor() {
    console.log('ResilientDataStore initialized with pre-seeded test data.');
  }

  setMongoConnected(connected: boolean) {
    this.isMongoConnected = connected;
    if (connected) {
      this.syncSeedsToMongo();
    }
  }

  async syncSeedsToMongo() {
    try {
      const userCount = await UserModel.countDocuments();
      if (userCount === 0) {
        console.log('Seeding initial MongoDB dataset...');
        await UserModel.insertMany(SEED_USERS);
        await BloodRequestModel.insertMany(SEED_REQUESTS);
        await InventoryModel.insertMany(SEED_INVENTORIES);
        await CampModel.insertMany(SEED_CAMPS);
        console.log('MongoDB successfully seeded with DropOfLife demo entities.');
      }
    } catch (err) {
      console.warn('MongoDB sync check skipped, using memory fallback:', err);
    }
  }

  // --- User operations ---
  async findUserByEmail(email: string) {
    if (this.isMongoConnected) {
      try {
        const doc = await UserModel.findOne({ email: email.toLowerCase() });
        if (doc) return doc.toObject();
      } catch (err) {}
    }
    return this.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  async findUserById(id: string) {
    if (this.isMongoConnected) {
      try {
        const doc = await UserModel.findById(id);
        if (doc) return doc.toObject();
      } catch (err) {}
    }
    return this.users.find((u) => u._id.toString() === id.toString());
  }

  async createUser(userData: any) {
    const newDoc = {
      _id: new mongoose.Types.ObjectId().toString(),
      isAvailable: true,
      isVerified: false,
      totalDonations: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...userData,
    };
    this.users.push(newDoc);

    if (this.isMongoConnected) {
      try {
        await UserModel.create(newDoc);
      } catch (err) {}
    }
    return newDoc;
  }

  async updateUser(id: string, updates: any) {
    const idx = this.users.findIndex((u) => u._id.toString() === id.toString());
    if (idx !== -1) {
      this.users[idx] = { ...this.users[idx], ...updates, updatedAt: new Date() };
    }
    if (this.isMongoConnected) {
      try {
        await UserModel.findByIdAndUpdate(id, updates);
      } catch (err) {}
    }
    return this.users[idx];
  }

  // --- Donors queries ---
  async getDonors(filters: { bloodGroup?: string; division?: string; district?: string; isAvailable?: boolean }) {
    let result = this.users.filter((u) => u.role === 'donor');

    if (filters.bloodGroup) {
      result = result.filter((u) => u.bloodGroup === filters.bloodGroup);
    }
    if (filters.division) {
      result = result.filter((u) => u.division?.toLowerCase() === filters.division?.toLowerCase());
    }
    if (filters.district) {
      result = result.filter((u) => u.district?.toLowerCase() === filters.district?.toLowerCase());
    }
    if (filters.isAvailable !== undefined) {
      result = result.filter((u) => u.isAvailable === filters.isAvailable);
    }

    return result.map(({ password, ...safeUser }) => safeUser);
  }

  // --- Requests operations ---
  async getRequests(filters: { status?: string; bloodGroup?: string; urgencyLevel?: string }) {
    let result = [...this.requests];
    if (filters.status) {
      result = result.filter((r) => r.status === filters.status);
    }
    if (filters.bloodGroup) {
      result = result.filter((r) => r.bloodGroup === filters.bloodGroup);
    }
    if (filters.urgencyLevel) {
      result = result.filter((r) => r.urgencyLevel === filters.urgencyLevel);
    }
    // Return latest first
    return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async createRequest(reqData: any) {
    const newDoc = {
      _id: new mongoose.Types.ObjectId().toString(),
      status: 'Pending',
      matchedDonorsCount: 0,
      assignedDonors: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      ...reqData,
    };
    this.requests.unshift(newDoc);
    if (this.isMongoConnected) {
      try {
        await BloodRequestModel.create(newDoc);
      } catch (err) {}
    }
    return newDoc;
  }

  async updateRequestStatus(id: string, status: string, donorName?: string) {
    const idx = this.requests.findIndex((r) => r._id.toString() === id.toString());
    if (idx !== -1) {
      this.requests[idx].status = status as any;
      if (donorName && !this.requests[idx].assignedDonors.includes(donorName)) {
        this.requests[idx].assignedDonors.push(donorName);
        this.requests[idx].matchedDonorsCount += 1;
      }
      this.requests[idx].updatedAt = new Date();
      return this.requests[idx];
    }
    return null;
  }

  // --- Inventories operations ---
  async getInventories(providerId?: string) {
    if (providerId) {
      return this.inventories.filter((i) => i.providerId.toString() === providerId.toString());
    }
    return this.inventories;
  }

  async updateInventory(id: string, unitsInStock: number, criticalThreshold?: number) {
    const idx = this.inventories.findIndex((i) => i._id.toString() === id.toString());
    if (idx !== -1) {
      this.inventories[idx].unitsInStock = unitsInStock;
      if (criticalThreshold !== undefined) {
        this.inventories[idx].criticalThreshold = criticalThreshold;
      }
      this.inventories[idx].lastUpdated = new Date();
      return this.inventories[idx];
    }
    return null;
  }

  // --- Camps operations ---
  async getCamps() {
    return [...this.camps].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  }

  async createCamp(campData: any) {
    const newDoc = {
      _id: new mongoose.Types.ObjectId().toString(),
      collectedUnits: 0,
      status: 'Upcoming',
      volunteersCount: 0,
      registeredVolunteers: [],
      createdAt: new Date(),
      ...campData,
    };
    this.camps.push(newDoc);
    return newDoc;
  }

  async registerCampVolunteer(campId: string, volunteerName: string) {
    const camp = this.camps.find((c) => c._id.toString() === campId.toString());
    if (camp) {
      if (!camp.registeredVolunteers.includes(volunteerName)) {
        camp.registeredVolunteers.push(volunteerName);
        camp.volunteersCount += 1;
      }
      return camp;
    }
    return null;
  }

  // --- Payments ---
  async recordPayment(paymentData: any) {
    const payment = {
      _id: new mongoose.Types.ObjectId().toString(),
      createdAt: new Date(),
      ...paymentData,
    };
    this.payments.push(payment);
    return payment;
  }

  // --- Admin Analytics ---
  async getPlatformAnalytics() {
    const totalDonors = this.users.filter((u) => u.role === 'donor').length;
    const availableDonors = this.users.filter((u) => u.role === 'donor' && u.isAvailable).length;
    const totalProviders = this.users.filter((u) => u.role === 'provider').length;
    const activeRequests = this.requests.filter((r) => r.status === 'Pending' || r.status === 'In Progress').length;
    const fulfilledRequests = this.requests.filter((r) => r.status === 'Fulfilled').length;
    const totalUnitsInStock = this.inventories.reduce((acc, curr) => acc + curr.unitsInStock, 0);

    return {
      totalDonors,
      availableDonors,
      totalProviders,
      activeRequests,
      fulfilledRequests,
      totalUnitsInStock,
      totalLivesSaved: fulfilledRequests * 3 + 142, // medical metric: 1 unit saves up to 3 lives
      totalCampsOrganized: this.camps.length,
      recentRequests: this.requests.slice(0, 5),
    };
  }
}

export const dataStore = new ResilientDataStore();
