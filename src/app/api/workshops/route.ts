import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '@/middleware/authMiddleware';
import { getWorkshopDb } from '@/lib/db';

// We're using the model directly from the database connection,
// so we don't need to define the schema here
// const workshopSchema = new mongoose.Schema({...});

export async function GET(req: NextRequest) {
  // Check authentication and roles
  const authResponse = await authMiddleware(req, ['admin', 'staff']);
  if (!authResponse.authorized) {
    console.error('Authentication failed:', authResponse.error);
    return NextResponse.json(
      { error: authResponse.error || 'Authentication failed' },
      { status: authResponse.status }
    );
  }

  try {
    // Connect to the workshop database using direct connection
    const connection = await getWorkshopDb();
    
    // Check if the connection is valid
    if (!connection || !connection.db) {
      throw new Error('Failed to connect to database');
    }
    
    console.log('Connected to database: workshop');
    
    // Use the direct collection instead of Mongoose model
    const workshopCollection = connection.db.collection('workshop_details');
    
    // Execute operations with timeout options
    // First get a count with a more efficient countDocuments command
    const countPromise = Promise.race([
      workshopCollection.countDocuments({}),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Count operation timed out')), 5000)
      )
    ]);
    
    // Then get a sample of workshops
    const workshopsPromise = Promise.race([
      workshopCollection.find({})
        .limit(5)
        .project({ theme: 1, date_of_workshop: 1, rate: 1, children_enrolled: 1 })
        .toArray(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Find operation timed out')), 5000)
      )
    ]);
    
    // Wait for both operations to complete
    const [totalWorkshops, workshops] = await Promise.all([
      countPromise,
      workshopsPromise
    ]);
    
    console.log(`Found ${totalWorkshops} total workshops`);
    
    return NextResponse.json({ 
      totalWorkshops,
      workshops 
    });
  } catch (error) {
    console.error('Error fetching workshop data:', error);
    
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Unknown error occurred';
    
    return NextResponse.json(
      { error: 'Failed to fetch workshop data', details: errorMessage },
      { status: 500 }
    );
  }
}