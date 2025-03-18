import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

// MongoDB connection string should be in environment variables
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';

export async function POST(request: Request) {
  // Verify authentication (this is a simplified example)
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }
  
  // Parse request body
  try {
    const attendanceRecord = await request.json();
    
    // Create MongoDB client
    const client = new MongoClient(MONGODB_URI);
    
    try {
      // Connect to MongoDB
      await client.connect();
      
      // Access database and collection
      const db = client.db('CRM');
      const collection = db.collection('Attendance');
      
      // Create a unique filter to identify this attendance record
      // Using transaction ID as the primary identifier if available
      const filter = attendanceRecord.transactionId 
        ? {
            transactionId: attendanceRecord.transactionId,
            childName: attendanceRecord.childName,
          } 
        : {
            bookingId: attendanceRecord.bookingId,
            childName: attendanceRecord.childName,
            workshopId: attendanceRecord.workshopId,
            workshopDate: attendanceRecord.workshopDate
          };
      
      // Prepare the update operation
      const updateDoc = {
        $set: {
          ...attendanceRecord,
          updatedAt: new Date(),
        },
        $setOnInsert: {
          createdAt: new Date(),
        }
      };
      
      // Use upsert to avoid duplicates (update if exists, insert if doesn't)
      const result = await collection.updateOne(filter, updateDoc, { upsert: true });
      
      // Close connection
      await client.close();
      
      // Return success response
      return NextResponse.json({ 
        success: true, 
        message: result.upsertedId 
          ? 'New attendance record created' 
          : 'Attendance record updated',
        operation: result.upsertedId ? 'insert' : 'update',
        id: result.upsertedId || filter
      });
      
    } catch (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json({ 
        success: false, 
        message: 'Failed to save attendance to database' 
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error('Error parsing request:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Invalid request format' 
    }, { status: 400 });
  }
} 