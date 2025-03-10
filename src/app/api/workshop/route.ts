import { NextRequest, NextResponse } from 'next/server';
import { workshop as WorkshopModel } from '@/models/workshop';
import { connectToDatabase } from '@/lib/db';
import mongoose from 'mongoose';
// import { authMiddleware } from '@/lib/auth';

// Define a type for the workshop document
interface WorkshopDocument {
  _id: mongoose.Types.ObjectId | string | { $oid: string };
  theme: string;
  date_of_workshop: string;
  duration: number;
  rate: number;
  video_url: string;
  description: Array<{
    type: string;
    content: string;
    subpoints?: string[];
  }>;
  location: {
    address: string;
    city: string;
    country: string;
  };
  likes: number;
  rating: number;
  children_enrolled: number;
  kit_name: string;
  meta: string;
  workshop_url: string;
  date?: {
    time_slots: string[];
    list_datetime: Date | string;
  };
  [key: string]: unknown; // For any additional fields
}

// Sample workshop data fallback - same as workshop_details
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

// GET: Fetch all workshops
export async function GET(req: NextRequest) {
  // Use a boolean to track successful database operation
  let usingFallbackData = false;
  
  try {
    console.log('Starting to fetch workshops...');
    
    // Check if we're requesting a single workshop by ID
    const { searchParams } = new URL(req.url);
    const workshopId = searchParams.get('id');
    
    try {
      console.log('Connecting to database to fetch workshops...');
      const connection = await connectToDatabase('workshop');
      
      if (!connection) {
        console.error('Failed to establish database connection');
        throw new Error('Database connection failed');
      }
      
      console.log('Database connection established.');
      
      // Define query options with increased timeout
      const queryOptions = { 
        maxTimeMS: 30000, // 30 seconds timeout
      };
      
      console.log('Executing query to fetch workshops...');
      
      // If workshopId is provided, fetch just that workshop
      if (workshopId) {
        console.log(`Fetching single workshop with ID: ${workshopId}`);
        try {
          // Try to use the raw collection first
          if (connection.db) {
            try {
              console.log('Attempting to fetch from raw collection...');
              const rawCollection = connection.db.collection('workshop_details');
              const workshop = await rawCollection.findOne({ _id: new mongoose.Types.ObjectId(workshopId) });
              
              if (workshop) {
                console.log('Found workshop by ID using raw collection');
                return NextResponse.json({ 
                  success: true, 
                  workshop
                });
              }
            } catch (rawError) {
              console.error('Error with raw collection access:', rawError);
              // Continue to model approach
            }
          }
          
          // Fall back to model
          console.log('Falling back to Mongoose model with explicit collection...');
          const workshop = await WorkshopModel.findById(workshopId, null, queryOptions);
          
          if (workshop) {
            console.log('Found workshop by ID');
            return NextResponse.json({ 
              success: true, 
              workshop
            });
          } else {
            console.log(`Workshop with ID ${workshopId} not found`);
            // Try to find the workshop in sample data
            const sampleWorkshops = getSampleWorkshops();
            const sampleWorkshop = sampleWorkshops.find(w => {
              // Handle different MongoDB ID formats
              let wId: string;
              if (typeof w._id === 'string') {
                wId = w._id;
              } else if (w._id && typeof w._id === 'object') {
                // Handle MongoDB extended JSON format with $oid field
                const idObj = w._id as Record<string, unknown>;
                if (idObj.$oid) {
                  wId = String(idObj.$oid);
                } else {
                  wId = String(w._id);
                }
              } else {
                wId = String(w._id);
              }
              return wId === workshopId;
            });
            
            if (sampleWorkshop) {
              return NextResponse.json({ 
                success: true, 
                workshop: sampleWorkshop,
                isUsingFallbackData: true
              });
            }
            
            return NextResponse.json({ 
              success: false, 
              error: 'Workshop not found'
            }, { status: 404 });
          }
        } catch (error) {
          console.error(`Error fetching workshop by ID ${workshopId}:`, error);
          throw error;
        }
      }
      
      // If no specific ID, fetch all workshops as before
      console.log('Fetching all workshops...');
      let workshops: WorkshopDocument[] = [];
      
      // Try to use the raw collection first
      if (connection.db) {
        try {
          console.log('Attempting to fetch all workshops from raw collection...');
          const rawCollection = connection.db.collection('workshop_details');
          workshops = await rawCollection.find({}).toArray() as WorkshopDocument[];
          
          if (workshops && workshops.length > 0) {
            console.log(`Found ${workshops.length} workshops using raw collection`);
          } else {
            console.log('No workshops found using raw collection');
          }
        } catch (rawError) {
          console.error('Error with raw collection access:', rawError);
          // Continue to model approach
          workshops = [];
        }
      }
      
      // If raw collection failed, try with model
      if (!workshops || workshops.length === 0) {
        console.log('Falling back to Mongoose model...');
        workshops = await WorkshopModel.find({}, null, queryOptions);
        console.log(`Found ${workshops?.length || 0} workshops using model`);
      }
      
      if (workshops && workshops.length > 0) {
        return NextResponse.json({ 
          success: true, 
          workshops 
        });
      } else {
        console.log('No workshops found in database');
        usingFallbackData = true; // Set flag to indicate we're using fallback data
      }
    } catch (dbError) {
      console.error('Database operation error:', dbError);
      usingFallbackData = true; // Set flag to indicate we're using fallback data
    }
    
    // If we get here, either no workshops were found or an error occurred
    // Return sample data as fallback
    console.log('Using sample data as fallback');
    const sampleWorkshops = getSampleWorkshops();
    usingFallbackData = true; // Set flag to indicate we're using fallback data
    
    return NextResponse.json({ 
      success: true, 
      workshops: sampleWorkshops,
      isUsingFallbackData: usingFallbackData,
    });
    
  } catch (error: unknown) {
    console.error('Error fetching workshops:', error);
    
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Unknown error occurred';
    
    // Return sample data instead of an error
    const sampleWorkshops = getSampleWorkshops();
    usingFallbackData = true; // Set flag to indicate we're using fallback data
    
    return NextResponse.json({ 
      success: true, 
      workshops: sampleWorkshops,
      isUsingFallbackData: usingFallbackData,
      error: errorMessage
    });
  }
}

