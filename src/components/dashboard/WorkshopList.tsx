'use client';

import { useState, useEffect } from 'react';
import { ExclamationCircleIcon } from '@heroicons/react/24/outline';

interface Workshop {
  _id: string;
  theme: string;
  date_of_workshop: string;
  duration: number;
  rate: number;
  children_enrolled: number;
  likes: number;
  rating: number;
  description?: Array<{
    type: string;
    content: string;
    subpoints?: string[];
  }>;
  location?: {
    city: string;
    country: string;
  };
}

export default function WorkshopList() {
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usingSampleData, setUsingSampleData] = useState(false);

  useEffect(() => {
    const fetchWorkshops = async () => {
      try {
        setLoading(true);
        setError(null);
        setUsingSampleData(false);
        
        const token = localStorage.getItem('token');
        if (!token) {
          setError('Authentication token not found');
          setLoading(false);
          return;
        }

        const response = await fetch('/api/workshop', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        const data = await response.json();
        
        if (response.ok) {
          if (data.workshops && Array.isArray(data.workshops)) {
            setWorkshops(data.workshops);
            
            // Check if using sample data
            if (data.note && data.note.includes('sample data')) {
              console.log('Using sample workshop data');
              setUsingSampleData(true);
            }
          } else {
            setError('Invalid data format received from API');
          }
        } else {
          console.error('Failed to fetch workshops:', data.error);
          setError(`Failed to fetch workshops: ${data.error || 'Unknown error'}`);
        }
      } catch (error) {
        console.error('Error fetching workshops:', error);
        setError('Network error while fetching workshops. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchWorkshops();
  }, []);

  if (loading) {
    return <div className="p-4 text-center">Loading workshops...</div>;
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
        <p className="font-medium">Error loading workshops</p>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:px-6">
        <h3 className="text-lg font-medium text-gray-900">Upcoming Workshops</h3>
        
        {usingSampleData && (
          <div className="mt-2 text-xs bg-yellow-50 border border-yellow-200 text-yellow-700 px-3 py-2 rounded-md flex items-center">
            <ExclamationCircleIcon className="h-4 w-4 mr-1" />
            <span>Using sample data due to database connection issues</span>
          </div>
        )}
      </div>
      
      <div className="border-t border-gray-200">
        {workshops.length === 0 ? (
          <div className="px-4 py-5 text-center text-gray-500">
            No workshops found
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {workshops.map((workshop) => (
              <li key={workshop._id} className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">
                      {workshop.theme}
                    </h4>
                    <p className="text-sm text-gray-500">
                      {formatDate(workshop.date_of_workshop)}
                    </p>
                    <p className="text-xs text-gray-400">
                      {workshop.duration} hours | ₹{workshop.rate}
                    </p>
                    {workshop.location && (
                      <p className="text-xs text-gray-400">
                        {workshop.location.city}, {workshop.location.country}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-600">
                      {workshop.children_enrolled} enrolled
                    </span>
                    <div className="flex items-center">
                      <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                        {workshop.rating}★
                      </span>
                      <span className="ml-2 text-xs bg-pink-100 text-pink-800 px-2 py-1 rounded-full">
                        {workshop.likes} ❤️
                      </span>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
} 