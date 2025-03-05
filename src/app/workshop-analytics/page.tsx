'use client';

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PageHeader from '@/components/ui/PageHeader';

export default function WorkshopAnalyticsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    // Fetch analytics data
    const fetchAnalyticsData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // In a real application, this would fetch from your API
        // const response = await fetch('/api/analytics');
        // const data = await response.json();
        // setAnalyticsData(data);
        
        // For now, simulate API call with a delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        // Removed setAnalyticsData call since it's not used
      } catch (error) {
        console.error('Error fetching analytics data:', error);
        setError('Failed to fetch analytics data');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAnalyticsData();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader pageName="Workshop Analytics" />
      <div className="p-6">
        <div className="grid grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Workshops</CardDescription>
              <CardTitle className="text-2xl">24</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Enrolled Children</CardDescription>
              <CardTitle className="text-2xl">156</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Attendance Rate</CardDescription>
              <CardTitle className="text-2xl">87%</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Online Payments</CardDescription>
              <CardTitle className="text-2xl">68%</CardTitle>
            </CardHeader>
          </Card>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between mb-6">
            <div className="flex space-x-2">
              <Select defaultValue="all">
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Time Period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="this-month">This Month</SelectItem>
                  <SelectItem value="last-month">Last Month</SelectItem>
                  <SelectItem value="this-year">This Year</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline">Export Report</Button>
            </div>
          </div>
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded mb-4">
              {error}
            </div>
          )}
          
          {isLoading ? (
            <div className="text-center py-8">Loading analytics data...</div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Workshop Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Enrolled</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Attendance</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Online Payments</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Center Payments</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap">Smart City Vehicles</td>
                  <td className="px-6 py-4 whitespace-nowrap">15 Jun 2023</td>
                  <td className="px-6 py-4 whitespace-nowrap">24</td>
                  <td className="px-6 py-4 whitespace-nowrap">22 (92%)</td>
                  <td className="px-6 py-4 whitespace-nowrap">18</td>
                  <td className="px-6 py-4 whitespace-nowrap">6</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Button variant="ghost" size="sm">View Details</Button>
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap">Robotics Basics</td>
                  <td className="px-6 py-4 whitespace-nowrap">12 Jun 2023</td>
                  <td className="px-6 py-4 whitespace-nowrap">18</td>
                  <td className="px-6 py-4 whitespace-nowrap">15 (83%)</td>
                  <td className="px-6 py-4 whitespace-nowrap">12</td>
                  <td className="px-6 py-4 whitespace-nowrap">6</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Button variant="ghost" size="sm">View Details</Button>
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