// POST: Add a new workshop
export async function POST(req: NextRequest) {
  try {
    // Optional: Apply authentication (recommended for production)
    // const authResult = await authMiddleware(req, ['admin']);
    // if (!authResult.success) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }
    
    // Parse request body
    const workshopData = await req.json();
    console.log('Received workshop data:', JSON.stringify(workshopData, null, 2));
    
    // Connect to the workshop database
    console.log('Connecting to database to add new workshop...');
    const connection = await connectToDatabase('workshop');
    console.log('Database connection established. Connection state:', connection.readyState);
    
    // If we have direct DB access, verify collection exists
    if (connection.db) {
      const collections = await connection.db.listCollections().toArray();
      const collectionNames = collections.map(c => c.name);
      
      if (!collectionNames.includes('workshop_details')) {
        console.log('Creating workshop_details collection before adding new document');
        try {
          await connection.db.createCollection('workshop_details');
          console.log('Created workshop_details collection');
        } catch (createError) {
          console.error('Error creating workshop_details collection:', createError);
        }
      }
    }
    
    // Create new workshop document with timeout options
    // Note: Save options don't accept the same timeout options as queries
    // We should only use valid SaveOptions properties
    const options = {
      timestamps: true
    };
    
    const newWorkshop = new WorkshopModel(workshopData);
    await newWorkshop.save(options);
    
    console.log(`Successfully added new workshop with ID: ${newWorkshop._id}`);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Workshop added successfully',
      workshopId: newWorkshop._id
    }, { status: 201 });
    
  } catch (error: unknown) {
    console.error('Error adding workshop:', error);
    
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Unknown error occurred';
      
    return NextResponse.json(
      { success: false, error: 'Failed to add workshop', details: errorMessage }, 
      { status: 500 }
    );
  }
}