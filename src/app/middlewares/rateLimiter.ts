import rateLimit from 'express-rate-limit';

/**
 * Strict Rate Limiter for Authentication Endpoints (Login, Register)
 * Prevents credential stuffing, dictionary attacks, and user enumeration.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per 15 minutes per IP
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  message: {
    success: false,
    message: 'Too many authentication attempts from this IP address. Please try again after 15 minutes.',
    retryAfter: '15 minutes',
  },
});

/**
 * Highly Strict Limiter for Password Reset & OTP Dispatch
 * Prevents email spamming, SMS toll fraud, and brute-forcing verification codes.
 */
export const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per 15 minutes per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many password reset / OTP verification requests. Please wait 15 minutes before trying again.',
    retryAfter: '15 minutes',
  },
});

/**
 * General Public API Rate Limiter
 * Guards the server against high-frequency scraping and DoS spikes.
 */
export const generalApiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 200, // 200 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests sent to the server. Please slow down.',
  },
});
