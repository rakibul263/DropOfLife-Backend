import jwt, { JwtPayload, Secret, SignOptions } from 'jsonwebtoken';
import { config } from '../config';

const createToken = (
  payload: Record<string, unknown>,
  secret: Secret,
  expireTime: string | number
): string => {
  const options: SignOptions = {
    expiresIn: expireTime as any,
  };
  return jwt.sign(payload, secret, options);
};

const verifyToken = (token: string, secret: Secret): JwtPayload => {
  return jwt.verify(token, secret) as JwtPayload;
};

const decodeToken = (token: string): JwtPayload | null => {
  return jwt.decode(token) as JwtPayload | null;
};

/**
 * Creates short-lived Access Token containing user claims and permissions
 */
const createAccessToken = (payload: {
  id: string;
  email: string;
  role: string;
  name: string;
  bloodGroup?: string;
}): string => {
  return createToken(
    payload,
    config.jwtSecret as Secret,
    config.jwtExpiresIn
  );
};

/**
 * Creates long-lived Refresh Token for rolling session renewal
 */
const createRefreshToken = (payload: {
  id: string;
  email: string;
  role: string;
}): string => {
  return createToken(
    payload,
    config.jwtRefreshSecret as Secret,
    config.jwtRefreshExpiresIn
  );
};

/**
 * Verifies Refresh Token against dedicated refresh secret
 */
const verifyRefreshToken = (token: string): JwtPayload => {
  try {
    return verifyToken(token, config.jwtRefreshSecret as Secret);
  } catch (err) {
    // Fallback to primary jwtSecret in case legacy refresh token was signed with jwtSecret
    return verifyToken(token, config.jwtSecret as Secret);
  }
};

export const jwtHelpers = {
  createToken,
  verifyToken,
  decodeToken,
  createAccessToken,
  createRefreshToken,
  verifyRefreshToken,
};
