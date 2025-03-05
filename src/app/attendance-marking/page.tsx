'use client';

import React, { useState, useEffect } from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PageHeader from '@/components/ui/PageHeader';

export default function AttendanceMarkingPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    // Fetch attendance data
    const fetchAttendanceData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // In a real application, this would fetch from your API
        // const response = await fetch('/api/attendance');
        // const data = await response.json();
        // setAttendanceData(data);
        
        // For now, simulate API call with a delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        // Removed setAttendanceData call since it's not used
      } catch (error) {
        console.error('Error fetching attendance data:', error);
        setError('Failed to fetch attendance data');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAttendanceData();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader pageName="Attendance Marking" />
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Child Attendance Management</h1>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between mb-6">
            <div className="flex space-x-2">
              <Select defaultValue="upcoming">
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Workshop Time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="upcoming">Upcoming</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="past">Past</SelectItem>
                </SelectContent>
              </Select>
              <Select>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select Workshop" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="workshop1">Smart City Vehicles</SelectItem>
                  <SelectItem value="workshop2">Robotics Basics</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <Input 
                placeholder="Search by child name" 
                className="w-[250px]" 
              />
              <Button>Search</Button>
            </div>
          </div>
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded mb-4">
              {error}
            </div>
          )}
          
          {isLoading ? (
            <div className="text-center py-8">Loading attendance data...</div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Child Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Age</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Parent Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Workshop</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Attendance</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Comments</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap">Arjun Gupta</td>
                  <td className="px-6 py-4 whitespace-nowrap">9</td>
                  <td className="px-6 py-4 whitespace-nowrap">+91 77889 90012</td>
                  <td className="px-6 py-4 whitespace-nowrap">Smart City Vehicles</td>
                  <td className="px-6 py-4 whitespace-nowrap">15 Jun 2023, 10:00 AM</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select className="rounded border-gray-300 text-sm">
                      <option value="">Select</option>
                      <option value="present">Present</option>
                      <option value="absent">Absent</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Input placeholder="Add comment" sizeVariant="sm" className="w-40" />
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap">Ishita Verma</td>
                  <td className="px-6 py-4 whitespace-nowrap">11</td>
                  <td className="px-6 py-4 whitespace-nowrap">+91 99001 23456</td>
                  <td className="px-6 py-4 whitespace-nowrap">Smart City Vehicles</td>
                  <td className="px-6 py-4 whitespace-nowrap">15 Jun 2023, 10:00 AM</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge className="bg-green-100 text-green-800">Present</Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-600">Very enthusiastic participant</span>
                  </td>
                </tr>
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
} 