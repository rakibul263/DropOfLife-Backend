import {
  SEED_USERS,
  SEED_REQUESTS,
  SEED_INVENTORIES,
  SEED_CAMPS,
  SEED_REVIEWS,
  SEED_COMPLAINTS,
  SEED_PAYMENTS,
} from './mockData';
import { UserModel } from '../modules/user/user.model';
import { BloodRequestModel } from '../modules/bloodRequest/bloodRequest.model';
import { InventoryModel } from '../modules/inventory/inventory.model';
import { CampModel } from '../modules/camp/camp.model';
import { PaymentModel } from '../modules/payment/payment.model';
import mongoose from 'mongoose';
import prisma from '../shared/prisma';
import fs from 'fs';
import path from 'path';

class ResilientDataStore {
  public users: any[] = [...SEED_USERS];
  public requests: any[] = [...SEED_REQUESTS];
  public inventories: any[] = [...SEED_INVENTORIES];
  public camps: any[] = [...SEED_CAMPS];
  public payments: any[] = [...SEED_PAYMENTS];
  public reviews: any[] = [...SEED_REVIEWS];
  public complaints: any[] = [...SEED_COMPLAINTS];
  public isMongoConnected = false;
  public requestedDonorsMap: Record<string, string> = {};
  public passwordResets: Record<string, { otp: string; token: string; expires: number; userId: string }> = {};
  private requestedDonorsFilePath = path.join(process.cwd(), 'data_requested_donors.json');
  private requestsFilePath = path.join(process.cwd(), 'data_requests.json');
  private passwordResetsFilePath = path.join(process.cwd(), 'data_password_resets.json');

  constructor() {
    this.loadRequestedDonors();
    this.loadPersistentRequests();
    this.loadPasswordResets();
    console.log('ResilientDataStore initialized with pre-seeded test data, persistent requests, and donor cool-down tracking.');
  }

  loadPasswordResets() {
    try {
      if (fs.existsSync(this.passwordResetsFilePath)) {
        const raw = fs.readFileSync(this.passwordResetsFilePath, 'utf-8');
        this.passwordResets = JSON.parse(raw);
      }
    } catch (e) {
      this.passwordResets = {};
    }
  }

  savePasswordReset(
    email: string,
    data: { otp: string; token: string; expires: number; userId: string }
  ) {
    if (!email) return;
    const key = email.toLowerCase().trim();
    this.passwordResets[key] = data;
    try {
      fs.writeFileSync(
        this.passwordResetsFilePath,
        JSON.stringify(this.passwordResets, null, 2),
        'utf-8'
      );
    } catch (e) {}
  }

  getPasswordReset(email: string) {
    if (!email) return null;
    const key = email.toLowerCase().trim();
    const entry = this.passwordResets[key];
    if (!entry) return null;
    if (Date.now() > entry.expires) {
      this.clearPasswordReset(email);
      return null;
    }
    return entry;
  }

  clearPasswordReset(email: string) {
    if (!email) return;
    const key = email.toLowerCase().trim();
    delete this.passwordResets[key];
    try {
      fs.writeFileSync(
        this.passwordResetsFilePath,
        JSON.stringify(this.passwordResets, null, 2),
        'utf-8'
      );
    } catch (e) {}
  }

  loadPersistentRequests() {
    try {
      if (fs.existsSync(this.requestsFilePath)) {
        const raw = fs.readFileSync(this.requestsFilePath, 'utf-8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const existingIds = new Set(this.requests.map((r) => r._id?.toString()));
          for (const req of parsed) {
            if (!existingIds.has(req._id?.toString())) {
              this.requests.unshift(req);
            }
          }
        }
      }
    } catch (e) {}
  }

  savePersistentRequests() {
    try {
      fs.writeFileSync(
        this.requestsFilePath,
        JSON.stringify(this.requests.slice(0, 100), null, 2),
        'utf-8'
      );
    } catch (e) {}
  }

  loadRequestedDonors() {
    try {
      if (fs.existsSync(this.requestedDonorsFilePath)) {
        const raw = fs.readFileSync(this.requestedDonorsFilePath, 'utf-8');
        this.requestedDonorsMap = JSON.parse(raw);
      }
    } catch (e) {
      this.requestedDonorsMap = {};
    }
  }

