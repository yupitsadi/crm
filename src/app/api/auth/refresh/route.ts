import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getUserModel } from '@/models/User';
import jwt from 'jsonwebtoken';

interface RefreshTokenPayload {
  userId: string;
  tokenType: string;
  iat: number;
  exp: number;
}

export async function POST(req: NextRequest) {
  try {
    // Parse request body
    const { refreshToken } = await req.json();

    if (!refreshToken) {
      return NextResponse.json(
        { error: 'Refresh token is required' },
        { status: 400 }
      );
    }

    // Verify refresh token
    let decoded: RefreshTokenPayload;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_SECRET || 'your-default-secret-key') as RefreshTokenPayload;
    } catch {
      return NextResponse.json(
        { error: 'Invalid refresh token' },
        { status: 401 }
      );
    }

    // Check if token is a refresh token
    if (decoded.tokenType !== 'refresh') {
      return NextResponse.json(
        { error: 'Invalid token type' },
        { status: 401 }
      );
    }

    // Get User model with CRM database connection
    const User = await getUserModel();
    
    // Find user by ID from token
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 401 }
      );
    }

    // Generate new tokens
    const newToken = auth.generateToken(user);
    const newRefreshToken = auth.generateRefreshToken(user);

    return NextResponse.json({
      token: newToken,
      refreshToken: newRefreshToken,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Unknown error occurred';
      
    return NextResponse.json(
      { error: 'Token refresh failed', details: errorMessage },
      { status: 500 }
    );
  }
} 