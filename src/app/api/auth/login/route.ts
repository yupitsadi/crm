import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getUserModel } from '@/models/User';

export async function POST(req: NextRequest) {
  try {
    // Parse request body
    const { email, password } = await req.json();

    // Get User model with CRM database connection
    const User = await getUserModel();
    
    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Check password match
    if (password !== user.password) { // In production, use comparePassword method
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Generate JWT token
    const token = auth.generateToken(user);

    return NextResponse.json({
      token,
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
      { error: 'Login failed', details: errorMessage },
      { status: 500 }
    );
  }
} 