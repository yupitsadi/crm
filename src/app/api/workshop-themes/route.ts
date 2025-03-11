import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { authMiddleware } from '@/middleware/authMiddleware';
import { ObjectId } from 'mongodb';

// Cache for workshop themes to reduce database queries
const workshopThemesCache: Record<string, { theme: string, timestamp: number }> = {};
const CACHE_TTL = 3600000; // 1 hour cache

export async function GET(req: NextRequest) {
  try {
    // Verify authentication
    const authResponse = await authMiddleware(req, ['admin', 'staff']);
    if (!authResponse.authorized) {
      return NextResponse.json({ error: authResponse.error }, { status: authResponse.status || 401 });
    }

    // Get workshop IDs from query params
    const url = new URL(req.url);
    const ids = url.searchParams.get('ids');
    
    if (!ids) {
      return NextResponse.json(
        { error: 'Workshop IDs are required' },
        { status: 400 }
      );
    }
    
    // Parse the IDs
    const workshopIds = ids.split(',');
    
    // Check which IDs we need to fetch (not in cache or cache expired)
    const now = Date.now();
    const idsToFetch = workshopIds.filter(id => {
      const cached = workshopThemesCache[id];
      return !cached || (now - cached.timestamp > CACHE_TTL);
    });
    
    // Prepare result object, starting with cached values
    const themes: Record<string, string> = {};
    
    // Add cached themes that are still valid
    workshopIds.forEach(id => {
      const cached = workshopThemesCache[id];
      if (cached && (now - cached.timestamp <= CACHE_TTL)) {
        themes[id] = cached.theme;
      }
    });
    
    // If we need to fetch from database
    if (idsToFetch.length > 0) {
      // Connect to the database
      const db = await connectToDatabase('workshop');
      const collection = db.collection('workshop_details');
      
      try {
        // Convert string IDs to ObjectIds for MongoDB
        const objectIds = idsToFetch.map(id => {
          try {
            return new ObjectId(id);
          } catch {
            console.error(`Invalid ObjectId: ${id}`);
            return null;
          }
        }).filter(id => id !== null);
        
        // Fetch all needed workshops in one query
        const workshops = await collection
          .find({ _id: { $in: objectIds } })
          .project({ theme: 1 })
          .toArray();
        
        // Update the themes object and cache
        workshops.forEach(workshop => {
          const id = workshop._id.toString();
          const theme = workshop.theme || 'Unknown Theme';
          
          themes[id] = theme;
          workshopThemesCache[id] = { theme, timestamp: now };
        });
      } catch (err) {
        console.error('Error querying MongoDB:', err);
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      themes, 
      cached: workshopIds.length - idsToFetch.length,
      fetched: idsToFetch.length
    });
  } catch (error) {
    console.error('Error fetching workshop themes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workshop themes' },
      { status: 500 }
    );
  }
} 