import { Router } from 'express';
import authRoutes from './auth.routes';
import donorRoutes from './donor.routes';
import requestRoutes from './request.routes';
import inventoryRoutes from './inventory.routes';
import campRoutes from './camp.routes';
import paymentRoutes from './payment.routes';
import adminRoutes from './admin.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/donors', donorRoutes);
router.use('/requests', requestRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/camps', campRoutes);
router.use('/payments', paymentRoutes);
router.use('/admin', adminRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    platform: 'DropOfLife REST API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

export default router;
