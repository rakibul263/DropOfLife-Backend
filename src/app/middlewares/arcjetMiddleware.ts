import { Request, Response, NextFunction } from 'express';
import { arcjetClient } from '../utils/arcjet';

export const arcjetMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  if (!arcjetClient) {
    // If ARCJET_KEY is not configured yet, pass through smoothly for local development
    return next();
  }

  try {
    const decision = await arcjetClient.protect(req);

    if (decision.isDenied()) {
      if (decision.reason.isRateLimit()) {
        res.status(429).json({
          success: false,
          message: 'Rate limit exceeded: Too many requests. Please try again in a moment.',
          security: 'Protected by Arcjet Rate Limiting',
        });
        return;
      }

      if (decision.reason.isBot()) {
        res.status(403).json({
          success: false,
          message: 'Access Denied: Automated bot traffic detected.',
          security: 'Protected by Arcjet Bot Detection',
        });
        return;
      }

      res.status(403).json({
        success: false,
        message: 'Security Policy Violation: Malicious payload blocked.',
        security: 'Protected by Arcjet WAF Shield',
      });
      return;
    }

    next();
  } catch (error) {
    // If network to Arcjet fails, do not block the application
    console.warn('Arcjet runtime check skipped:', error);
    next();
  }
};
