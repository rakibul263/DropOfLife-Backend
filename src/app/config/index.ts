import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: process.env.PORT || 5050,
  nodeEnv: process.env.NODE_ENV || 'development',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/dropoflife',
  databaseUrl:
    process.env.DATABASE_URL ||
    'postgresql://neondb_owner:npg_0XIlEoL3MWQi@ep-empty-cherry-b3u7mae5-pooler.c-4.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
  jwtSecret: process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || 'dropoflife_jwt_secret_lifesaver_2026',
  jwtExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || process.env.JWT_EXPIRES_IN || '1d',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'dropoflife_jwt_refresh_secret_2026',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  stripeSecretKey: process.env.STRIPE_SECRET_KEY || '',
  stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
  arcjetKey: process.env.ARCJET_KEY || '',
  resendApiKey: process.env.RESEND_API_KEY || '',
  resendFromEmail: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
  resendAdminEmail: process.env.RESEND_ADMIN_EMAIL || '',
  smtpHost: process.env.SMTP_HOST || '',
  smtpPort: Number(process.env.SMTP_PORT) || 465,
  smtpUser: process.env.SMTP_USER || process.env.GMAIL_USER || '',
  smtpPass: process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD || '',
  smtpFrom: process.env.SMTP_FROM || process.env.EMAIL_FROM || '',
  allowedOrigins: (
    process.env.ALLOWED_ORIGINS ||
    process.env.CLIENT_URL ||
    'http://localhost:3000'
  )
    .split(',')
    .map((url) => url.trim().replace(/\/$/, '')),
};
