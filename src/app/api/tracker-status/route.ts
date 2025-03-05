import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '@/middleware/authMiddleware';
import { connectToDatabase } from '@/lib/db';
import WelcomeCall from '@/models/WelcomeCall';

// Updated interface to include timestamp
interface TrackerStatusItem {
  status: string;
  timestamp?: string;
}

// In-memory storage as fallback
let globalTrackerStatus: Record<string, TrackerStatusItem> = {};

export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const authResponse = await authMiddleware(req, ['admin', 'staff']);
    if (!authResponse.authorized) {
      return NextResponse.json({ error: authResponse.error }, { status: authResponse.status || 401 });
    }

    // Connect to the database
    await connectToDatabase('CRM');
    
    // Fetch welcome call statuses from the database
    const welcomeCalls = await WelcomeCall.find({});
    
    // Convert to the expected format with timestamps
    const trackerStatus: Record<string, TrackerStatusItem> = {};
    welcomeCalls.forEach(call => {
      trackerStatus[call.childId] = {
        status: call.status,
        timestamp: call.updatedAt ? call.updatedAt.toISOString() : undefined
      };
    });
    
    // Merge with any in-memory statuses as a fallback
    const mergedStatus = { ...globalTrackerStatus, ...trackerStatus };
    
    return NextResponse.json({ 
      trackerStatus: mergedStatus,
      message: 'Tracker status fetched successfully' 
    });
  } catch (error) {
    console.error('Error fetching tracker status:', error);
    // Fallback to in-memory if database fails
    return NextResponse.json({ 
      trackerStatus: globalTrackerStatus,
      message: 'Fetched tracker status from fallback storage',
      warning: 'Database connection failed'
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const authResponse = await authMiddleware(req, ['admin', 'staff']);
    if (!authResponse.authorized) {
      return NextResponse.json({ error: authResponse.error }, { status: authResponse.status || 401 });
    }
    
    // Parse request body
    const { trackerStatus } = await req.json();
    
    if (!trackerStatus || typeof trackerStatus !== 'object') {
      return NextResponse.json(
        { error: 'Invalid tracker status data' },
        { status: 400 }
      );
    }
    
    // Store in memory as fallback
    globalTrackerStatus = trackerStatus;
    
    // Connect to the database
    await connectToDatabase('CRM');
    
    // Get user information for the updatedBy field
    const userId = authResponse.user?.userId || 'unknown';
    
    // Update database records - handle new structure with timestamps
    const updatePromises = Object.entries(trackerStatus).map(async ([childId, statusData]) => {
      // Handle both new format (object with status and timestamp) and old format (string)
      const status = typeof statusData === 'string' 
        ? statusData 
        : (statusData as TrackerStatusItem).status;
        
      const timestamp = typeof statusData === 'string' 
        ? undefined 
        : (statusData as TrackerStatusItem).timestamp;
      
      // Use findOneAndUpdate with upsert to create if doesn't exist
      await WelcomeCall.findOneAndUpdate(
        { childId },
        { 
          status, 
          updatedBy: userId,
          updatedAt: timestamp ? new Date(timestamp) : new Date()
        },
        { upsert: true, new: true }
      );
    });
    
    await Promise.all(updatePromises);
    
    return NextResponse.json({ 
      message: 'Welcome call status updated successfully in the database' 
    });
  } catch (error) {
    console.error('Error saving tracker status:', error);
    return NextResponse.json(
      { success: true, warning: 'Saved to fallback storage only, database update failed' }
    );
  }
} 