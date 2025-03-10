import jwt from 'jsonwebtoken';
import { IUser } from '@/models/User';
import { Types } from 'mongoose';

// Define types for token payload
export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  firstName?: string;
  lastName?: string;
  iat?: number;
  exp?: number;
}

// JWT configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your-default-secret-key'; 
const JWT_EXPIRES_IN = '24h';
const JWT_REFRESH_EXPIRES_IN = '7d';

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthError';
  }
}

export const auth = {
  // Generate JWT token
  generateToken(user: IUser & { _id: Types.ObjectId }): string {
    const payload: TokenPayload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
    };

    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });
  },

  // Generate refresh token with longer expiry
  generateRefreshToken(user: IUser & { _id: Types.ObjectId }): string {
    const payload = {
      userId: user._id.toString(),
      tokenType: 'refresh',
    };

    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_REFRESH_EXPIRES_IN,
    });
  },

  // Verify JWT token
  verifyToken(token: string): TokenPayload {
    try {
      return jwt.verify(token, JWT_SECRET) as TokenPayload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new AuthError('Token expired');
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw new AuthError('Invalid token');
      }
      throw new AuthError('Invalid or expired token');
    }
  },

  // Check if token is expired
  isTokenExpired(token: string): boolean {
    try {
      const decoded = jwt.decode(token) as TokenPayload;
      if (!decoded || !decoded.exp) return true;
      
      // Check if current time is past expiration
      const currentTime = Math.floor(Date.now() / 1000);
      return decoded.exp < currentTime;
    } catch {
      return true;
    }
  },

  // Check if token is about to expire (within 30 minutes)
  isTokenAboutToExpire(token: string): boolean {
    try {
      const decoded = jwt.decode(token) as TokenPayload;
      if (!decoded || !decoded.exp) return true;
      
      // Check if token expires within 30 minutes
      const currentTime = Math.floor(Date.now() / 1000);
      const thirtyMinutesInSeconds = 30 * 60;
      return decoded.exp - currentTime < thirtyMinutesInSeconds;
    } catch {
      return true;
    }
  },

  // Extract token from Authorization header
  extractTokenFromHeader(authHeader?: string): string {
    if (!authHeader) {
      throw new AuthError('No authorization header');
    }

    const [bearer, token] = authHeader.split(' ');

    if (bearer !== 'Bearer' || !token) {
      throw new AuthError('Invalid authorization header format');
    }

    return token;
  },

  // Middleware to check if user has required role
  checkRole(allowedRoles: string[]): (role: string) => boolean {
    return (userRole: string) => allowedRoles.includes(userRole);
  },

  // Get user data from token
  getUserFromToken(token: string): TokenPayload | null {
    try {
      return jwt.decode(token) as TokenPayload;
    } catch {
      return null;
    }
  },
}; 