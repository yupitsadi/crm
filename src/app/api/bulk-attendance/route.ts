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
    const data = await request.json();
    const { attendanceRecords, dbName = 'CRM', collectionName = 'Attendance' } = data;
    
    if (!Array.isArray(attendanceRecords) || attendanceRecords.length === 0) {
      return NextResponse.json({ 
        success: false, 
        message: 'No attendance records provided' 
      }, { status: 400 });
    }
    
    // Create MongoDB client
    const client = new MongoClient(MONGODB_URI);
    
    try {
      // Connect to MongoDB
      await client.connect();
      
      // Access database and collection
      const db = client.db(dbName);
      const collection = db.collection(collectionName);
      
      // Prepare bulk operations
      const bulkOperations = attendanceRecords.map(record => {
        // Create a unique filter for each record based on transaction ID if available
        const filter = record.transactionId
          ? {
              transactionId: record.transactionId,
              childName: record.childName,
            }
          : {
              bookingId: record.bookingId,
              childName: record.childName,
              workshopId: record.workshopId,
              workshopDate: record.workshopDate
            };
        
        // Prepare the update
        return {
          updateOne: {
            filter,
            update: {
              $set: {
                ...record,
                updatedAt: new Date()
              },
              $setOnInsert: {
                createdAt: new Date()
              }
            },
            upsert: true
          }
        };
      });
      
      // Execute bulk operation
      const result = await collection.bulkWrite(bulkOperations);
      
      // Close connection
      await client.close();
      
      // Return success response
      return NextResponse.json({ 
        success: true, 
        message: `Attendance processed successfully`,
        result: {
          inserted: result.upsertedCount,
          updated: result.modifiedCount,
          total: bulkOperations.length
        }
      });
      
    } catch (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json({ 
        success: false, 
        message: 'Failed to save attendance records to database' 
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