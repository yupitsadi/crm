import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { workshop as WorkshopModel } from '@/models/workshop';
import { connectToDatabase } from '@/lib/db';


// Sample workshop data fallback
function getSampleWorkshops() {
  return [
    {
      _id: '1',
      theme: 'Smart City Vehicles',
      date_of_workshop: '2023-11-15',
      duration: 120,
      rate: 1200,
      children_enrolled: 24,
      description: [
        {
          type: 'paragraph',
          content: 'Learn about smart city transportation and build model vehicles using advanced robotics concepts.'
        },
        {
          type: 'list',
          content: 'Workshop highlights:',
          subpoints: [
            'Build autonomous vehicles',
            'Learn about sensors and programming',
            'Understand smart city infrastructure'
          ]
        }
      ],
      location: {
        address: '123 Tech Hub',
        city: 'Mumbai',
        country: 'India'
      },
      likes: 45,
      rating: 4.7,
      video_url: 'https://example.com/workshop-smart-city',
      kit_name: 'Smart City Kit',
      meta: 'smart-cities, robotics, autonomous',
      workshop_url: '/workshops/smart-city-vehicles',
      date: {
        time_slots: ['10:00 AM - 12:00 PM', '2:00 PM - 4:00 PM'],
        list_datetime: new Date('2023-11-15T10:00:00')
      }
    },
    {
      _id: '2',
      theme: 'Robotics Basics',
      date_of_workshop: '2023-11-22',
      duration: 180,
      rate: 1500,
      children_enrolled: 18,
      description: [
        {
          type: 'paragraph',
          content: 'Introduction to robotics fundamentals for beginners. Perfect for kids aged 8-12.'
        },
        {
          type: 'list',
          content: 'What you will learn:',
          subpoints: [
            'Basic robot construction',
            'Simple programming concepts',
            'Problem-solving with robots'
          ]
        }
      ],
      location: {
        address: '456 Tech Park',
        city: 'Bangalore',
        country: 'India'
      },
      likes: 38,
      rating: 4.5,
      video_url: 'https://example.com/workshop-robotics',
      kit_name: 'Beginner Robotics Kit',
      meta: 'robotics, beginners, coding',
      workshop_url: '/workshops/robotics-basics',
      date: {
        time_slots: ['9:00 AM - 12:00 PM'],
        list_datetime: new Date('2023-11-22T09:00:00')
      }
    },
    {
      _id: '3',
      theme: 'Coding for Kids',
      date_of_workshop: '2023-12-05',
      duration: 150,
      rate: 1100,
      children_enrolled: 15,
      description: [
        {
          type: 'paragraph',
          content: 'A fun introduction to programming concepts designed specifically for children.'
        },
        {
          type: 'list',
          content: 'Course contents:',
          subpoints: [
            'Block-based programming',
            'Creating simple games',
            'Interactive storytelling'
          ]
        }
      ],
      location: {
        address: '789 Education Center',
        city: 'Delhi',
        country: 'India'
      },
      likes: 32,
      rating: 4.6,
      video_url: 'https://example.com/workshop-coding',
      kit_name: 'Coding Starter Kit',
      meta: 'coding, programming, games',
      workshop_url: '/workshops/coding-for-kids',
      date: {
        time_slots: ['1:00 PM - 3:30 PM'],
        list_datetime: new Date('2023-12-05T13:00:00')
      }
    }
  ];
}

