'use client';

import React, { useState, useEffect } from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PageHeader from '@/components/ui/PageHeader';

export default function PaymentTrackingPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    // Fetch payment data
    const fetchPaymentData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // In a real application, this would fetch from your API
        // const response = await fetch('/api/payments');
        // const data = await response.json();
        // setPaymentData(data);
        
        // For now, simulate API call with a delay
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error('Error fetching payment data:', error);
        setError('Failed to fetch payment data');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPaymentData();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader pageName="Payment Tracking" />
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Workshop Payment Tracking</h1>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between mb-6">
            <div className="flex space-x-2">
              <Select defaultValue="all">
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Payment Method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Methods</SelectItem>
                  <SelectItem value="online">Online</SelectItem>
                  <SelectItem value="center">Pay at Center</SelectItem>
                </SelectContent>
              </Select>
              <Select defaultValue="all">
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Payment Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <Input 
                placeholder="Search by name or workshop" 
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
            <div className="text-center py-8">Loading payment data...</div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Parent Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Child Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Workshop</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Method</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap">Manish Patel</td>
                  <td className="px-6 py-4 whitespace-nowrap">Rohan Patel</td>
                  <td className="px-6 py-4 whitespace-nowrap">Smart City Vehicles</td>
                  <td className="px-6 py-4 whitespace-nowrap">₹1,200</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge className="bg-blue-100 text-blue-800">Online</Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge className="bg-green-100 text-green-800">Paid</Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Button variant="ghost" size="sm">View Receipt</Button>
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap">Anika Sharma</td>
                  <td className="px-6 py-4 whitespace-nowrap">Aarav Sharma</td>
                  <td className="px-6 py-4 whitespace-nowrap">Robotics Basics</td>
                  <td className="px-6 py-4 whitespace-nowrap">₹1,500</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge className="bg-purple-100 text-purple-800">Pay at Center</Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Button variant="outline" size="sm">Mark as Paid</Button>
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