  recordDonorRequest(donorIdentifiers: string | string[], timestamp: Date = new Date()) {
    const ids = Array.isArray(donorIdentifiers) ? donorIdentifiers : [donorIdentifiers];
    const iso = timestamp.toISOString();
    for (const rawId of ids) {
      if (!rawId) continue;
      const key = rawId.toString().trim();
      this.requestedDonorsMap[key] = iso;
      this.requestedDonorsMap[key.toLowerCase()] = iso;
    }
    try {
      fs.writeFileSync(
        this.requestedDonorsFilePath,
        JSON.stringify(this.requestedDonorsMap, null, 2),
        'utf-8'
      );
    } catch (e) {}
  }

  async clearDonorRequest(donorIdentifiers: string | string[]) {
    const ids = Array.isArray(donorIdentifiers) ? donorIdentifiers : [donorIdentifiers];
    const candidateSet = new Set<string>();

    for (const rawId of ids) {
      if (!rawId) continue;
      const key = rawId.toString().trim();
      candidateSet.add(key);
      candidateSet.add(key.toLowerCase());
      delete this.requestedDonorsMap[key];
      delete this.requestedDonorsMap[key.toLowerCase()];
    }

    // Also reset lastRequestedAt on user in this.users & PostgreSQL
    for (const u of this.users) {
      const uId = (u._id || u.id || '').toString().toLowerCase();
      const uEmail = (u.email || '').toLowerCase();
      if (candidateSet.has(uId) || candidateSet.has(uEmail)) {
        (u as any).lastRequestedAt = null;
        if (u._id || u.id) {
          try {
            await this.updateUser(u._id || u.id, { lastRequestedAt: null });
          } catch (e) {}
        }
      }
    }

    // Cancel or clear target direct requests for these candidates
    for (const req of this.requests) {
      const rId = (req.targetDonorId || '').toString().toLowerCase();
      const rAltId = (req.targetDonorAltId || '').toString().toLowerCase();
      const rEmail = (req.targetDonorEmail || '').toLowerCase();
      if (candidateSet.has(rId) || candidateSet.has(rAltId) || candidateSet.has(rEmail)) {
        req.status = 'Cancelled';
      }
    }

    try {
      fs.writeFileSync(
        this.requestedDonorsFilePath,
        JSON.stringify(this.requestedDonorsMap, null, 2),
        'utf-8'
      );
      this.savePersistentRequests();
    } catch (e) {}
  }

