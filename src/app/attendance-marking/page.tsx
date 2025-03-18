'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PageHeader from '@/components/ui/PageHeader';

// Define interfaces for the data structure
interface Child {
  childname: string;
  age: number;
  _id: string | { $oid: string };
}

// Add interface for attendance record from database
interface AttendanceRecord {
  bookingId: string;
  childName: string;
  childAge: number;
  parentName: string;
  phoneNumber: string;
  workshopId: string;
  workshopName: string;
  workshopDate: string;
  workshopTime: string;
  attendanceStatus: 'pending' | 'present' | 'absent';
  comments?: string;
  markedAt: string;
  transactionId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface BookingData {
  _id: string | { $oid: string };
  workshop_id: string;
  child: Child[];
  parent_name?: string;
  ph_number: string;
  otp_verified: boolean;
  date_of_workshop: string;
  time: string;
  workshop_location: string;
  payment: {
    Transaction_ID: string;
    status: string;
    product_info: string;
    amount: number;
  };
  center_code: string;
  status: string;
  created_at: string | { $date: string };
}

interface ChildAttendanceData {
  id: string;
  bookingId: string;
  childName: string;
  childAge: number;
  parentName: string;
  phoneNumber: string;
  workshopId: string;
  workshopName: string;
  workshopDate: string;
  workshopTime: string;
  workshopLocation: string;
  attendanceStatus: 'pending' | 'present' | 'absent';
  comments: string;
  isSaved?: boolean; // Track if this record has been saved to database
  transactionId?: string; // Transaction ID from the payment
}

interface WorkshopData {
  [key: string]: {
    theme: string;
    name: string;
  }
}

export default function AttendanceMarkingPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [childAttendance, setChildAttendance] = useState<ChildAttendanceData[]>([]);
  const [filteredAttendance, setFilteredAttendance] = useState<ChildAttendanceData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [timeFilter, setTimeFilter] = useState<string>('all');
  const [workshopFilter, setWorkshopFilter] = useState<string>('all');
  const [workshops, setWorkshops] = useState<WorkshopData>({});
  const [isSaving, setIsSaving] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  
  // List of phone numbers to exclude (test/admin users)
  const excludePhoneNumbers = useMemo(() => [
    "9426052435",  //Aditya
    "9571209434",  // yash
    "9997386442",  //akshit
    "8235445537",  //saksham
    "9426042435",  
    "9560593600",
    "9876577271",
    "9581209434",
    "8348773838",
    "9517209434",
    "9811606576",
    "8778757518",
    "9813181011",
    "9997386642",
    "9571206434",
  ], []);
  
  // Helper functions
  const getObjectId = useCallback((id: string | { $oid: string }): string => {
    if (typeof id === 'object' && '$oid' in id) {
      return id.$oid;
    }
    return String(id);
  }, []);

