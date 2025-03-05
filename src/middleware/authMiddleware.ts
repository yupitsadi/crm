import { NextRequest } from 'next/server';
import { auth, AuthError } from '@/lib/auth';

// Updated middleware that returns user data or null instead of NextResponse.next()
export async function authMiddleware(
  req: NextRequest,
  allowedRoles: string[] = []
) {
  try {
    // Get authorization header
    const authHeader = req.headers.get('authorization') || undefined;
    
    // Extract and verify token
    const token = auth.extractTokenFromHeader(authHeader);
    const payload = auth.verifyToken(token);

    // Check role if required
    if (allowedRoles.length > 0) {
      const hasPermission = auth.checkRole(allowedRoles)(payload.role);
      if (!hasPermission) {
        return { 
          authorized: false, 
          error: 'Insufficient permissions',
          status: 403
        };
      }
    }

    // Return the user data from the token
    return { 
      authorized: true,
      user: payload
    };
  } catch (error) {
    if (error instanceof AuthError) {
      return { 
        authorized: false, 
        error: error.message,
        status: 401
      };
    }
    
    return { 
      authorized: false, 
      error: 'Authentication failed',
      status: 401
    };
  }
} 