import jwt from 'jsonwebtoken';
import { IUser } from '@/models/User';
import { Types } from 'mongoose';

// Define types for token payload
export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

// JWT configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your-default-secret-key'; 
const JWT_EXPIRES_IN = '24h';

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
    };

    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });
  },

  // Verify JWT token
  verifyToken(token: string): TokenPayload {
    try {
      return jwt.verify(token, JWT_SECRET) as TokenPayload;
    } catch {
      throw new AuthError('Invalid or expired token');
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
}; 