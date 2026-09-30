import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: process.env.PORT || 5001,
  nodeEnv: process.env.NODE_ENV || 'development',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/dropoflife',
  jwtSecret: process.env.JWT_SECRET || 'dropoflife_jwt_secret_lifesaver_2026',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  stripeSecretKey: process.env.STRIPE_SECRET_KEY || 'sk_test_mock_stripe_key_demo_2026',
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || 'whsec_mock_demo_secret',
};
