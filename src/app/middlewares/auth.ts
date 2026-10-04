import { Request, Response, NextFunction } from 'express';
import { Secret } from 'jsonwebtoken';
import { jwtHelpers } from '../utils/jwtHelpers';
import { config } from '../config';

export interface IAuthUser {
  id: string;
  email: string;
  role: 'donor' | 'provider' | 'admin';
  name: string;
  bloodGroup?: string;
}

export interface CustomAuthRequest extends Request {
  user?: IAuthUser;
}

export const auth = (...requiredRoles: string[]) => {
  return async (
    req: CustomAuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      // 1. Extract Token from Authorization header or cookie
      const authHeader = req.headers.authorization;
      let token = '';

      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
      } else if (req.cookies && req.cookies.token) {
        token = req.cookies.token;
      }

      if (!token) {
        res.status(401).json({
          success: false,
          message: 'Access Denied: You must be logged in to access this resource.',
        });
        return;
      }

      // 2. Verify JWT Token using jwtHelpers
      const verifiedUser = jwtHelpers.verifyToken(
        token,
        config.jwtSecret as Secret
      ) as IAuthUser;

      req.user = verifiedUser;

      // 3. Role-Based Access Control (RBAC)
      if (requiredRoles.length > 0 && !requiredRoles.includes(verifiedUser.role)) {
        res.status(403).json({
          success: false,
          message: `Forbidden: Access requires one of [${requiredRoles.join(
            ', '
          )}] permissions. Current role: ${verifiedUser.role}`,
        });
        return;
      }

      next();
    } catch (err: any) {
      res.status(401).json({
        success: false,
        message: 'Invalid, malformed, or expired JWT authentication token.',
      });
    }
  };
};

export const authOptional = () => {
  return async (
    req: CustomAuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;
      let token = '';

      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
      } else if (req.cookies && req.cookies.token) {
        token = req.cookies.token;
      }

      if (token) {
        try {
          const verifiedUser = jwtHelpers.verifyToken(
            token,
            config.jwtSecret as Secret
          ) as IAuthUser;
          req.user = verifiedUser;
        } catch (e) {
          // Token expired or invalid, proceed as guest
        }
      }
      next();
    } catch (err) {
      next();
    }
  };
};
