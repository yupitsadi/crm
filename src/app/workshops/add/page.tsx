'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import PageHeader from '@/components/ui/PageHeader';

export default function AddWorkshopPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    theme: '',
    date_of_workshop: '',
    duration: '',
    rate: '',
    description: '',
    address: '',
    city: '',
    country: 'India',
  });
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      
      // Prepare data for API
      const workshopData = {
        theme: formData.theme,
        date_of_workshop: formData.date_of_workshop,
        duration: parseInt(formData.duration),
        rate: parseInt(formData.rate),
        description: formData.description.split('\n'),
        location: {
          address: formData.address,
          city: formData.city,
          country: formData.country,
        },
        children_enrolled: 0,
        likes: 0,
        rating: 0,
      };
      
      // Get token for authentication
      const token = localStorage.getItem('token');
      
      // Send data to API
      const response = await fetch('/api/workshop', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(workshopData),
      });
      
      if (response.ok) {
        // Navigate back to workshops list on success
        router.push('/workshops');
      } else {
        const error = await response.json();
        alert(`Failed to create workshop: ${error.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error creating workshop:', error);
      alert('Failed to create workshop. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader pageName="Add Workshop" />
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Add New Workshop</h1>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Workshop Details</CardTitle>
            <CardDescription>
              Enter the information for the new workshop
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label htmlFor="theme" className="block text-sm font-medium">
                    Workshop Theme
                  </label>
                  <Input
                    id="theme"
                    name="theme"
                    value={formData.theme}
                    onChange={handleChange}
                    required
                    placeholder="e.g., Robotics Basics"
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="date_of_workshop" className="block text-sm font-medium">
                    Date
                  </label>
                  <Input
                    id="date_of_workshop"
                    name="date_of_workshop"
                    type="date"
                    value={formData.date_of_workshop}
                    onChange={handleChange}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="duration" className="block text-sm font-medium">
                    Duration (minutes)
                  </label>
                  <Input
                    id="duration"
                    name="duration"
                    type="number"
                    value={formData.duration}
                    onChange={handleChange}
                    required
                    min="30"
                    placeholder="e.g., 120"
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="rate" className="block text-sm font-medium">
                    Price (₹)
                  </label>
                  <Input
                    id="rate"
                    name="rate"
                    type="number"
                    value={formData.rate}
                    onChange={handleChange}
                    required
                    min="0"
                    placeholder="e.g., 1200"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="description" className="block text-sm font-medium">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  required
                  placeholder="Enter workshop description (one point per line)"
                  rows={4}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-4">Location Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label htmlFor="address" className="block text-sm font-medium">
                      Address
                    </label>
                    <Input
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      required
                      placeholder="e.g., 123 Main St"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="city" className="block text-sm font-medium">
                      City
                    </label>
                    <Input
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      required
                      placeholder="e.g., Mumbai"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="country" className="block text-sm font-medium">
                      Country
                    </label>
                    <Input
                      id="country"
                      name="country"
                      value={formData.country}
                      onChange={handleChange}
                      required
                      placeholder="e.g., India"
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => router.push('/workshops')}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Saving...' : 'Create Workshop'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 