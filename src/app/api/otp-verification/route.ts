import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '@/middleware/authMiddleware';
import mongoose from 'mongoose';
import { getWorkshopDb } from '@/lib/db';

// Define an interface for the booking structure
interface BookingDocument {
  _id: mongoose.Types.ObjectId | string;
  workshop_id?: string;
  child?: Array<{ childname: string; age: number; _id?: mongoose.Types.ObjectId | string }>;
  parent_name?: string;
  ph_number?: string;
  otp_verified?: boolean;
  date_of_workshop?: string;
  time?: string;
  workshop_location?: string;
  payment?: {
    Transaction_ID?: string;
    product_info?: string;
    amount?: number;
    status?: string;
    gateway?: string;
    mode?: string;
  };
  status?: string;
  center_code?: string;
  created_at?: { $date: string } | string | Date;
}

export async function GET(req: NextRequest) {
  // Authentication check
  const authResponse = await authMiddleware(req, ['admin', 'staff']);
  if (!authResponse.authorized) {
    console.error('Authentication failed:', authResponse.error);
    return NextResponse.json(
      { error: authResponse.error || 'Authentication failed', details: 'User not authorized to access this endpoint' },
      { status: authResponse.status }
    );
  }

  try {
    // Connect to the workshop database with timeout
    let connection: mongoose.Connection;
    try {
      // Add a timeout to the database connection
      const connectionPromise = getWorkshopDb();
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Database connection timeout')), 15000);
      });
      
      connection = await Promise.race([connectionPromise, timeoutPromise]);
    } catch (connError) {
      console.error('Database connection error:', connError);
      return NextResponse.json(
        { 
          error: 'Database connection error', 
          details: connError instanceof Error ? connError.message : 'Failed to connect to database' 
        }, 
        { status: 503 } // Service Unavailable
      );
    }
    
    // Verify connection is valid
    if (!connection || connection.readyState !== 1) {
      const state = connection ? connection.readyState : 'null';
      console.error(`Invalid database connection state: ${state}`);
      return NextResponse.json(
        { error: 'Database connection error', details: `Invalid connection state: ${state}` }, 
        { status: 503 }
      );
    }
    
    console.log('Valid connection to workshop database established');
    
    // Safety check for database access
    if (!connection.db) {
      console.error('Database object is undefined');
      return NextResponse.json(
        { error: 'Database error', details: 'Database object is undefined' }, 
        { status: 500 }
      );
    }
    
    // Get the bookings collection
    const bookingsCollection = connection.db.collection('bookings');
    
    // Fetch all bookings with a timeout
    let bookings: BookingDocument[];
    try {
      const queryPromise = bookingsCollection.find({}).toArray() as Promise<BookingDocument[]>;
      const queryTimeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Query timeout')), 10000);
      });
      
      bookings = await Promise.race([queryPromise, queryTimeoutPromise]);
    } catch (queryError) {
      console.error('Error querying bookings collection:', queryError);
      return NextResponse.json(
        { error: 'Database query error', details: queryError instanceof Error ? queryError.message : 'Failed to query database' }, 
        { status: 500 }
      );
    }
    
    console.log(`Found ${bookings.length} records in the 'bookings' collection`);
    
    // Process bookings to format for OTP verification
    const verifications = bookings.map((booking) => {
      // Format the child names from the booking
      let childNames: string[] = [];
      let childAges: number[] = [];
      
      if (booking.child && Array.isArray(booking.child)) {
        childNames = booking.child.map((child) => child.childname);
        childAges = booking.child.map((child) => child.age);
      }
      
      // Determine payment gateway (could be from gateway or mode fields)
      const paymentGateway = booking.payment?.gateway || booking.payment?.mode || 'Unknown';
      
      // Normalize the payment status for consistent display
      let paymentStatus = booking.payment?.status || 'Unknown';
      
      // Convert to lowercase for case-insensitive comparison, then capitalize first letter
      if (paymentStatus && paymentStatus !== 'Unknown') {
        const lowercaseStatus = paymentStatus.toLowerCase();
        paymentStatus = lowercaseStatus.charAt(0).toUpperCase() + lowercaseStatus.slice(1);
      }
      
      return {
        id: booking._id.toString(),
        workshopId: booking.workshop_id || null,
        childNames: childNames,
        childAges: childAges,
        parentName: booking.parent_name || 'Unknown',
        phoneNumber: booking.ph_number || 'Unknown',
        otpVerified: booking.otp_verified || false,
        workshopDate: booking.date_of_workshop || 'Unknown',
        workshopTime: booking.time || 'Unknown',
        workshopLocation: booking.workshop_location || 'Unknown',
        transactionId: booking.payment?.Transaction_ID || 'N/A',
        productInfo: booking.payment?.product_info || 'Unknown',
        amount: booking.payment?.amount || 0,
        status: booking.status || 'pending',
        centerCode: booking.center_code || 'Unknown',
        createdAt: booking.created_at 
          ? (typeof booking.created_at === 'object' && '$date' in booking.created_at) 
            ? new Date(booking.created_at.$date).toISOString() 
            : new Date(booking.created_at.toString()).toISOString()
          : new Date().toISOString(),
        paymentStatus: paymentStatus,
        paymentGateway: paymentGateway
      };
    });
    
    return NextResponse.json({ verifications });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Unknown error occurred';
      
    console.error('Error in OTP verification API:', errorMessage);
    
    return NextResponse.json(
      { error: 'Failed to fetch OTP verification data', details: errorMessage }, 
      { status: 500 }
    );
  }
} 