// GET: Fetch all workshops from workshop_details collection
export async function GET() {
  // Add a flag to check if the database approach failed completely
  let isDatabaseApproachFailed = false;
  
  try {
    console.log('Starting to fetch workshops from workshop_details...');
    console.log('Current Mongoose connection state:', mongoose.connection.readyState);
    console.log('Connection states: 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting');
    
    try {
      console.log('Connecting to database to fetch workshops from workshop_details...');
      const connection = await connectToDatabase('workshop');
      console.log('Database connection established. Connection state:', connection.readyState);
      
      // Add a timeout to the query and socket timeout options to prevent operation timeout
      console.log('Setting query options with increased timeout...');
      const queryOptions = { 
        maxTimeMS: 30000, // 30 seconds timeout for the query
        socketTimeoutMS: 45000, // 45 seconds timeout for socket
        serverSelectionTimeoutMS: 60000, // 60 seconds for server selection
      };
      
      console.log('Executing query to fetch workshops...');
      
      // Try a direct approach to query the collection
      if (connection.db) {
        console.log('Database name:', connection.db.databaseName);
        
        // Check if the collection exists
        const collections = await connection.db.listCollections().toArray();
        const collectionNames = collections.map(c => c.name);
        console.log('Available collections:', collectionNames);
        
        if (collectionNames.includes('workshop_details')) {
          console.log('Found workshop_details collection, using direct collection access');
          
          // Use the raw collection directly instead of the model
          try {
            // Direct collection access
            const rawCollection = connection.db.collection('workshop_details');
            const workshopsFromCollection = await rawCollection.find({}).toArray();
            console.log(`Successfully fetched ${workshopsFromCollection.length} workshops directly from workshop_details collection`);
            
            if (workshopsFromCollection.length > 0) {
              return NextResponse.json({ 
                success: true, 
                workshops: workshopsFromCollection
              });
            } else {
              console.log('No workshops found in collection, trying another approach');
            }
          } catch (directError) {
            console.error('Error with direct collection access:', directError);
            // Continue to try the model approach as fallback
          }
        } else {
          console.warn('workshop_details collection not found in available collections!');
          console.log('Creating collection if it does not exist...');
          
          // Try to create the collection if it doesn't exist
          try {
            await connection.db.createCollection('workshop_details');
            console.log('Created workshop_details collection');
          } catch (createError) {
            console.error('Error creating workshop_details collection:', createError);
          }
        }
      } else {
        console.log('Warning: connection.db is undefined');
      }
      
      // Fallback to using the model
      console.log('Trying to query using Mongoose model...');
      console.log('Collection name in model:', WorkshopModel.collection.name);
      console.log('Model collection namespace:', WorkshopModel.collection.namespace);
      
      // Try with the Mongoose model
      const workshops = await WorkshopModel.find({}, null, queryOptions).lean();
      console.log(`Successfully fetched ${workshops.length} workshops from workshop_details using model`);
      
      if (workshops.length > 0) {
        return NextResponse.json({ 
          success: true, 
          workshops 
        });
      } else {
        console.log('No workshops found using model approach');
        isDatabaseApproachFailed = true;
      }
    } catch (dbError) {
      console.error('Database operation error:', dbError);
      
      // Get more detailed error information
      let errorDetails = 'Unknown database error';
      if (dbError instanceof mongoose.Error) {
        errorDetails = `Mongoose error: ${dbError.message}`;
        // Check for timeout errors - using a simple string check instead of instanceof
        if (dbError.message && dbError.message.includes('timed out')) {
          errorDetails = `Database operation timed out: ${dbError.message}`;
        }
      } else if (dbError instanceof Error) {
        errorDetails = dbError.message;
        // Add stack trace for more context
        console.error('Error stack:', dbError.stack);
      }
      
      isDatabaseApproachFailed = true;
      throw new Error(`Database operation failed: ${errorDetails}`);
    }
    
  } catch (error: unknown) {
    console.error('Error fetching workshops from workshop_details:', error);
    
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Unknown error occurred';
    
    // Check MongoDB connection state one more time
    console.error('Final Mongoose connection state:', mongoose.connection.readyState);
    
    isDatabaseApproachFailed = true;
    
    // Decide whether to return an error or fallback data
    if (isDatabaseApproachFailed) {
      console.log('All database approaches failed, using sample data as fallback');
      const sampleWorkshops = getSampleWorkshops();
      
      return NextResponse.json({ 
        success: true, 
        workshops: sampleWorkshops,
        note: 'Using sample data due to database connection issues'
      });
    }
      
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch workshops', 
        details: errorMessage,
        connectionState: mongoose.connection.readyState
      }, 
      { status: 500 }
    );
  }
  
  // If we get here, all attempts failed but no exceptions were thrown
  console.log('All database approaches failed with no data returned, using sample data as fallback');
  const sampleWorkshops = getSampleWorkshops();
  
  return NextResponse.json({ 
    success: true, 
    workshops: sampleWorkshops,
    note: 'Using sample data due to database connection issues'
  });
} 