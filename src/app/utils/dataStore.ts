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

      const dbRequests = await prisma.bloodRequest.findMany({
        orderBy: { createdAt: 'desc' },
      });
      if (dbRequests && dbRequests.length > 0) {
        this.requests = dbRequests.map((r) => ({
          ...r,
          _id: r.id,
        }));
        console.log(`🩸 Loaded ${this.requests.length} blood requests from Neon PostgreSQL.`);
      }

      const dbCamps = await prisma.camp.findMany({
        orderBy: { startDate: 'asc' },
      });
      if (dbCamps && dbCamps.length > 0) {
        this.camps = dbCamps.map((c) => ({
          ...c,
          _id: c.id,
        }));
        console.log(`🏕️ Loaded ${this.camps.length} blood camps from Neon PostgreSQL.`);
      }

      const dbInvs = await prisma.inventory.findMany({
        orderBy: { bloodGroup: 'asc' },
      });
      if (dbInvs && dbInvs.length > 0) {
        this.inventories = dbInvs.map((i) => ({
          ...i,
          _id: i.id,
        }));
        console.log(`📦 Loaded ${this.inventories.length} inventory records from Neon PostgreSQL.`);
      }

      const dbReviews = await prisma.review.findMany({
        orderBy: { createdAt: 'desc' },
      });
      if (dbReviews && dbReviews.length > 0) {
        this.reviews = dbReviews.map((r) => ({
          ...r,
          _id: r.id,
        }));
      }

      const dbComplaints = await prisma.complaint.findMany({
        orderBy: { createdAt: 'desc' },
      });
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
        this.payments = dbPayments.map((p) => ({
          ...p,
          _id: p.id,
        }));
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
    try {
      const where: any = {};
      if (filters.status && filters.status !== 'ALL') {
        where.status = { equals: filters.status, mode: 'insensitive' };
      }
      if (filters.bloodGroup && filters.bloodGroup !== 'ALL') {
        where.bloodGroup = { equals: filters.bloodGroup, mode: 'insensitive' };
      }
      if (filters.urgencyLevel && filters.urgencyLevel !== 'ALL') {
        where.urgencyLevel = { equals: filters.urgencyLevel, mode: 'insensitive' };
      }

      const dbRequests = await prisma.bloodRequest.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      });

      if (dbRequests && dbRequests.length > 0) {
        let result = dbRequests.map((r) => ({
          ...r,
          _id: r.id,
        }));

        if (filters.targetDonorId || filters.targetDonorEmail || filters.targetDonorPhone) {
          const qId = (filters.targetDonorId || '').toString().trim().toLowerCase();
          const qEmail = (filters.targetDonorEmail || '').toString().trim().toLowerCase();
          const qPhone = (filters.targetDonorPhone || '').replace(/\D/g, '');

          result = result.filter((r: any) => {
            const rId = (r.targetDonorId || '').toString().toLowerCase();
            const rEmail = (r.targetDonorEmail || '').toLowerCase();
            const rPhone = (r.contactNumber || '').replace(/\D/g, '');
            if (qId && rId === qId) return true;
            if (qEmail && rEmail === qEmail) return true;
            if (qPhone && rPhone && (rPhone === qPhone || rPhone.endsWith(qPhone))) return true;
            return false;
          });
        }

        return result;
      }
    } catch (err: any) {
      console.warn('Prisma getRequests query fallback:', err?.message || err);
    }

    let result = [...this.requests];
    if (filters.status && filters.status !== 'ALL') {
      result = result.filter((r) => r.status?.toLowerCase() === filters.status?.toLowerCase());
    }
    if (filters.bloodGroup && filters.bloodGroup !== 'ALL') {
      result = result.filter((r) => r.bloodGroup === filters.bloodGroup);
    }
    if (filters.urgencyLevel && filters.urgencyLevel !== 'ALL') {
      result = result.filter((r) => r.urgencyLevel === filters.urgencyLevel);
    }
    return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async createRequest(reqData: any) {
    try {
      let validRequesterId: string | null = null;
      if (reqData.requesterId && reqData.requesterId !== 'anonymous' && reqData.requesterId !== 'unknown') {
        const uExists = await prisma.user.findUnique({
          where: { id: reqData.requesterId.toString() },
          select: { id: true },
        }).catch(() => null);
        if (uExists) {
          validRequesterId = uExists.id;
        }
      }

      const created = await prisma.bloodRequest.create({
        data: {
          requesterId: validRequesterId,
          requesterName: reqData.requesterName || 'Emergency Requester',
          requesterPhone: reqData.requesterPhone || '+8801521711716',
          patientName: reqData.patientName,
          bloodGroup: reqData.bloodGroup,
          unitsNeeded: Number(reqData.unitsNeeded || 1),
          urgencyLevel: reqData.urgencyLevel || 'Urgent',
          hospitalName: reqData.hospitalName,
          hospitalAddress: reqData.hospitalAddress || '',
          district: reqData.district || 'Dhaka',
          division: reqData.division || 'Dhaka',
          reason: reqData.reason || 'Emergency blood transfusion',
          contactNumber: reqData.contactNumber || '+8801521711716',
          requiredDate: reqData.requiredDate ? new Date(reqData.requiredDate) : new Date(),
          status: reqData.status || 'Pending',
          matchedDonorsCount: Number(reqData.matchedDonorsCount || 0),
          assignedDonors: reqData.assignedDonors || [],
        },
      });

      const newDoc = { ...created, _id: created.id };
      this.requests.unshift(newDoc);
      return newDoc;
    } catch (err: any) {
      console.warn('Prisma createRequest fallback to memory:', err?.message || err);
    }

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
    return newDoc;
  }

  async updateRequestStatus(
    id: string,
    status?: string,
    donorName?: string,
    action?: 'pledge' | 'cancel'
  ) {
    const strId = id.toString();
    try {
      const current = await prisma.bloodRequest.findUnique({
        where: { id: strId },
      });

      if (current) {
        let assignedDonors = current.assignedDonors || [];
        let matchedCount = current.matchedDonorsCount;
        let newStatus = status || current.status;

        if (action === 'cancel' || (!action && status === 'Pending' && donorName)) {
          if (donorName) {
            assignedDonors = assignedDonors.filter((d) => d !== donorName);
            matchedCount = Math.max(0, matchedCount - 1);
          }
          if (assignedDonors.length === 0 && newStatus === 'In Progress') {
            newStatus = 'Pending';
          }
        } else if (action === 'pledge' || (!action && status === 'In Progress' && donorName)) {
          if (donorName && !assignedDonors.includes(donorName)) {
            assignedDonors.push(donorName);
            matchedCount = matchedCount + 1;
          }
          newStatus = 'In Progress';
        }

        const updated = await prisma.bloodRequest.update({
          where: { id: strId },
          data: {
            status: newStatus,
            assignedDonors,
            matchedDonorsCount: matchedCount,
            updatedAt: new Date(),
          },
        });

        const mapped = { ...updated, _id: updated.id };
        const idx = this.requests.findIndex(
          (r) => (r._id || r.id)?.toString() === strId
        );
        if (idx !== -1) this.requests[idx] = mapped;
        else this.requests.unshift(mapped);
        return mapped;
      }
    } catch (err: any) {
      console.warn('Prisma updateRequestStatus fallback:', err?.message || err);
    }

    const idx = this.requests.findIndex(
      (r) => (r._id || r.id)?.toString() === strId
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
      } else if (donorName) {
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
      this.requests[idx].updatedAt = new Date();
      return this.requests[idx];
    }
    return null;
  }

  // --- Inventories operations ---
  async getInventories(providerId?: string) {
    try {
      const where: any = {};
      if (providerId) {
        where.providerId = providerId.toString();
      }
      const dbInvs = await prisma.inventory.findMany({
        where,
        orderBy: { bloodGroup: 'asc' },
      });
      if (dbInvs && dbInvs.length > 0) {
        this.inventories = dbInvs.map((i) => ({ ...i, _id: i.id }));
        return this.inventories;
      }
    } catch (err: any) {
      console.warn('Prisma getInventories fallback:', err?.message || err);
    }

    if (providerId) {
      return this.inventories.filter((i) => (i.providerId || '').toString() === providerId.toString());
    }
    return this.inventories;
  }

  async updateInventory(id: string, unitsInStock: number, criticalThreshold?: number) {
    const strId = id.toString();
    try {
      const data: any = {
        unitsInStock: Number(unitsInStock),
        lastUpdated: new Date(),
      };
      if (criticalThreshold !== undefined) {
        data.criticalThreshold = Number(criticalThreshold);
      }
      const updated = await prisma.inventory.update({
        where: { id: strId },
        data,
      });
      const mapped = { ...updated, _id: updated.id };
      const idx = this.inventories.findIndex((i) => (i._id || i.id)?.toString() === strId);
      if (idx !== -1) this.inventories[idx] = mapped;
      return mapped;
    } catch (err: any) {
      console.warn('Prisma updateInventory fallback:', err?.message || err);
    }

    const idx = this.inventories.findIndex((i) => (i._id || i.id)?.toString() === strId);
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
    try {
      const dbCamps = await prisma.camp.findMany({
        orderBy: { startDate: 'asc' },
      });
      if (dbCamps && dbCamps.length > 0) {
        this.camps = dbCamps.map((c) => ({ ...c, _id: c.id }));
        return this.camps;
      }
    } catch (err: any) {
      console.warn('Prisma getCamps fallback:', err?.message || err);
    }
    return [...this.camps].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  }

  async createCamp(campData: any) {
    try {
      let validProviderId = null;
      if (campData.providerId) {
        const pExists = await prisma.user.findUnique({ where: { id: campData.providerId.toString() } }).catch(() => null);
        if (pExists) validProviderId = pExists.id;
      }

      const created = await prisma.camp.create({
        data: {
          providerId: validProviderId,
          providerName: campData.providerName || 'DropOfLife Partner Hospital',
          title: campData.title,
          description: campData.description || '',
          venueAddress: campData.venueAddress,
          district: campData.district || 'Dhaka',
          division: campData.division || 'Dhaka',
          startDate: campData.startDate ? new Date(campData.startDate) : new Date(),
          endDate: campData.endDate ? new Date(campData.endDate) : new Date(),
          targetUnits: Number(campData.targetUnits || 100),
          collectedUnits: Number(campData.collectedUnits || 0),
          status: campData.status || 'Upcoming',
          contactPhone: campData.contactPhone || '+8801521711716',
          volunteersCount: Number(campData.volunteersCount || 0),
          registeredVolunteers: campData.registeredVolunteers || [],
        },
      });
      const newDoc = { ...created, _id: created.id };
      this.camps.push(newDoc);
      return newDoc;
    } catch (err: any) {
      console.warn('Prisma createCamp fallback:', err?.message || err);
    }

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
    const strId = campId.toString();
    try {
      const current = await prisma.camp.findUnique({ where: { id: strId } });
      if (current) {
        let volunteers = current.registeredVolunteers || [];
        if (!volunteers.includes(volunteerName)) {
          volunteers.push(volunteerName);
        }
        const updated = await prisma.camp.update({
          where: { id: strId },
          data: {
            registeredVolunteers: volunteers,
            volunteersCount: volunteers.length,
            updatedAt: new Date(),
          },
        });
        const mapped = { ...updated, _id: updated.id };
        const idx = this.camps.findIndex((c) => (c._id || c.id)?.toString() === strId);
        if (idx !== -1) this.camps[idx] = mapped;
        return mapped;
      }
    } catch (err: any) {
      console.warn('Prisma registerCampVolunteer fallback:', err?.message || err);
    }

    const camp = this.camps.find((c) => (c._id || c.id)?.toString() === strId);
    if (camp) {
      if (!camp.registeredVolunteers.includes(volunteerName)) {
        camp.registeredVolunteers.push(volunteerName);
        camp.volunteersCount = camp.registeredVolunteers.length;
      }
      return camp;
    }
    return null;
  }

  // --- Payments ---
  async recordPayment(paymentData: any) {
    try {
      let validUserId = null;
      if (paymentData.userId) {
        const uExists = await prisma.user.findUnique({ where: { id: paymentData.userId.toString() } }).catch(() => null);
        if (uExists) validUserId = uExists.id;
      }

      const created = await prisma.payment.create({
        data: {
          userId: validUserId,
          userName: paymentData.userName || 'Lifesaver Supporter',
          userEmail: paymentData.userEmail || 'supporter@dropoflife.org',
          stripePaymentIntentId: paymentData.stripePaymentIntentId || `pi_${Date.now()}`,
          amount: Number(paymentData.amount) || 1000,
          currency: (paymentData.currency || 'bdt').toLowerCase(),
          paymentPurpose: paymentData.paymentPurpose || 'Lifesaver_Supporter_Fund',
          status: paymentData.status || 'succeeded',
          receiptUrl: paymentData.receiptUrl || '',
        },
      });
      const mapped = { ...created, _id: created.id };
      this.payments.unshift(mapped);
      return mapped;
    } catch (err: any) {
      console.warn('Prisma recordPayment fallback:', err?.message || err);
    }

    const payment = {
      _id: new mongoose.Types.ObjectId().toString(),
      createdAt: new Date(),
      ...paymentData,
    };
    this.payments.push(payment);
    return payment;
  }

  async getPayments() {
    try {
      const dbPayments = await prisma.payment.findMany({
        orderBy: { createdAt: 'desc' },
      });
      if (dbPayments && dbPayments.length > 0) {
        this.payments = dbPayments.map((p) => ({ ...p, _id: p.id }));
        return this.payments;
      }
    } catch (err: any) {
      console.warn('Prisma getPayments fallback:', err?.message || err);
    }
    return [...this.payments].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  // --- Reviews Operations ---
  async addReview(reviewData: any) {
    try {
      const created = await prisma.review.create({
        data: {
          donorId: reviewData.donorId?.toString() || '',
          donorName: reviewData.donorName || '',
          reviewerName: reviewData.reviewerName || 'Donor Supporter',
          reviewerContact: reviewData.reviewerContact || '',
          rating: Number(reviewData.rating) || 5.0,
          comment: reviewData.comment || '',
        },
      });
      const mapped = { ...created, _id: created.id };
      this.reviews.unshift(mapped);
      return mapped;
    } catch (err: any) {
      console.warn('Prisma addReview fallback:', err?.message || err);
    }

    const newReview = {
      _id: new mongoose.Types.ObjectId().toString(),
      createdAt: new Date(),
      ...reviewData,
    };
    this.reviews.unshift(newReview);
    return newReview;
  }

  async getReviews(donorId?: string) {
    try {
      const where: any = donorId ? { donorId: donorId.toString() } : {};
      const dbReviews = await prisma.review.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      });
      if (dbReviews && dbReviews.length > 0) {
        const mapped = dbReviews.map((r) => ({ ...r, _id: r.id }));
        if (!donorId) this.reviews = mapped;
        return mapped;
      }
    } catch (err: any) {
      console.warn('Prisma getReviews fallback:', err?.message || err);
    }

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
    try {
      const created = await prisma.complaint.create({
        data: {
          type: complaintData.type || 'misbehavior',
          category: complaintData.category || 'General Report',
          reportedUserId: complaintData.reportedUserId || null,
          reportedUserName: complaintData.reportedUserName || null,
          reporterName: complaintData.reporterName || 'Anonymous',
          reporterContact: complaintData.reporterContact || '',
          description: complaintData.description || '',
          status: 'Pending',
          adminNotes: complaintData.adminNotes || '',
        },
      });
      const mapped = { ...created, _id: created.id };
      this.complaints.unshift(mapped);
      return mapped;
    } catch (err: any) {
      console.warn('Prisma addComplaint fallback:', err?.message || err);
    }

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
    try {
      const where: any = {};
      if (filter?.type) where.type = filter.type;
      if (filter?.status) where.status = filter.status;
      const dbComplaints = await prisma.complaint.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      });
      if (dbComplaints && dbComplaints.length > 0) {
        const mapped = dbComplaints.map((c) => ({ ...c, _id: c.id }));
        if (!filter?.type && !filter?.status) this.complaints = mapped;
        return mapped;
      }
    } catch (err: any) {
      console.warn('Prisma getComplaints fallback:', err?.message || err);
    }

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
    const strId = id.toString();
    try {
      const updated = await prisma.complaint.update({
        where: { id: strId },
        data: {
          status,
          adminNotes: adminNotes !== undefined ? adminNotes : undefined,
          updatedAt: new Date(),
        },
      });
      const mapped = { ...updated, _id: updated.id };
      const idx = this.complaints.findIndex((c) => (c._id || c.id)?.toString() === strId);
      if (idx !== -1) this.complaints[idx] = mapped;
      return mapped;
    } catch (err: any) {
      console.warn('Prisma updateComplaintStatus fallback:', err?.message || err);
    }

    const idx = this.complaints.findIndex((c) => (c._id || c.id)?.toString() === strId);
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
    const strId = userId.toString();
    try {
      const updated = await prisma.user.update({
        where: { id: strId },
        data: {
          isSuspended,
          suspendedReason: reason || (isSuspended ? 'Violated community guidelines' : ''),
          isAvailable: isSuspended ? false : undefined,
          updatedAt: new Date(),
        },
      });
      const mapped = { ...updated, _id: updated.id };
      const idx = this.users.findIndex((u) => (u._id || u.id)?.toString() === strId);
      if (idx !== -1) this.users[idx] = mapped;
      return mapped;
    } catch (err: any) {
      console.warn('Prisma suspendUser fallback:', err?.message || err);
    }

    const idx = this.users.findIndex((u) => (u._id || u.id)?.toString() === strId);
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
        totalCampsOrganized,
        invAggregate,
        recentRequests,
      ] = await Promise.all([
        prisma.user.count({ where: { role: 'donor' } }).catch(() => 0),
        prisma.user.count({ where: { role: 'donor', isAvailable: true, isSuspended: false } }).catch(() => 0),
        prisma.user.count({ where: { isSuspended: true } }).catch(() => 0),
        prisma.user.count({ where: { role: 'provider' } }).catch(() => 0),
        prisma.bloodRequest.count({ where: { status: { in: ['Pending', 'In Progress'] } } }).catch(() => 0),
        prisma.bloodRequest.count({ where: { status: 'Fulfilled' } }).catch(() => 0),
        prisma.complaint.count().catch(() => 0),
        prisma.complaint.count({ where: { status: 'Pending' } }).catch(() => 0),
        prisma.camp.count().catch(() => 0),
        prisma.inventory.aggregate({ _sum: { unitsInStock: true } }).catch(() => ({ _sum: { unitsInStock: 0 } })),
        prisma.bloodRequest.findMany({ take: 5, orderBy: { createdAt: 'desc' } }).catch(() => []),
      ]);

      const totalUnitsInStock = invAggregate._sum?.unitsInStock ?? this.inventories.reduce((acc, curr) => acc + curr.unitsInStock, 0);

      return {
        totalDonors: totalDonors || this.users.filter((u) => u.role === 'donor').length,
        availableDonors: availableDonors || this.users.filter((u) => u.role === 'donor' && u.isAvailable && !u.isSuspended).length,
        suspendedDonors: suspendedDonors || this.users.filter((u) => u.isSuspended).length,
        totalProviders: totalProviders || this.users.filter((u) => u.role === 'provider').length,
        activeRequests: activeRequests || this.requests.filter((r) => r.status === 'Pending' || r.status === 'In Progress').length,
        fulfilledRequests: fulfilledRequests || this.requests.filter((r) => r.status === 'Fulfilled').length,
        totalUnitsInStock,
        totalLivesSaved: (fulfilledRequests || 1) * 3 + 142,
        totalCampsOrganized: totalCampsOrganized || this.camps.length,
        totalComplaints: totalComplaints || this.complaints.length,
        pendingComplaints: pendingComplaints || this.complaints.filter((c) => c.status === 'Pending').length,
        recentRequests: recentRequests.length > 0 ? recentRequests.map((r) => ({ ...r, _id: r.id })) : this.requests.slice(0, 5),
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
