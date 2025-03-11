import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '@/middleware/authMiddleware';
import { connectToDatabase } from '@/lib/db';
import WelcomeCall from '@/models/WelcomeCall';
import mongoose from 'mongoose';

// Define interface for WelcomeCall document
interface WelcomeCallDoc {
  childId: string;
  status: string;
  updatedBy?: string;
  updatedAt?: Date;
  _id: mongoose.Types.ObjectId;
  __v: number;
}

// Updated interface to match the front-end
interface TrackerStatusItem {
  status: string;
  createdAt: string;      // When the status was first created
  lastUpdatedAt: string;  // When the status was last changed
}

// In-memory storage as fallback with cache management
const globalCache = {
  trackerStatus: {} as Record<string, TrackerStatusItem>,
  lastCleaned: Date.now(),
  maxSize: 1000, // Maximum number of entries
  lastUsed: Date.now() // Track when the cache was last accessed
};

// Add a timer to clean up unused cache
setInterval(() => {
  const SIX_HOURS = 21600000; // 6 hours in milliseconds
  // If cache hasn't been used in 6 hours, clear it to free memory
  if (Date.now() - globalCache.lastUsed > SIX_HOURS) {
    console.log('Clearing unused global cache to prevent memory leaks');
    globalCache.trackerStatus = {};
  }
}, 3600000); // Check every hour

// Helper function to clean up the cache
function cleanupCache() {
  const ONE_DAY_MS = 86400000; // 24 hours in milliseconds
  
  if (Object.keys(globalCache.trackerStatus).length > globalCache.maxSize ||
      Date.now() - globalCache.lastCleaned > ONE_DAY_MS) {
    
    // Keep only the most recent items
    const itemsToKeep = Object.entries(globalCache.trackerStatus)
      .sort((a, b) => {
        // Sort by lastUpdatedAt time (most recent first)
        const timeA = new Date(a[1].lastUpdatedAt).getTime();
        const timeB = new Date(b[1].lastUpdatedAt).getTime();
        return timeB - timeA;
      })
      .slice(0, Math.floor(globalCache.maxSize / 2))
      .reduce((obj, [key, value]) => ({ ...obj, [key]: value }), {});
    
    globalCache.trackerStatus = itemsToKeep;
    globalCache.lastCleaned = Date.now();
    
    console.log(`Cache cleaned: Reduced from ${Object.keys(globalCache.trackerStatus).length} to ${Object.keys(itemsToKeep).length} items`);
  }
}

// Ensure connections are closed properly
async function safeDbOperation<T>(operation: () => Promise<T>): Promise<T> {
  try {
    // Connect with timeout to prevent hanging connections
    await Promise.race([
      connectToDatabase('CRM'),
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Database connection timeout')), 10000);
      })
    ]);
    
    return await operation();
  } finally {
    // Always update the last used timestamp
    globalCache.lastUsed = Date.now();
    
    // No need to manually close - connectToDatabase handles connection pooling
  }
}

export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const authResponse = await authMiddleware(req, ['admin', 'staff']);
    if (!authResponse.authorized) {
      return NextResponse.json({ error: authResponse.error }, { status: authResponse.status || 401 });
    }

    const trackerStatus = await safeDbOperation(async () => {
      // Fetch welcome call statuses from the database - limit to most recent 2000 to prevent memory issues
      const welcomeCalls = await WelcomeCall.find({})
        .sort({ updatedAt: -1 })
        .limit(2000)
        .lean<WelcomeCallDoc[]>();
      
      // Convert to the expected format with timestamps
      const result: Record<string, TrackerStatusItem> = {};
      
      // Add type safety - ensure welcomeCalls is an array
      if (Array.isArray(welcomeCalls)) {
        welcomeCalls.forEach((call: WelcomeCallDoc) => {
          if (call && call.childId) {
            result[call.childId] = {
              status: call.status || 'pending',
              createdAt: call.updatedAt ? call.updatedAt.toISOString() : new Date().toISOString(),
              lastUpdatedAt: call.updatedAt ? call.updatedAt.toISOString() : new Date().toISOString()
            };
          }
        });
      }
      
      return result;
    });
    
    // Merge with any in-memory statuses as a fallback
    const mergedStatus = { ...globalCache.trackerStatus, ...trackerStatus };
    
    // Update in-memory cache with the merged data
    globalCache.trackerStatus = mergedStatus;
    
    return NextResponse.json({ 
      trackerStatus: mergedStatus,
      message: 'Tracker status fetched successfully' 
    });
  } catch (error) {
    console.error('Error fetching tracker status:', error);
    // Fallback to in-memory if database fails
    return NextResponse.json({ 
      trackerStatus: globalCache.trackerStatus,
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
    globalCache.trackerStatus = { ...globalCache.trackerStatus, ...trackerStatus };
    globalCache.lastUsed = Date.now();
    
    // Clean up the cache if necessary
    cleanupCache();
    
    // Update database safely
    await safeDbOperation(async () => {
      // Get user information for the updatedBy field
      const userId = authResponse.user?.userId || 'unknown';
      
      // Batch updates in chunks to prevent memory issues
      const entries = Object.entries(trackerStatus);
      const BATCH_SIZE = 50;
      
      // Process in batches
      for (let i = 0; i < entries.length; i += BATCH_SIZE) {
        const batch = entries.slice(i, i + BATCH_SIZE);
        
        // Process each batch in parallel
        await Promise.all(batch.map(async ([childId, statusData]) => {
          // Handle both new format (object with status and timestamps) and old format (string)
          const status = typeof statusData === 'string' 
            ? statusData 
            : (statusData as TrackerStatusItem).status;
            
          const timestamp = typeof statusData === 'string' 
            ? undefined 
            : (statusData as TrackerStatusItem).createdAt;
          
          // Check if there's an existing record
          const existingRecord = await WelcomeCall.findOne({ childId }).lean<WelcomeCallDoc>();
          
          // If the record exists and status is already "done", don't update it
          if (existingRecord && existingRecord.status === 'done') {
            return; // Skip update for done statuses
          }
    
          // For new records or changing status to "done", save the current timestamp
          const updateData: { 
            status: string;
            updatedBy: string;
            updatedAt?: Date;
          } = { 
            status,
            updatedBy: userId
          };
          
          // Only set updatedAt if it's not already set (for first time saving)
          if (!existingRecord || existingRecord.status !== 'done') {
            updateData.updatedAt = timestamp ? new Date(timestamp) : new Date();
          }
          
          // Use findOneAndUpdate with upsert to create if doesn't exist
          await WelcomeCall.findOneAndUpdate(
            { childId },
            updateData,
            { upsert: true, new: true }
          );
        }));
      }
    });
    
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