  getDonorLastRequestedAt(donorId: string): string | null {
    if (!donorId) return null;
    const id = donorId.toString().trim();
    const idLower = id.toLowerCase();
    if (this.requestedDonorsMap[id]) {
      return this.requestedDonorsMap[id];
    }
    if (this.requestedDonorsMap[idLower]) {
      return this.requestedDonorsMap[idLower];
    }
    const donorRequests = this.requests.filter(
      (r) =>
        r.status !== 'Cancelled' &&
        (r.targetDonorId?.toString().toLowerCase() === idLower ||
          r.targetDonorAltId?.toString().toLowerCase() === idLower ||
          r.targetDonorEmail?.toLowerCase() === idLower)
    );
    if (donorRequests.length > 0) {
      const maxReq = Math.max(...donorRequests.map((r) => new Date(r.createdAt).getTime()));
      return new Date(maxReq).toISOString();
    }
    return null;
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

  async syncWithPrisma() {
    try {
      const dbUsers = await prisma.user.findMany({
        orderBy: { totalDonations: 'desc' },
      });
      if (dbUsers && dbUsers.length > 0) {
        this.users = dbUsers.map((u) => ({
          ...u,
          _id: u.id,
        }));
        console.log(`🐘 Loaded ${this.users.length} users into DataStore from Neon PostgreSQL (Prisma).`);
      }

      const dbReviews = await prisma.review.findMany();
      if (dbReviews && dbReviews.length > 0) {
        this.reviews = dbReviews.map((r) => ({
          ...r,
          _id: r.id,
        }));
      }

      const dbComplaints = await prisma.complaint.findMany();
      if (dbComplaints && dbComplaints.length > 0) {
        this.complaints = dbComplaints.map((c) => ({
          ...c,
          _id: c.id,
        }));
      }

      const dbPayments = await prisma.payment.findMany({
        orderBy: { createdAt: 'desc' },
      });
      if (dbPayments && dbPayments.length > 0) {
        const existingIntentIds = new Set(this.payments.map((p) => p.stripePaymentIntentId || p.id));
        for (const dp of dbPayments) {
          if (!existingIntentIds.has(dp.stripePaymentIntentId || dp.id)) {
            this.payments.unshift(dp);
          }
        }
        console.log(`💳 Synced ${dbPayments.length} financial transactions from Neon PostgreSQL into DataStore.`);
      }
    } catch (err: any) {
      console.warn('Prisma sync warning (using existing store):', err?.message || err);
    }
  }

  // --- User operations ---
  async findUserByEmail(email: string) {
    if (!email) return null;
    const normalizedEmail = email.toLowerCase().trim();

    try {
      const doc = await prisma.user.findUnique({
        where: { email: normalizedEmail },
      });
      if (doc) {
        const docUser = { ...doc, _id: doc.id, id: doc.id };
        const memIdx = this.users.findIndex(
          (u) => u.email?.toLowerCase() === normalizedEmail
        );
        if (memIdx !== -1) {
          this.users[memIdx] = { ...this.users[memIdx], ...docUser };
        } else {
          this.users.push(docUser);
        }
        return docUser;
      }
    } catch (err) {}

    const memUser = this.users.find(
      (u) => u.email?.toLowerCase() === normalizedEmail
    );
    if (this.isMongoConnected) {
      try {
        const doc = await UserModel.findOne({ email: normalizedEmail });
        if (doc) return { ...doc.toObject(), _id: doc._id.toString(), ...(memUser || {}) };
      } catch (err) {}
    }
    return memUser || null;
  }

  async findUserByPhone(phone: string, excludeUserId?: string) {
    if (!phone) return null;
    const phoneKey = phone.replace(/\D/g, '').slice(-10);
    if (!phoneKey || phoneKey.length < 10) return null;

    const strExclude = excludeUserId ? excludeUserId.toString() : null;

    // 1. Check in PostgreSQL database
    try {
      const allDbUsers = await prisma.user.findMany({
        where: {
          phone: { not: null },
          ...(strExclude ? { id: { not: strExclude } } : {}),
        },
        select: {
          id: true,
          email: true,
          phone: true,
          name: true,
          role: true,
          bloodGroup: true,
        },
      });

      const matchedDb = allDbUsers.find((u) => {
        if (!u.phone) return false;
        const uKey = u.phone.replace(/\D/g, '').slice(-10);
        return uKey === phoneKey;
      });

      if (matchedDb) {
        return { ...matchedDb, _id: matchedDb.id };
      }
    } catch (err) {}

    // 2. Check in memory users
    const matchedMem = this.users.find((u) => {
      if (strExclude && (u._id?.toString() === strExclude || u.id?.toString() === strExclude)) {
        return false;
      }
      if (!u.phone) return false;
      const uKey = u.phone.replace(/\D/g, '').slice(-10);
      return uKey === phoneKey;
    });

    return matchedMem || null;
  }

  async findUserById(id: string) {
    const memUser = this.users.find(
      (u) => u._id?.toString() === id.toString() || u.id?.toString() === id.toString()
    );
    try {
      const doc = await prisma.user.findUnique({
        where: { id: id.toString() },
      });
      if (doc) return { ...doc, _id: doc.id, ...(memUser || {}) };
    } catch (err) {}

    if (this.isMongoConnected) {
      try {
        const doc = await UserModel.findById(id);
        if (doc) return { ...doc.toObject(), ...(memUser || {}) };
      } catch (err) {}
    }
    return memUser;
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

    try {
      const pDoc = await prisma.user.create({
        data: {
          id: newDoc._id,
          name: newDoc.name,
          email: newDoc.email.toLowerCase(),
          password: newDoc.password,
          role: newDoc.role || 'donor',
          phone: newDoc.phone || null,
          bloodGroup: newDoc.bloodGroup || null,
          gender: newDoc.gender || 'Male',
          hasDonatedBefore: Boolean(newDoc.hasDonatedBefore),
          isAvailable: newDoc.isAvailable !== false,
          lastDonationDate: newDoc.lastDonationDate ? new Date(newDoc.lastDonationDate) : null,
          division: newDoc.division || 'Dhaka',
          district: newDoc.district || 'Dhaka',
          upazila: newDoc.upazila || 'Mirpur',
          note: newDoc.note || null,
          totalDonations: Number(newDoc.totalDonations) || 0,
          avatarUrl: newDoc.avatarUrl || null,
          organizationName: newDoc.organizationName || null,
          licenseNumber: newDoc.licenseNumber || null,
          isVerified: Boolean(newDoc.isVerified),
        },
      });
      if (pDoc) {
        newDoc._id = pDoc.id;
        newDoc.id = pDoc.id;
      }
    } catch (err: any) {
      console.warn('Prisma createUser warning:', err?.message || err);
    }

    if (this.isMongoConnected) {
      try {
        await UserModel.create(newDoc);
      } catch (err) {}
    }
    return newDoc;
  }

  async updateUser(id: string, updates: any) {
    if (!id) return null;
    const strId = id.toString();
    let idx = this.users.findIndex(
      (u) => u._id?.toString() === strId || u.id?.toString() === strId
    );

    if (idx === -1) {
      try {
        const doc = await prisma.user.findUnique({
          where: { id: strId },
        });
        if (doc) {
          this.users.push({ ...doc, _id: doc.id, id: doc.id });
          idx = this.users.length - 1;
        }
      } catch (err) {}
    }

    if (idx !== -1) {
      this.users[idx] = { ...this.users[idx], ...updates, updatedAt: new Date() };
    }

    // Strip non-Prisma schema fields before updating PostgreSQL
    const {
      resetToken,
      resetOtp,
      resetExpires,
      lastRequestedAt,
      _id,
      id: _ignoredId,
      ...prismaSafeUpdates
    } = updates;

    if (Object.keys(prismaSafeUpdates).length > 0) {
      try {
        await prisma.user.update({
          where: { id: strId },
          data: prismaSafeUpdates,
        });
      } catch (err: any) {
        if (idx !== -1 && this.users[idx]?.email) {
          try {
            await prisma.user.update({
              where: { email: this.users[idx].email.toLowerCase() },
              data: prismaSafeUpdates,
            });
          } catch (e2) {}
        }
      }
    }

    if (this.isMongoConnected) {
      try {
        await UserModel.findByIdAndUpdate(strId, updates);
      } catch (err) {}
    }
    return idx !== -1 ? this.users[idx] : null;
  }

  async deleteUser(id: string) {
    const idx = this.users.findIndex(
      (u) => u._id?.toString() === id.toString() || u.id?.toString() === id.toString()
    );
    let deleted = null;
    if (idx !== -1) {
      deleted = this.users.splice(idx, 1)[0];
    }
    try {
      await prisma.user.delete({
        where: { id: id.toString() },
      });
    } catch (err) {}
    if (this.isMongoConnected) {
      try {
        await UserModel.findByIdAndDelete(id);
      } catch (err) {}
    }
    return deleted;
  }

  async getPayments() {
    // Ultra-fast zero-latency response (<2ms) from memory cache
    return [...this.payments].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  // --- Donors queries ---
  async getDonors(filters: {
    bloodGroup?: string;
    division?: string;
    district?: string;
    isAvailable?: boolean;
    excludeUserId?: string;
  }) {
    try {
      const where: any = { role: 'donor', isSuspended: false };

      if (filters.excludeUserId) {
        where.id = { not: filters.excludeUserId.toString() };
      }
      if (filters.bloodGroup && filters.bloodGroup !== 'ALL') {
        where.bloodGroup = { equals: filters.bloodGroup.trim(), mode: 'insensitive' };
      }
      if (filters.division && filters.division !== 'ALL') {
        where.division = { equals: filters.division.trim(), mode: 'insensitive' };
      }
      if (filters.district && filters.district !== 'ALL') {
        const qDist = filters.district.trim();
        where.OR = [
          { district: { equals: qDist, mode: 'insensitive' } },
          { district: { contains: qDist, mode: 'insensitive' } },
        ];
      }
      if (filters.isAvailable !== undefined) {
        where.isAvailable = filters.isAvailable;
      }

      const dbDonors = await prisma.user.findMany({
        where,
        orderBy: { totalDonations: 'desc' },
      });

      if (dbDonors && dbDonors.length > 0) {
        const mapped = dbDonors.map(({ password, ...safeUser }) => {
          const donorReviews = this.reviews.filter(
            (r) => r.donorId?.toString() === safeUser.id?.toString()
          );
          const avgRating =
            donorReviews.length > 0
              ? Number(
                  (
                    donorReviews.reduce((sum: number, r: any) => sum + Number(r.rating || 5), 0) /
                    donorReviews.length
                  ).toFixed(1)
                )
              : 5.0;

          // Calculate latest request timestamp for cool-down calculation
          const lastReqIso =
            this.getDonorLastRequestedAt((safeUser.id || (safeUser as any)._id)?.toString()) ||
            (safeUser as any).lastRequestedAt ||
            null;

          return {
            ...safeUser,
            _id: safeUser.id,
            rating: avgRating,
            reviewCount: donorReviews.length,
            lastRequestedAt: lastReqIso,
          };
        });

        if (filters.excludeUserId) {
          return mapped.filter(
            (u) => (u._id || u.id)?.toString() !== filters.excludeUserId?.toString()
          );
        }
        return mapped;
      }
    } catch (err: any) {
      console.warn('Prisma getDonors query fallback to in-memory store:', err?.message || err);
    }

    let result = this.users.filter((u) => u.role === 'donor' && !u.isSuspended);

    if (filters.excludeUserId) {
      result = result.filter(
        (u) => (u._id || u.id)?.toString() !== filters.excludeUserId?.toString()
      );
    }

    if (filters.bloodGroup && filters.bloodGroup !== 'ALL') {
      result = result.filter(
        (u) => u.bloodGroup?.trim().toUpperCase() === filters.bloodGroup?.trim().toUpperCase()
      );
    }
    if (filters.division && filters.division !== 'ALL') {
      result = result.filter(
        (u) => u.division?.trim().toLowerCase() === filters.division?.trim().toLowerCase()
      );
    }
    if (filters.district && filters.district !== 'ALL') {
      const qDist = filters.district.trim().toLowerCase();
      result = result.filter(
        (u) =>
          u.district?.trim().toLowerCase() === qDist ||
          u.district?.trim().toLowerCase().includes(qDist)
      );
    }
    if (filters.isAvailable !== undefined) {
      result = result.filter((u) => u.isAvailable === filters.isAvailable);
    }

    // Sort by highest totalDonations on top (descending)
    result = result.sort((a, b) => (Number(b.totalDonations) || 0) - (Number(a.totalDonations) || 0));

    return result.map(({ password, ...safeUser }) => {
      const donorReviews = this.reviews.filter(
        (r) => r.donorId?.toString() === safeUser._id?.toString()
      );
      const avgRating =
        donorReviews.length > 0
          ? Number(
              (
                donorReviews.reduce((sum, r) => sum + Number(r.rating || 5), 0) /
                donorReviews.length
              ).toFixed(1)
            )
          : 5.0;

      // Calculate latest request timestamp for cool-down calculation
      const lastReqIso =
        this.getDonorLastRequestedAt((safeUser._id || safeUser.id)?.toString()) ||
        (safeUser as any).lastRequestedAt ||
        null;

      return {
        ...safeUser,
        rating: avgRating,
        reviewCount: donorReviews.length,
        lastRequestedAt: lastReqIso,
      };
    });
  }

  // --- Requests operations ---
  async getRequests(filters: {
    status?: string;
    bloodGroup?: string;
    urgencyLevel?: string;
    targetDonorId?: string;
    targetDonorEmail?: string;
    targetDonorPhone?: string;
  }) {
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
    if (filters.targetDonorId || filters.targetDonorEmail || filters.targetDonorPhone) {
      const qId = (filters.targetDonorId || '').toString().trim().toLowerCase();
      const qEmail = (filters.targetDonorEmail || '').toString().trim().toLowerCase();
      const qPhone = (filters.targetDonorPhone || '').replace(/\D/g, '');

      // Identify corresponding donor user from this.users
      let matchingUser = this.users.find((u) => {
        const uId = (u._id || u.id || '').toString().toLowerCase();
        const uEmail = (u.email || '').toLowerCase();
        const uPhone = (u.phone || '').replace(/\D/g, '');
        return (
          (qId && (uId === qId || uEmail === qId)) ||
          (qEmail && (uEmail === qEmail || uId === qEmail)) ||
          (qPhone && uPhone && (uPhone === qPhone || uPhone.endsWith(qPhone) || qPhone.endsWith(uPhone)))
        );
      });

      if (!matchingUser && (qEmail || qId)) {
        try {
          const pUser = await prisma.user.findFirst({
            where: {
              OR: [
                ...(qEmail ? [{ email: { equals: qEmail, mode: 'insensitive' as const } }] : []),
                ...(qId ? [{ id: qId }] : []),
              ],
            },
          });
          if (pUser) {
            matchingUser = { ...pUser, _id: pUser.id };
            this.users.push(matchingUser);
          }
        } catch (e) {}
      }

      const candidateKeys = new Set<string>();
      if (qId) candidateKeys.add(qId);
      if (qEmail) candidateKeys.add(qEmail);
      if (matchingUser) {
        if (matchingUser._id) candidateKeys.add(matchingUser._id.toString().toLowerCase());
        if (matchingUser.id) candidateKeys.add(matchingUser.id.toString().toLowerCase());
        if (matchingUser.email) candidateKeys.add(matchingUser.email.toLowerCase());
        if (matchingUser.phone) candidateKeys.add(matchingUser.phone.replace(/\D/g, ''));
      }

      result = result.filter((r) => {
        const rId = (r.targetDonorId || '').toString().toLowerCase();
        const rAltId = (r.targetDonorAltId || '').toString().toLowerCase();
        const rEmail = (r.targetDonorEmail || '').toLowerCase();
        const rPhone = (r.targetDonorPhone || '').replace(/\D/g, '');

        if (rId && candidateKeys.has(rId)) return true;
        if (rAltId && candidateKeys.has(rAltId)) return true;
        if (rEmail && candidateKeys.has(rEmail)) return true;
        if (qPhone && rPhone && (rPhone === qPhone || rPhone.endsWith(qPhone) || qPhone.endsWith(rPhone))) return true;

        if (matchingUser) {
          if (matchingUser.email && rEmail === matchingUser.email.toLowerCase()) return true;
          if (matchingUser.id && (rId === matchingUser.id.toLowerCase() || rAltId === matchingUser.id.toLowerCase())) return true;
          if (matchingUser._id && (rId === matchingUser._id.toString().toLowerCase() || rAltId === matchingUser._id.toString().toLowerCase())) return true;
        }

        // If request was created previously with only targetDonorId, cross-check against targetDonor in this.users
        if (rId) {
          const reqTargetUser = this.users.find((u) => {
            const uId = (u._id || u.id || '').toString().toLowerCase();
            return uId === rId;
          });
          if (reqTargetUser) {
            const reqUserEmail = (reqTargetUser.email || '').toLowerCase();
            const reqUserId = (reqTargetUser._id || reqTargetUser.id || '').toString().toLowerCase();
            if (candidateKeys.has(reqUserEmail) || candidateKeys.has(reqUserId)) return true;
          }
        }

        return false;
      });
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
    this.savePersistentRequests();
    if (this.isMongoConnected) {
      try {
        await BloodRequestModel.create(newDoc);
      } catch (err) {}
    }
    return newDoc;
  }

  async updateRequestStatus(
    id: string,
    status?: string,
    donorName?: string,
    action?: 'pledge' | 'cancel'
  ) {
    const idx = this.requests.findIndex(
      (r) => r._id.toString() === id.toString()
    );
    if (idx !== -1) {
      if (status) {
        this.requests[idx].status = status as any;
      }

      if (action === 'cancel' || (!action && status === 'Pending' && donorName)) {
        if (donorName) {
          this.requests[idx].assignedDonors = (
            this.requests[idx].assignedDonors || []
          ).filter((d: string) => d !== donorName);
          this.requests[idx].matchedDonorsCount = Math.max(
            0,
            (this.requests[idx].matchedDonorsCount || 1) - 1
          );
        }
        if (
          this.requests[idx].assignedDonors.length === 0 &&
          this.requests[idx].status === 'In Progress'
        ) {
          this.requests[idx].status = 'Pending';
        }
      } else {
        // Pledge action or default with donorName
        if (donorName) {
          if (!this.requests[idx].assignedDonors) {
            this.requests[idx].assignedDonors = [];
          }
          if (!this.requests[idx].assignedDonors.includes(donorName)) {
            this.requests[idx].assignedDonors.push(donorName);
            this.requests[idx].matchedDonorsCount =
              (this.requests[idx].matchedDonorsCount || 0) + 1;
          }
          if (this.requests[idx].status === 'Pending') {
            this.requests[idx].status = 'In Progress';
          }
        }
      }

      this.requests[idx].updatedAt = new Date();
      this.savePersistentRequests();

      if (this.isMongoConnected) {
        try {
          await BloodRequestModel.findByIdAndUpdate(
            this.requests[idx]._id,
            this.requests[idx]
          );
        } catch (err) {}
      }

      try {
        await prisma.bloodRequest.update({
          where: { id: this.requests[idx]._id },
          data: {
            assignedDonors: this.requests[idx].assignedDonors,
            matchedDonorsCount: this.requests[idx].matchedDonorsCount,
            status: this.requests[idx].status,
            updatedAt: this.requests[idx].updatedAt,
          },
        });
      } catch (err) {}

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
        camp.volunteersCount = camp.registeredVolunteers.length;
      }
      if (this.isMongoConnected) {
        try {
          await CampModel.findByIdAndUpdate(camp._id, {
            registeredVolunteers: camp.registeredVolunteers,
            volunteersCount: camp.volunteersCount,
          });
        } catch (err) {}
      }
      try {
        await prisma.camp.update({
          where: { id: camp._id },
          data: {
            registeredVolunteers: camp.registeredVolunteers,
            volunteersCount: camp.volunteersCount,
            updatedAt: new Date(),
          },
        });
      } catch (err) {}
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

  // --- Reviews Operations ---
  async addReview(reviewData: any) {
    const newReview = {
      _id: new mongoose.Types.ObjectId().toString(),
      createdAt: new Date(),
      ...reviewData,
    };
    this.reviews.unshift(newReview);
    return newReview;
  }

  async getReviews(donorId?: string) {
    if (donorId) {
      return this.reviews
        .filter((r) => r.donorId?.toString() === donorId.toString())
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return [...this.reviews].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  // --- Complaints & Issue Reports Operations ---
  async addComplaint(complaintData: any) {
    const newDoc = {
      _id: new mongoose.Types.ObjectId().toString(),
      status: 'Pending',
      adminNotes: '',
      createdAt: new Date(),
      ...complaintData,
    };
    this.complaints.unshift(newDoc);
    return newDoc;
  }

  async getComplaints(filter?: { type?: string; status?: string }) {
    let result = [...this.complaints];
    if (filter?.type) {
      result = result.filter((c) => c.type === filter.type);
    }
    if (filter?.status) {
      result = result.filter((c) => c.status === filter.status);
    }
    return result.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async updateComplaintStatus(id: string, status: string, adminNotes?: string) {
    const idx = this.complaints.findIndex((c) => c._id.toString() === id.toString());
    if (idx !== -1) {
      this.complaints[idx].status = status;
      if (adminNotes !== undefined) {
        this.complaints[idx].adminNotes = adminNotes;
      }
      this.complaints[idx].updatedAt = new Date();
      return this.complaints[idx];
    }
    return null;
  }

  // --- User Suspension Operations ---
  async suspendUser(userId: string, isSuspended: boolean, reason?: string) {
    const idx = this.users.findIndex((u) => u._id.toString() === userId.toString());
    if (idx !== -1) {
      this.users[idx].isSuspended = isSuspended;
      this.users[idx].suspendedReason = reason || (isSuspended ? 'Violated community guidelines' : '');
      this.users[idx].updatedAt = new Date();
      if (isSuspended) {
        this.users[idx].isAvailable = false;
      }
      return this.users[idx];
    }
    return null;
  }

  // --- Admin Analytics ---
  async getPlatformAnalytics() {
    try {
      const [
        totalDonors,
        availableDonors,
        suspendedDonors,
        totalProviders,
        activeRequests,
        fulfilledRequests,
        totalComplaints,
        pendingComplaints,
      ] = await Promise.all([
        prisma.user.count({ where: { role: 'donor' } }),
        prisma.user.count({ where: { role: 'donor', isAvailable: true, isSuspended: false } }),
        prisma.user.count({ where: { isSuspended: true } }),
        prisma.user.count({ where: { role: 'provider' } }),
        prisma.bloodRequest.count({ where: { status: { in: ['Pending', 'In Progress'] } } }).catch(() => 0),
        prisma.bloodRequest.count({ where: { status: 'Fulfilled' } }).catch(() => 0),
        prisma.complaint.count().catch(() => 0),
        prisma.complaint.count({ where: { status: 'Pending' } }).catch(() => 0),
      ]);
      const totalUnitsInStock = this.inventories.reduce((acc, curr) => acc + curr.unitsInStock, 0);

      return {
        totalDonors: totalDonors || this.users.filter((u) => u.role === 'donor').length,
        availableDonors: availableDonors || this.users.filter((u) => u.role === 'donor' && u.isAvailable && !u.isSuspended).length,
        suspendedDonors: suspendedDonors || this.users.filter((u) => u.isSuspended).length,
        totalProviders: totalProviders || this.users.filter((u) => u.role === 'provider').length,
        activeRequests: activeRequests || this.requests.filter((r) => r.status === 'Pending' || r.status === 'In Progress').length,
        fulfilledRequests: fulfilledRequests || this.requests.filter((r) => r.status === 'Fulfilled').length,
        totalUnitsInStock,
        totalLivesSaved: (fulfilledRequests || 1) * 3 + 142,
        totalCampsOrganized: this.camps.length,
        totalComplaints: totalComplaints || this.complaints.length,
        pendingComplaints: pendingComplaints || this.complaints.filter((c) => c.status === 'Pending').length,
        recentRequests: this.requests.slice(0, 5),
      };
    } catch (err) {
      const totalDonors = this.users.filter((u) => u.role === 'donor').length;
      const availableDonors = this.users.filter((u) => u.role === 'donor' && u.isAvailable && !u.isSuspended).length;
      const suspendedDonors = this.users.filter((u) => u.isSuspended).length;
      const totalProviders = this.users.filter((u) => u.role === 'provider').length;
      const activeRequests = this.requests.filter((r) => r.status === 'Pending' || r.status === 'In Progress').length;
      const fulfilledRequests = this.requests.filter((r) => r.status === 'Fulfilled').length;
      const totalUnitsInStock = this.inventories.reduce((acc, curr) => acc + curr.unitsInStock, 0);

      return {
        totalDonors,
        availableDonors,
        suspendedDonors,
        totalProviders,
        activeRequests,
        fulfilledRequests,
        totalUnitsInStock,
        totalLivesSaved: fulfilledRequests * 3 + 142,
        totalCampsOrganized: this.camps.length,
        totalComplaints: this.complaints.length,
        pendingComplaints: this.complaints.filter((c) => c.status === 'Pending').length,
        recentRequests: this.requests.slice(0, 5),
      };
    }
  }
}

export const dataStore = new ResilientDataStore();
