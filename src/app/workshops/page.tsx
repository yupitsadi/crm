'use client';

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon, PencilIcon, TrashIcon, PlusIcon, ExclamationCircleIcon } from "@heroicons/react/24/outline";
import PageHeader from '@/components/ui/PageHeader';

interface DescriptionItem {
  type: "paragraph" | "list";
  content: string;
  subpoints?: string[];
}

interface Workshop {
  _id: string;
  theme: string;
  date_of_workshop: string;
  duration: number;
  rate: number;
  children_enrolled: number;
  description: DescriptionItem[];
  location: {
    address: string;
    city: string;
    country: string;
  };
  likes: number;
  rating: number;
  video_url?: string;
  kit_name?: string;
  meta?: string;
  workshop_url?: string;
  date?: {
    time_slots: string[];
    list_datetime: Date;
  };
}

// Add sample workshops data for fallback
const sampleWorkshops: Workshop[] = [
  {
    _id: "1",
    theme: "Robotics Basics",
    date_of_workshop: "2023-06-15",
    duration: 120,
    rate: 1500,
    children_enrolled: 18,
    description: [
      {
        type: "paragraph",
        content: "Introduction to basic robotics and programming concepts",
        subpoints: ["Learn about sensors and motors", "Basic programming logic"]
      }
    ],
    location: {
      address: "123 Tech Park",
      city: "Mumbai",
      country: "India"
    },
    likes: 24,
    rating: 4.5
  },
  {
    _id: "2",
    theme: "Smart City Vehicles",
    date_of_workshop: "2023-06-20",
    duration: 150,
    rate: 1200,
    children_enrolled: 24,
    description: [
      {
        type: "paragraph",
        content: "Build and program smart vehicles for a city environment",
        subpoints: ["Traffic management systems", "Automated transportation"]
      }
    ],
    location: {
      address: "456 Innovation Center",
      city: "Delhi",
      country: "India"
    },
    likes: 32,
    rating: 4.7
  }
];

export default function WorkshopsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTheme, setFilterTheme] = useState('all');
  const [usingSampleData, setUsingSampleData] = useState(false);
  
  // Define fetchWorkshops function outside of useEffect to use in Try Again button
  const fetchWorkshops = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Get token for authentication
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Authentication token not found. Please log in again.');
      }
      
      // Fix: Use correct API endpoint (singular 'workshop' not plural 'workshops')
      // And add authentication token to the request headers
      const response = await fetch('/api/workshop', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication failed. Please log in again.');
        }
        throw new Error(`Failed to fetch workshops (${response.status})`);
      }
      
      const data = await response.json();
      
      // Check if the response has the expected structure
      if (data.success && Array.isArray(data.workshops)) {
        setWorkshops(data.workshops);
        // Check if we're using fallback data
        setUsingSampleData(data.isUsingFallbackData || false);
      } else {
        console.error('API returned unexpected data structure:', data);
        throw new Error('Invalid data format received from API');
      }
    } catch (error) {
      console.error('Error fetching workshops:', error);
      setError('Failed to fetch workshops. Using sample data instead.');
      setWorkshops(sampleWorkshops);
      setUsingSampleData(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch workshops on component mount
  useEffect(() => {
    fetchWorkshops();
  }, []);
  
  // Filter and search workshops
  const filteredWorkshops = Array.isArray(workshops) 
    ? workshops.filter(workshop => {
        const matchesSearch = workshop.theme.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           workshop.location.city.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesTheme = filterTheme === 'all' || workshop.theme.includes(filterTheme);
        
        return matchesSearch && matchesTheme;
      })
    : [];
  
  // Handler for adding a new workshop
  const handleAddWorkshop = () => {
    // In a real application, this would navigate to a form or open a modal
    console.log('Add new workshop');
  };
  
  // Format date string to a more readable format
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return new Date(dateString).toLocaleDateString('en-IN', options);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader pageName="Workshops" />
      <div className="p-6">
        <div className="flex justify-between mb-6">
          <Button 
            onClick={handleAddWorkshop}
            className="flex items-center space-x-1"
          >
            <PlusIcon className="h-5 w-5" />
            <span>Add Workshop</span>
          </Button>
        </div>
        
        {usingSampleData && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded mb-4 flex items-center">
            <ExclamationCircleIcon className="h-5 w-5 mr-2" />
            <span>
              <strong>Note:</strong> Using sample data due to database connection issues. 
              <Button 
                variant="link" 
                className="p-0 h-auto text-yellow-800 underline ml-1"
                onClick={fetchWorkshops}
              >
                Try again
              </Button>
            </span>
          </div>
        )}
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between mb-6">
            <div className="flex space-x-2">
              <Select 
                defaultValue="all" 
                onValueChange={(value) => setFilterTheme(value)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by Theme" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Themes</SelectItem>
                  <SelectItem value="Robot">Robotics</SelectItem>
                  <SelectItem value="City">City Building</SelectItem>
                  <SelectItem value="Coding">Coding</SelectItem>
                </SelectContent>
              </Select>
              <Select defaultValue="upcoming">
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by Time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="upcoming">Upcoming</SelectItem>
                  <SelectItem value="past">Past</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <Input 
                placeholder="Search by theme or location" 
                className="w-[250px]" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Button variant="outline">Search</Button>
            </div>
          </div>
          
          {isLoading ? (
            <div className="text-center py-8">Loading workshops...</div>
          ) : error ? (
            <div className="text-center py-8">
              <div className="text-red-500 mb-4">{error}</div>
              <Button 
                onClick={fetchWorkshops}
              >
                Retry
              </Button>
            </div>
          ) : filteredWorkshops.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No workshops found matching your criteria
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredWorkshops.map((workshop) => (
                <div key={workshop._id} className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                  <div className="p-4 border-b bg-gray-50">
                    <h3 className="text-lg font-medium text-gray-900">{workshop.theme}</h3>
                    <div className="flex items-center mt-1 text-sm text-gray-500">
                      <CalendarIcon className="h-4 w-4 mr-1" />
                      {formatDate(workshop.date_of_workshop)}
                    </div>
                  </div>
                  
                  <div className="p-4">
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <div>
                        <p className="text-xs text-gray-500">Duration</p>
                        <p className="font-medium">{workshop.duration} mins</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Price</p>
                        <p className="font-medium">₹{workshop.rate}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Enrolled</p>
                        <p className="font-medium">{workshop.children_enrolled}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Rating</p>
                        <p className="font-medium">{workshop.rating}/5 ({workshop.likes} likes)</p>
                      </div>
                    </div>
                    
                    {workshop.description && workshop.description.length > 0 && (
                      <div className="mb-3">
                        <p className="text-xs text-gray-500 mb-1">Description</p>
                        {workshop.description.slice(0, 1).map((desc, index) => (
                          <div key={index}>
                            {desc.type === 'paragraph' ? (
                              <p className="text-sm">{desc.content}</p>
                            ) : (
                              <div>
                                <p className="text-sm">{desc.content}</p>
                                {desc.subpoints && desc.subpoints.length > 0 && (
                                  <ul className="text-sm list-disc list-inside ml-2">
                                    {desc.subpoints.slice(0, 2).map((point, i) => (
                                      <li key={i}>{point}</li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <div className="mb-3">
                      <p className="text-xs text-gray-500">Location</p>
                      <p className="text-sm">{workshop.location.city}, {workshop.location.country}</p>
                    </div>
                    
                    <div className="mt-4 flex justify-between">
                      <Button size="sm">View Details</Button>
                      <div className="flex space-x-1">
                        <Button size="sm" variant="outline">
                          <PencilIcon className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 