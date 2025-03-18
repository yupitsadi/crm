import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

// MongoDB connection string should be in environment variables
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';

// Define the query type
interface QueryFilter {
  $or: Array<{
    transactionId?: { $in: string[] },
    bookingId?: { $in: string[] }
  }>;
}

export async function GET(request: Request) {
  // Verify authentication (this is a simplified example)
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    // Parse query parameters
    const url = new URL(request.url);
    const transactionIds = url.searchParams.getAll('transactionId');
    const bookingIds = url.searchParams.getAll('bookingId');
    
    if (transactionIds.length === 0 && bookingIds.length === 0) {
      return NextResponse.json({ 
        success: false, 
        message: 'No identifiers provided. Please provide transactionId or bookingId parameters.' 
      }, { status: 400 });
    }
    
    // Create MongoDB client
    const client = new MongoClient(MONGODB_URI);
    
    try {
      // Connect to MongoDB
      await client.connect();
      
      // Access database and collection
      const db = client.db('CRM');
      const collection = db.collection('Attendance');
      
      // Build query - find records matching any of the provided transactionIds or bookingIds
      const query: QueryFilter = { $or: [] };
      
      if (transactionIds.length > 0) {
        query.$or.push({ transactionId: { $in: transactionIds } });
      }
      
      if (bookingIds.length > 0) {
        query.$or.push({ bookingId: { $in: bookingIds } });
      }
      
      // Fetch attendance records
      const attendanceRecords = await collection.find(query).toArray();
      
      // Close connection
      await client.close();
      
      // Return success response
      return NextResponse.json({ 
        success: true, 
        message: `Retrieved ${attendanceRecords.length} attendance records`,
        attendanceRecords
      });
      
    } catch (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json({ 
        success: false, 
        message: 'Failed to fetch attendance records from database' 
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Invalid request format' 
    }, { status: 400 });
  }
} 