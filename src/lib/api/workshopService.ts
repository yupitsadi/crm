import { Workshop } from '@/types/workshop';

// Define a proper API response type without unused generic parameter
export interface ApiResponse {
  success: boolean;
  error?: string;
  details?: string;
  workshops?: Workshop[];
  workshopId?: string;
  [key: string]: unknown;
}

// Function to fetch all workshops
export async function fetchWorkshops(): Promise<Workshop[]> {
  try {
    // Get token if available
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    // Add authorization if token exists
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    console.log('Fetching workshops from API...');
    
    const response = await fetch('/api/workshop', { 
      method: 'GET',
      headers,
      // Add a timeout to the fetch request
      signal: AbortSignal.timeout(15000) // 15 second timeout
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.details || errorData.error || `API error: ${response.status}`);
    }
    
    const data = await response.json() as ApiResponse;
    
    if (!data.success) {
      throw new Error(data.details || data.error || 'Failed to fetch workshops');
    }
    
    // Check if we're using fallback data
    if (data.isUsingFallbackData) {
      console.log('Using fallback sample workshop data');
    }
    
    // Return workshops or empty array if undefined
    return data.workshops || [];
  } catch (error) {
    console.error('Error fetching workshops:', error);
    
    // Provide a more specific error message based on the error type
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Network error: Unable to connect to the server');
    } else if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('Request timed out: Server took too long to respond');
    }
    
    throw error;
  }
}

// Function to add a new workshop
export async function addWorkshop(workshopData: Omit<Workshop, '_id'>): Promise<{success: boolean, workshopId?: string}> {
  try {
    // Get token if available
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    // Add authorization if token exists
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch('/api/workshop', { 
      method: 'POST',
      headers,
      body: JSON.stringify(workshopData)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.details || errorData.error || 'Failed to add workshop');
    }
    
    const data = await response.json() as ApiResponse;
    
    if (!data.success) {
      throw new Error(data.details || data.error || 'Failed to add workshop');
    }
    
    return {
      success: true,
      workshopId: data.workshopId
    };
  } catch (error) {
    console.error('Error adding workshop:', error);
    throw error;
  }
} 