  // Function to determine if a workshop is upcoming, today, or past
  const getWorkshopTimeCategory = useCallback((dateStr: string | undefined) => {
    // Check if dateStr is undefined or not a valid string
    if (!dateStr || typeof dateStr !== 'string' || !dateStr.includes('/')) {
      return 'upcoming'; // Default to upcoming if date is invalid
    }
    
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Parse date in dd/mm/yyyy format
      const [day, month, year] = dateStr.split('/').map(Number);
      
      // Validate parsed date components
      if (!day || !month || !year || isNaN(day) || isNaN(month) || isNaN(year)) {
        return 'upcoming';
      }
      
      const workshopDate = new Date(year, month - 1, day);
      workshopDate.setHours(0, 0, 0, 0);
      
      // Validate the created date
      if (isNaN(workshopDate.getTime())) {
        return 'upcoming';
      }
      
      const timeDiff = workshopDate.getTime() - today.getTime();
      const dayDiff = timeDiff / (1000 * 3600 * 24);
      
      if (dayDiff < 0) return 'past';
      if (dayDiff === 0) return 'today';
      return 'upcoming';
    } catch (e) {
      console.error("Error parsing date:", e);
      return 'upcoming';
    }
  }, []);

  // Fetch saved attendance records from database
  const fetchSavedAttendance = useCallback(async (attendanceData: ChildAttendanceData[]) => {
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      if (!token) {
        throw new Error("Authentication token not found");
      }
      
      // Get all transaction IDs and booking IDs to fetch relevant attendance records
      const transactionIds = new Set<string>();
      const bookingIds = new Set<string>();
      
      attendanceData.forEach(child => {
        if (child.transactionId) transactionIds.add(child.transactionId);
        if (child.bookingId) bookingIds.add(child.bookingId);
      });
      
      // Skip if no valid IDs to query
      if (transactionIds.size === 0 && bookingIds.size === 0) return;
      
      // Prepare query params
      const params = new URLSearchParams();
      if (transactionIds.size > 0) {
        Array.from(transactionIds).forEach(id => params.append('transactionId', id));
      }
      if (bookingIds.size > 0) {
        Array.from(bookingIds).forEach(id => params.append('bookingId', id));
      }
      
      // Fetch attendance records
      const response = await fetch(`/api/fetch-attendance?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch attendance: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success && Array.isArray(data.attendanceRecords)) {
        // Update local state with saved attendance records
        const updatedAttendance = [...attendanceData];
        
        data.attendanceRecords.forEach((record: AttendanceRecord) => {
          // Find matching child in our local state
          const matchIndex = updatedAttendance.findIndex(child => 
            (child.transactionId && child.transactionId === record.transactionId) &&
            child.childName === record.childName
          );
          
          if (matchIndex >= 0) {
            updatedAttendance[matchIndex] = {
              ...updatedAttendance[matchIndex],
              attendanceStatus: record.attendanceStatus,
              comments: record.comments || updatedAttendance[matchIndex].comments,
              isSaved: true
            };
          }
        });
        
        setChildAttendance(updatedAttendance);
        // Also update filtered attendance
        setFilteredAttendance(() => {
          // Apply current filters to updated attendance
          if (!searchQuery && timeFilter === 'all' && workshopFilter === 'all') {
            return updatedAttendance;
          } else {
            return updatedAttendance.filter(child => {
              let includeRecord = true;
              
              // Apply search filter
              if (searchQuery) {
                const query = searchQuery.toLowerCase();
                includeRecord = includeRecord && (
                  child.childName.toLowerCase().includes(query) ||
                  child.parentName.toLowerCase().includes(query) ||
                  child.phoneNumber.includes(query)
                );
              }
              
              // Apply time filter
              if (timeFilter !== 'all') {
                includeRecord = includeRecord && getWorkshopTimeCategory(child.workshopDate) === timeFilter;
              }
              
              // Apply workshop filter
              if (workshopFilter !== 'all') {
                includeRecord = includeRecord && child.workshopId === workshopFilter;
              }
              
              return includeRecord;
            });
          }
        });
      }
    } catch (error) {
      console.error("Error fetching saved attendance:", error);
    }
  }, [searchQuery, timeFilter, workshopFilter, getWorkshopTimeCategory]);

  // Transform booking data to child attendance format
  const transformBookingsToChildAttendance = useCallback((bookings: BookingData[]) => {
    const attendanceData: ChildAttendanceData[] = [];
    
    bookings.forEach(booking => {
      // Skip bookings with phone numbers in the exclude list
      if (excludePhoneNumbers.includes(booking.ph_number)) {
        return;
      }
      
      const bookingId = getObjectId(booking._id);
      
      // Ensure date format is valid
      let workshopDate = booking.date_of_workshop;
      if (!workshopDate || typeof workshopDate !== 'string' || !workshopDate.includes('/')) {
        // Try to format date to dd/mm/yyyy if possible
        try {
          const dateObj = new Date(workshopDate);
          if (!isNaN(dateObj.getTime())) {
            const day = dateObj.getDate().toString().padStart(2, '0');
            const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
            const year = dateObj.getFullYear();
            workshopDate = `${day}/${month}/${year}`;
          } else {
            workshopDate = 'Date not available';
          }
        } catch (e) {
          console.error("Error formatting date:", e);
          workshopDate = 'Date not available';
        }
      }
      
      booking.child.forEach((child, index) => {
        attendanceData.push({
          id: `${bookingId}-${index}`,
          bookingId,
          childName: child.childname,
          childAge: child.age,
          parentName: booking.parent_name || "N/A",
          phoneNumber: booking.ph_number,
          workshopId: booking.workshop_id,
          workshopName: booking.payment.product_info,
          workshopDate,
          workshopTime: booking.time || 'Time not specified',
          workshopLocation: booking.workshop_location || 'Location not specified',
          attendanceStatus: 'pending',
          comments: '',
          isSaved: false,
          transactionId: booking.payment.Transaction_ID || ''
        });
      });
    });
    
    setChildAttendance(attendanceData);
    setFilteredAttendance(attendanceData);
    
    // After creating attendance data, fetch saved attendance records
    fetchSavedAttendance(attendanceData);
  }, [getObjectId, excludePhoneNumbers, fetchSavedAttendance]);
  
  // Fetch workshops data
  const fetchWorkshops = useCallback(async (workshopIds: string[]) => {
    if (!workshopIds.length) return;
    
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      if (!token) return;
      
      const workshopData: WorkshopData = {};
      
      const promises = workshopIds.map(async (id) => {
        try {
          const response = await fetch(`/api/workshop?id=${id}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.workshop) {
              workshopData[id] = {
                theme: data.workshop.theme || 'Unknown',
                name: data.workshop.name || data.workshop.theme || 'Unknown Workshop'
              };
            }
          }
        } catch (error) {
          console.error(`Error fetching workshop ${id}:`, error);
        }
      });
      
      await Promise.all(promises);
      setWorkshops(workshopData);
    } catch (error) {
      console.error("Error fetching workshops:", error);
    }
  }, []);
  
  // Fetch bookings data
  const fetchBookings = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Get auth token
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      
      if (!token) {
        throw new Error("Authentication token not found");
      }
      
      const response = await fetch('/api/bookings', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (response.status === 401) {
        throw new Error("Not authorized to access booking data");
      }
      
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.bookings && Array.isArray(data.bookings)) {
        // Extract unique workshop IDs to fetch themes
        const workshopIds = new Set<string>();
        data.bookings.forEach((booking: BookingData) => {
          if (booking.workshop_id) {
            workshopIds.add(booking.workshop_id);
          }
        });
        
        // Fetch workshop details
        fetchWorkshops(Array.from(workshopIds));
        
        // Transform bookings into child attendance data
        transformBookingsToChildAttendance(data.bookings);
        
        // Update last refreshed timestamp
        setLastRefreshed(new Date());
      } else {
        throw new Error("Invalid response format from API");
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch booking data";
      setError(errorMessage);
      console.error("Error fetching bookings:", err);
    } finally {
      setIsLoading(false);
    }
  }, [fetchWorkshops, transformBookingsToChildAttendance]);
  
  // Apply filters when any filter changes
  useEffect(() => {
    if (!childAttendance.length) return;
    
    let filtered = [...childAttendance];
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(child => 
        child.childName.toLowerCase().includes(query) ||
        child.parentName.toLowerCase().includes(query) ||
        child.phoneNumber.includes(query)
      );
    }
    
    // Apply time filter
    if (timeFilter !== 'all') {
      filtered = filtered.filter(child => {
        // Make sure child.workshopDate is valid before passing to getWorkshopTimeCategory
        if (!child.workshopDate || typeof child.workshopDate !== 'string') {
          return timeFilter === 'upcoming'; // Default to upcoming for invalid dates
        }
        return getWorkshopTimeCategory(child.workshopDate) === timeFilter;
      });
    }
    
    // Apply workshop filter
    if (workshopFilter !== 'all') {
      filtered = filtered.filter(child => 
        child.workshopId === workshopFilter
      );
    }
    
    setFilteredAttendance(filtered);
  }, [childAttendance, searchQuery, timeFilter, workshopFilter, getWorkshopTimeCategory]);
  
  // Fetch data on component mount
  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);
  
  // Update attendance status for a child
  const updateAttendanceStatus = (childId: string, status: 'pending' | 'present' | 'absent') => {
    const updatedAttendance = childAttendance.map(child => {
      if (child.id === childId) {
        // Reset isSaved flag when status changes
        return { ...child, attendanceStatus: status, isSaved: false };
      }
      return child;
    });
    
    setChildAttendance(updatedAttendance);
    
    // If status is changed to present or absent, save to database
    if (status !== 'pending') {
      const child = updatedAttendance.find(c => c.id === childId);
      if (child && !child.isSaved) {
        saveAttendanceToDatabase(child, status);
      }
    }
  };
  
  // Save attendance record to database
  const saveAttendanceToDatabase = async (child: ChildAttendanceData, status: 'present' | 'absent') => {
    try {
      setIsSaving(true);
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      
      if (!token) {
        throw new Error("Authentication token not found");
      }
      
      // Create attendance record
      const attendanceRecord = {
        bookingId: child.bookingId,
        childName: child.childName,
        childAge: child.childAge,
        parentName: child.parentName,
        phoneNumber: child.phoneNumber,
        workshopId: child.workshopId,
        workshopName: child.workshopName,
        workshopDate: child.workshopDate,
        workshopTime: child.workshopTime,
        attendanceStatus: status,
        comments: child.comments,
        markedAt: new Date().toISOString(),
        transactionId: child.transactionId || '' // Include transaction ID
      };
      
      // Send to API endpoint
      const response = await fetch('/api/attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(attendanceRecord)
      });
      
      if (!response.ok) {
        throw new Error(`Failed to save attendance: ${response.status}`);
      }
      
      // Mark this record as saved in our state
      setChildAttendance(prev => prev.map(c => 
        c.id === child.id 
          ? { ...c, isSaved: true } 
          : c
      ));
      
      console.log(`Attendance marked ${status} for ${child.childName}`);
    } catch (error) {
      console.error("Error saving attendance:", error);
      // Could add user notification here
    } finally {
      setIsSaving(false);
    }
  };
  
  // Save all attendance data
  const saveAllAttendance = async () => {
    setIsLoading(true);
    
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      
      if (!token) {
        throw new Error("Authentication token not found");
      }
      
      // Filter for records that need to be saved:
      // 1. Records with attendance marked AND not yet saved
      // 2. OR records with comments AND not yet saved
      const unsavedAttendance = childAttendance.filter(
        child => (!child.isSaved && 
          (child.attendanceStatus !== 'pending' || (child.comments && child.comments.trim() !== '')))
      );
      
      if (unsavedAttendance.length === 0) {
        alert("No new attendance records or comments to save.");
        setIsLoading(false);
        return;
      }
      
      // Format for database storage
      const attendanceRecords = unsavedAttendance.map(child => ({
        bookingId: child.bookingId,
        childName: child.childName,
        childAge: child.childAge,
        parentName: child.parentName,
        phoneNumber: child.phoneNumber,
        workshopId: child.workshopId,
        workshopName: child.workshopName,
        workshopDate: child.workshopDate,
        workshopTime: child.workshopTime,
        attendanceStatus: child.attendanceStatus,
        comments: child.comments,
        markedAt: new Date().toISOString(),
        transactionId: child.transactionId || '' // Include transaction ID
      }));
      
      // Send to API endpoint for bulk save
      const response = await fetch('/api/bulk-attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          attendanceRecords,
          // Add metadata for database insertion
          dbName: "CRM",
          collectionName: "Attendance"
        })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to save attendance: ${response.status}`);
      }
      
      const result = await response.json();
      
      // Mark all these records as saved
      setChildAttendance(prev => prev.map(child => 
        unsavedAttendance.some(unsaved => unsaved.id === child.id)
          ? { ...child, isSaved: true }
          : child
      ));
      
      alert(`Attendance saved successfully! (${result.result.inserted} new, ${result.result.updated} updated)`);
    } catch (error) {
      console.error("Error saving attendance data:", error);
      alert(`Failed to save attendance data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Update comments for a child
  const updateComments = (childId: string, comments: string) => {
    const updatedAttendance = childAttendance.map(child => {
      if (child.id === childId) {
        // Mark record as unsaved when comments change, so it will be included in next save
        return { ...child, comments, isSaved: false };
      }
      return child;
    });
    
    setChildAttendance(updatedAttendance);
  };

  // Format the lastRefreshed date for display
  const formatLastRefreshed = () => {
    if (!lastRefreshed) return 'Never';
    
    const now = new Date();
    const diff = Math.floor((now.getTime() - lastRefreshed.getTime()) / 1000); // diff in seconds
    
    if (diff < 60) return `${diff} second${diff !== 1 ? 's' : ''} ago`;
    if (diff < 3600) {
      const minutes = Math.floor(diff / 60);
      return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    }
    
    const hours = lastRefreshed.getHours().toString().padStart(2, '0');
    const minutes = lastRefreshed.getMinutes().toString().padStart(2, '0');
    return `at ${hours}:${minutes}`;
  };
  
  // Handle refresh button click
  const handleRefresh = () => {
    fetchBookings();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader pageName="Attendance Marking" />
      <div className="p-6">
        <p className="text-gray-600 mb-6">Track and manage attendance for all workshop participants</p>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex flex-col md:flex-row justify-between gap-4 mb-4">
            <div className="flex flex-col sm:flex-row gap-2">
              <Select value={timeFilter} onValueChange={setTimeFilter}>
                <SelectTrigger className={`w-[180px] ${timeFilter !== "all" ? "border-blue-500 bg-blue-50" : ""}`}>
                  <SelectValue placeholder="Workshop Time">
                    {timeFilter === 'upcoming' ? 'Upcoming' : 
                     timeFilter === 'today' ? 'Today' : 
                     timeFilter === 'past' ? 'Past' : 'All Times'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Times</SelectItem>
                  <SelectItem value="upcoming">Upcoming</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="past">Past</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={workshopFilter} onValueChange={setWorkshopFilter}>
                <SelectTrigger className={`w-[220px] ${workshopFilter !== "all" ? "border-purple-500 bg-purple-50" : ""}`}>
                  <SelectValue placeholder="Select Workshop">
                    {workshopFilter === 'all' ? 'All Workshops' : 
                     workshops[workshopFilter]?.name || 'Unknown Workshop'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Workshops</SelectItem>
                  {Object.entries(workshops).map(([id, workshop]) => (
                    <SelectItem key={id} value={id}>{workshop.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {/* Refresh Button */}
              <Button 
                variant="outline" 
                size="default" 
                onClick={handleRefresh}
                disabled={isLoading}
                className="flex items-center gap-1 whitespace-nowrap"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`${isLoading ? "animate-spin" : ""}`}>
                  <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
                  <path d="M21 3v5h-5" />
                </svg>
                {isLoading ? "Refreshing..." : "Refresh Data"}
              </Button>
            </div>
            
            <div className="relative w-full md:w-[300px]">
              <Input 
                placeholder="Search by child or parent name" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`pl-9 w-full ${searchQuery ? "border-green-500 bg-green-50" : ""}`}
              />
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
              </div>
              {searchQuery && (
                <button 
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500 hover:text-green-700"
                  onClick={() => setSearchQuery("")}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              )}
            </div>
          </div>
          
          {/* Last Updated Timestamp */}
          <div className="text-xs text-gray-500 mb-3 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            Last updated: {formatLastRefreshed()}
          </div>
          
          {/* Filter badges */}
          <div className="flex flex-wrap gap-2 mb-4">
            {searchQuery && (
              <Badge variant="outline" className="flex items-center gap-1 bg-green-100 border-green-300 text-green-800 px-3 py-1.5 rounded-md">
                <span className="font-medium text-green-800 mr-1">Search:</span>
                <span className="font-semibold text-green-900">&quot;{searchQuery}&quot;</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 p-0 ml-1.5 text-green-600 hover:text-green-800 hover:bg-green-200 rounded-full"
                  onClick={() => setSearchQuery("")}
                >
                  ×
                </Button>
              </Badge>
            )}
            
            {timeFilter !== 'all' && (
              <Badge variant="outline" className="flex items-center gap-1 bg-blue-100 border-blue-300 text-blue-800 px-3 py-1.5 rounded-md">
                <span className="font-medium text-blue-800 mr-1">Time:</span>
                <span className="font-semibold text-blue-900">
                  {timeFilter === 'upcoming' ? 'Upcoming' : 
                   timeFilter === 'today' ? 'Today' : 'Past'}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 p-0 ml-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-200 rounded-full"
                  onClick={() => setTimeFilter('all')}
                >
                  ×
                </Button>
              </Badge>
            )}
            
            {workshopFilter !== 'all' && (
              <Badge variant="outline" className="flex items-center gap-1 bg-purple-100 border-purple-300 text-purple-800 px-3 py-1.5 rounded-md">
                <span className="font-medium text-purple-800 mr-1">Workshop:</span>
                <span className="font-semibold text-purple-900">
                  {workshops[workshopFilter]?.name || 'Unknown'}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 p-0 ml-1.5 text-purple-600 hover:text-purple-800 hover:bg-purple-200 rounded-full"
                  onClick={() => setWorkshopFilter('all')}
                >
                  ×
                </Button>
              </Badge>
            )}
          </div>
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded mb-4">
              {error}
            </div>
          )}
          
          {isLoading ? (
            <div className="text-center py-8">Loading attendance data...</div>
          ) : (
            <>
              <div className="mb-3 text-sm text-gray-700">
                {filteredAttendance.length} {filteredAttendance.length === 1 ? 'child' : 'children'} found
              </div>
              <div className="overflow-x-auto max-h-[calc(100vh-280px)] overflow-y-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0 z-10">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">S.No</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Child Name</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Age</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Workshop</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Attendance</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Comments</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredAttendance.length > 0 ? (
                      filteredAttendance.map((child, index) => (
                        <tr key={child.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{index + 1}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{child.childName || 'N/A'}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{child.childAge || '-'}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{child.phoneNumber || 'N/A'}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            {workshops[child.workshopId]?.name || child.workshopName || 'Unknown Workshop'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            {child.workshopDate || 'Date not available'}{child.workshopTime ? `, ${child.workshopTime}` : ''}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {child.attendanceStatus === 'present' ? (
                              <Badge className="bg-green-100 text-green-800 border-green-300">Present</Badge>
                            ) : child.attendanceStatus === 'absent' ? (
                              <Badge className="bg-red-100 text-red-800 border-red-300">Absent</Badge>
                            ) : (
                              <select 
                                className="rounded border border-gray-300 text-sm py-1 px-2"
                                value={child.attendanceStatus}
                                onChange={(e) => updateAttendanceStatus(child.id, e.target.value as 'pending' | 'present' | 'absent')}
                              >
                                <option value="pending">Mark Attendance</option>
                                <option value="present">Present</option>
                                <option value="absent">Absent</option>
                              </select>
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="relative">
                              <Input 
                                placeholder="Add comment" 
                                className={`w-40 h-8 text-xs ${child.comments && !child.isSaved ? "border-amber-400 bg-amber-50" : ""}`}
                                value={child.comments}
                                onChange={(e) => updateComments(child.id, e.target.value)}
                              />
                              {child.comments && !child.isSaved && (
                                <span className="absolute right-0 -top-1 h-2 w-2 bg-amber-400 rounded-full"></span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                          No children found. Please adjust your filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              
              <div className="mt-6 flex justify-end">
                <Button 
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={saveAllAttendance}
                  disabled={isLoading || isSaving}
                >
                  {isLoading || isSaving ? 'Saving...' : 'Save Attendance'}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
} 