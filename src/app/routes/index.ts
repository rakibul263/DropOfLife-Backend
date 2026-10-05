import { Router } from 'express';
import { dataStore } from '../utils/dataStore';
import { AuthRoutes } from '../modules/auth/auth.route';
import { DonorRoutes } from '../modules/donor/donor.route';
import { BloodRequestRoutes } from '../modules/bloodRequest/bloodRequest.route';
import { InventoryRoutes } from '../modules/inventory/inventory.route';
import { CampRoutes } from '../modules/camp/camp.route';
import { PaymentRoutes } from '../modules/payment/payment.route';
import { AdminRoutes } from '../modules/admin/admin.route';

const router = Router();

const moduleRoutes = [
  { path: '/auth', route: AuthRoutes },
  { path: '/donors', route: DonorRoutes },
  { path: '/requests', route: BloodRequestRoutes },
  { path: '/inventory', route: InventoryRoutes },
  { path: '/camps', route: CampRoutes },
  { path: '/payments', route: PaymentRoutes },
  { path: '/admin', route: AdminRoutes },
];

moduleRoutes.forEach((item) => router.use(item.path, item.route));

// Public Platform Telemetry & Analytics endpoint
router.get('/stats', async (req, res) => {
  try {
    const stats = await dataStore.getPlatformAnalytics();
    res.status(200).json({
      success: true,
      message: 'Platform telemetry fetched successfully from database',
      data: { stats },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    platform: 'DropOfLife REST API (Modular MVC Pattern)',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    hotline: '+8801521711716',
    landline: '02-9351969',
  });
});

export default router;
