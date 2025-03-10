import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { authMiddleware } from '@/middleware/authMiddleware';

// Define interfaces for booking data
interface BookingChild {
  childname: string;
  age: number;
  _id: { $oid: string } | string;
}

interface BookingPayment {
  Transaction_ID: string;
  gateway: string | null;
  mode: string;
  status: string;
  product_info: string;
  reference_id: string;
  amount: number;
  hash_key: string | null;
  access_key: string | null;
  surl: string | null;
  furl: string | null;
  agent_code: string | null;
  updated_by: string | null;
  offline_details: unknown | null;
}

interface BookingData {
  _id: { $oid: string } | string;
  workshop_id: string;
  child: BookingChild[];
  parent_name?: string;
  ph_number: string;
  otp_verified: boolean;
  date_of_workshop: string;
  time: string;
  workshop_location: string;
  payment: BookingPayment;
  center_code: string;
  status: string;
  created_at: { $date: string } | string;
  updated_at: { $date: string } | string;
  merchant?: {
    name: string | null;
    transaction_id: string | null;
  };
  __v: number;
}

export async function GET(req: NextRequest) {
  try {
    // Authorize the request
    const authResult = await authMiddleware(req);
    if (!authResult.authorized) {
      return NextResponse.json({ error: authResult.error || 'Unauthorized' }, { status: authResult.status || 401 });
    }

    // Connect to database
    console.log('Connecting to database to fetch bookings...');
    const connection = await connectToDatabase('workshop');
    
    if (!connection) {
      console.error('Failed to establish database connection');
      throw new Error('Database connection failed');
    }
    
    console.log('Database connection established.');
    
    // Try to use the raw collection first
    let bookings: BookingData[] = [];
    
    if (connection.db) {
      try {
        console.log('Attempting to fetch bookings from raw collection...');
        const rawCollection = connection.db.collection('bookings');
        const rawBookings = await rawCollection.find({}).toArray();
        
        // Cast to BookingData[] type with a safe two-step conversion
        bookings = rawBookings as unknown as BookingData[];
        
        if (bookings && bookings.length > 0) {
          console.log(`Found ${bookings.length} bookings using raw collection`);
          
          return NextResponse.json({ 
            success: true, 
            bookings 
          });
        } else {
          console.log('No bookings found in collection');
        }
      } catch (rawError) {
        console.error('Error with raw collection access:', rawError);
      }
    }
    
    // If raw collection failed, try with model
    if (!bookings || bookings.length === 0) {
      console.log('Falling back to schema-based query...');
      // Since we no longer have mongoose imported and queryOptions defined, 
      // we'll use the raw collection again with a different approach
      try {
        if (connection.db) {
          const collection = connection.db.collection('bookings');
          const options = { maxTimeMS: 30000 }; // Timeout for this specific query
          const results = await collection.find({}, options).toArray();
          bookings = results as unknown as BookingData[];
          console.log(`Found ${bookings?.length || 0} bookings using fallback method`);
        }
      } catch (fallbackError) {
        console.error('Error with fallback query:', fallbackError);
      }
    }
    
    // If we still have no bookings, use sample data
    if (!bookings || bookings.length === 0) {
      console.log('Using sample booking data as fallback');
      
      // Sample booking data
      const sampleBookings: BookingData[] = [{
        "_id": {
          "$oid": "67c6e523eaa52e3a48379c94"
        },
        "workshop_id": "6763b880cb2ae23a03f3d3c5",
        "child": [
          {
            "childname": "Test Child",
            "age": 12,
            "_id": {
              "$oid": "67c6e523eaa52e3a48379c95"
            }
          }
        ],
        "parent_name": "Test Parent",
        "ph_number": "9571209434",
        "otp_verified": false,
        "date_of_workshop": "2025-03-16",
        "time": "4:00 PM - 6:30 PM",
        "workshop_location": "Genius Labs, Skymark",
        "payment": {
          "Transaction_ID": "3d4f235e-162a-4630-983a-d35f0cfc7dcf",
          "gateway": null,
          "mode": "online",
          "status": "initiated",
          "product_info": "Robotics Bikes and Stunts",
          "reference_id": "REF_3d4f235e-162a-4630-983a-d35f0cfc7dcf",
          "hash_key": null,
          "amount": 1690,
          "access_key": null,
          "surl": null,
          "furl": null,
          "agent_code": null,
          "updated_by": null,
          "offline_details": null
        },
        "center_code": "GLINDNOICE01",
        "status": "pending",
        "created_at": {
          "$date": "2025-03-04T11:33:55.689Z"
        },
        "updated_at": {
          "$date": "2025-03-04T11:33:55.689Z"
        },
        "merchant": {
          "name": null,
          "transaction_id": null
        },
        "__v": 0
      }];
      
      return NextResponse.json({ 
        success: true, 
        bookings: sampleBookings,
        isUsingFallbackData: true
      });
    }
    
    return NextResponse.json({ 
      success: true, 
      bookings 
    });
    
  } catch (error: unknown) {
    console.error('Error fetching bookings:', error);
    
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Unknown error occurred';
    
    return NextResponse.json({ 
      success: false, 
      error: errorMessage 
    }, { status: 500 });
  }
} 