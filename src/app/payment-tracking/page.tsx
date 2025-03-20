'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PageHeader from '@/components/ui/PageHeader';
import { format } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "@heroicons/react/24/outline";
import { cn } from "@/lib/utils";
import { DayPicker } from "react-day-picker";


// Interface for bookings from DB
interface BookingData {
  _id: string | { $oid: string };
  workshop_id: string;
  child: Array<{
    childname: string;
    age: number;
    _id: string | { $oid: string };
  }>;
  parent_name?: string;
  ph_number: string;
  otp_verified: boolean;
  date_of_workshop: string;
  time: string;
  workshop_location: string;
  payment: {
    Transaction_ID: string;
    gateway: string | null;
    mode: string;
    status: string;
    product_info: string;
    reference_id: string;
    amount: number;
    access_key: string | null;
    surl: string | null;
    furl: string | null;
    agent_code: string | null;
    updated_by: string | null;
    offline_details: unknown | null;
  };
  center_code: string;
  status: string;
  created_at: string | { $date: string };
  updated_at: string | { $date: string };
  merchant?: {
    name: string | null;
    transaction_id: string | null;
  };
  __v: number;
}

// Interface for child rows
interface ChildRowData {
  id: string;
  bookingId: string;
  childName: string;
  childAge: number;
  parentName: string;
  phoneNumber: string;
  otpVerified: boolean;
  workshopDate: string;
  workshopTime: string;
  workshopLocation: string;
  transactionId: string;
  productInfo: string;
  amount: number;
  paymentStatus: string;
  paymentMode: string;
  paymentGateway: string;
  referenceId: string;
  centerCode: string;
  bookingStatus: string;
  createdAt: string;
  transactionDate: string;
  workshopId: string;
  workshopTheme?: string;
  isFirstChild: boolean;
  totalChildren: number;
  childIndex: number;
}

// Date range interface
interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

// Workshop theme mapping
interface WorkshopThemes {
  [key: string]: string;
}

export default function PaymentTrackingPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [bookings, setBookings] = useState<BookingData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [paymentModeFilter, setPaymentModeFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<DateRange>({
    from: undefined,
    to: undefined
  });
  const [workshopThemes, setWorkshopThemes] = useState<WorkshopThemes>({});
  const [otpFilter, setOtpFilter] = useState<string>("all");
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  
  // Define excluded phone numbers once as a const outside the useMemo
  const excludePhoneNumbers = [
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
  ];
  
  // Wrap fetchBookings in useCallback to avoid recreating it on each render
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
        setBookings(data.bookings);
        
        // Extract unique workshop IDs to fetch themes
        const workshopIds = new Set<string>();
        data.bookings.forEach((booking: BookingData) => {
          if (booking.workshop_id) {
            workshopIds.add(booking.workshop_id);
          }
        });
        
        // Fetch workshop themes
        fetchWorkshopThemes(Array.from(workshopIds));
        
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
  }, []); // Empty dependency array as it doesn't depend on any props or state
  
  // Fetch workshop themes
  const fetchWorkshopThemes = async (workshopIds: string[]) => {
    if (!workshopIds.length) return;
    
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      if (!token) return;
      
      const themes: Record<string, string> = {};
      
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
              themes[id] = data.workshop.theme;
            }
          }
        } catch (error) {
          console.error(`Error fetching theme for workshop ${id}:`, error);
        }
      });
      
      await Promise.all(promises);
      setWorkshopThemes(themes);
    } catch (error) {
      console.error("Error fetching workshop themes:", error);
    }
  };
  
  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);
  
  // Helper functions to format dates and extract values - wrap in useCallback
  const formatDate = useCallback((dateString: string | { $date: string }): string => {
    try {
      if (typeof dateString === 'object' && '$date' in dateString) {
        return format(new Date(dateString.$date), 'dd/MM/yyyy');
      }
      return format(new Date(dateString as string), 'dd/MM/yyyy');
    } catch (e) {
      console.error("Error formatting date:", e);
      return "Invalid Date";
    }
  }, []);
  
  const getObjectId = useCallback((id: string | { $oid: string }): string => {
    if (typeof id === 'object' && '$oid' in id) {
      return id.$oid;
    }
    return String(id);
  }, []);
  
  // Transform booking data to child rows - wrap in useCallback
  const transformBookingsToChildRows = useCallback((bookings: BookingData[]): ChildRowData[] => {
    const childRows: ChildRowData[] = [];
    
    bookings.forEach(booking => {
      const bookingId = getObjectId(booking._id);
      const createdAt = typeof booking.created_at === 'object' && booking.created_at.$date 
        ? booking.created_at.$date 
        : String(booking.created_at);
      
      booking.child.forEach((child, index) => {
        childRows.push({
          id: `${bookingId}-${index}`,
          bookingId,
          childName: child.childname,
          childAge: child.age,
          parentName: booking.parent_name || "N/A",
          phoneNumber: booking.ph_number,
          otpVerified: booking.otp_verified,
          workshopDate: booking.date_of_workshop,
          workshopTime: booking.time,
          workshopLocation: booking.workshop_location,
          transactionId: booking.payment.Transaction_ID || "N/A",
          productInfo: booking.payment.product_info,
          amount: booking.payment.amount,
          paymentStatus: booking.payment.status,
          paymentMode: booking.payment.mode,
          paymentGateway: booking.payment.gateway || "N/A",
          referenceId: booking.payment.reference_id || "N/A",
          centerCode: booking.center_code,
          bookingStatus: booking.status,
          createdAt: formatDate(createdAt),
          transactionDate: formatDate(createdAt),
          workshopId: booking.workshop_id,
          workshopTheme: workshopThemes[booking.workshop_id],
          isFirstChild: index === 0,
          totalChildren: booking.child.length,
          childIndex: index
        });
      });
    });
    
    return childRows;
  }, [workshopThemes, formatDate, getObjectId]); // dependencies remain the same
  
  // Filtered and sorted child rows
  const filteredChildRows = useMemo(() => {
    // Start with transformed data - this includes ALL children for each booking
    let childRows = transformBookingsToChildRows(bookings);
    
    // Only filter out test/admin phone numbers - all children from the same booking 
    // share the parent's phone number, so this excludes test/admin bookings
    childRows = childRows.filter(row => !excludePhoneNumbers.includes(row.phoneNumber));
    
    // Apply all filters in a single pass for better performance
    childRows = childRows.filter(row => {
      // Search query filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const searchMatch = 
          row.childName.toLowerCase().includes(query) ||
          row.parentName.toLowerCase().includes(query) ||
          row.phoneNumber.includes(query) ||
          row.productInfo.toLowerCase().includes(query) ||
          row.transactionId.toLowerCase().includes(query) ||
          row.referenceId.toLowerCase().includes(query);
        
        if (!searchMatch) return false;
      }
      
      // Payment status filter
      if (statusFilter !== "all" && row.paymentStatus !== statusFilter) {
        return false;
      }
      
      // Payment mode filter
      if (paymentModeFilter !== "all" && row.paymentMode !== paymentModeFilter) {
        return false;
      }
      
      // OTP verification filter
      if (otpFilter === "verified" && !row.otpVerified) {
        return false;
      } else if (otpFilter === "pending" && row.otpVerified) {
        return false;
      }
      
      // Date range filter
      if (dateRange.from && dateRange.to) {
        try {
          // Check if transactionDate exists and is properly formatted
          if (!row.transactionDate || typeof row.transactionDate !== 'string') {
            return false; // Filter out entries without valid dates
          }
          
          // Make sure transactionDate is in the expected format before splitting
          if (!row.transactionDate.includes('/')) {
            return false;
          }
          
          const [day, month, year] = row.transactionDate.split('/').map(Number);
          
          // Validate that we have valid date components
          if (!day || !month || !year || isNaN(day) || isNaN(month) || isNaN(year)) {
            return false;
          }
          
          const bookingDate = new Date(year, month - 1, day);
          
          // Validate the resulting date
          if (isNaN(bookingDate.getTime())) {
            return false;
          }
          
          const start = new Date(dateRange.from);
          start.setHours(0, 0, 0, 0);
          
          const end = new Date(dateRange.to);
          end.setHours(23, 59, 59, 999);
          
          if (bookingDate < start || bookingDate > end) {
            return false;
          }
        } catch (e) {
          console.error("Error parsing date:", e, row);
          return false; // If there's any error in date handling, filter out the row
        }
      }
      
      // If passed all filters, include the row
      return true;
    });
    
    // Sort by transaction date - most recent first
    childRows.sort((a, b) => {
      try {
        // Parse dates from DD/MM/YYYY format
        const [dayA, monthA, yearA] = a.transactionDate.split('/').map(Number);
        const [dayB, monthB, yearB] = b.transactionDate.split('/').map(Number);
        
        // Create Date objects
        const dateA = new Date(yearA, monthA - 1, dayA);
        const dateB = new Date(yearB, monthB - 1, dayB);
        
        // Validate dates before comparing
        if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) {
          return 0; // Keep original order if dates are invalid
        }
        
        // Sort descending (newest first)
        return dateB.getTime() - dateA.getTime();
      } catch (error) {
        console.error("Error sorting by transaction date:", error);
        return 0; // Keep original order on error
      }
    });
    
    return childRows;
  }, [bookings, searchQuery, statusFilter, paymentModeFilter, otpFilter, dateRange, transformBookingsToChildRows]);

  // Count active filters for the filter summary
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (statusFilter !== "all") count++;
    if (paymentModeFilter !== "all") count++;
    if (otpFilter !== "all") count++;
    if (dateRange.from && dateRange.to) count++;
    if (searchQuery) count++;
    return count;
  }, [statusFilter, paymentModeFilter, otpFilter, dateRange, searchQuery]);

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
      <PageHeader pageName="Payment Tracking" />
      <div className="flex-1 p-6 transition-all duration-300 ease-in-out">
        <div className="flex flex-col w-full">
          

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex flex-col md:flex-row gap-2 items-start md:items-center flex-wrap md:mr-auto">
                <div className="flex flex-col sm:flex-row gap-2">
                  <Select
                    value={statusFilter}
                    onValueChange={(value) => setStatusFilter(value)}
                  >
                    <SelectTrigger className={`w-[180px] ${statusFilter !== "all" ? "border-blue-500 bg-blue-50" : ""}`}>
                      <SelectValue placeholder="Payment Status">
                        {statusFilter === "all" ? "Payment Status" : 
                         statusFilter === "confirmed" ? "Confirmed" :
                         statusFilter === "completed" ? "Completed" :
                         statusFilter === "initiated" ? "Initiated" :
                         statusFilter === "pending" ? "Pending" :
                         statusFilter === "failed" ? "Failed" : "Payment Status"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="initiated">Initiated</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select
                    value={paymentModeFilter}
                    onValueChange={(value) => setPaymentModeFilter(value)}
                  >
                    <SelectTrigger className={`w-[180px] ${paymentModeFilter !== "all" ? "border-purple-500 bg-purple-50" : ""}`}>
                      <SelectValue placeholder="Payment Mode">
                        {paymentModeFilter === "all" ? "Payment Mode" :
                         paymentModeFilter === "online" ? "Online" :
                         paymentModeFilter === "offline" ? "Offline" : "Payment Mode"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Modes</SelectItem>
                      <SelectItem value="online">Online</SelectItem>
                      <SelectItem value="offline">Offline</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select
                    value={otpFilter}
                    onValueChange={(value) => setOtpFilter(value)}
                  >
                    <SelectTrigger className={`w-[180px] ${otpFilter !== "all" ? "border-amber-500 bg-amber-50" : ""}`}>
                      <SelectValue placeholder="OTP Status">
                        {otpFilter === "all" ? "OTP Status" :
                         otpFilter === "verified" ? "OTP Verified" :
                         otpFilter === "pending" ? "OTP Pending" : "OTP Status"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All OTP Status</SelectItem>
                      <SelectItem value="verified">OTP Verified</SelectItem>
                      <SelectItem value="pending">OTP Pending</SelectItem>
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

                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={`w-[220px] px-3 py-2 justify-start ${dateRange.from && dateRange.to ? 'border-indigo-500 bg-indigo-50 text-indigo-900 hover:bg-indigo-100' : ''}`}
                      >
                        {dateRange.from && dateRange.to ? (
                          <div className="flex items-center">
                            <CalendarIcon className="mr-2 h-4 w-4 text-indigo-600" />
                            <span className="font-medium">
                              {format(dateRange.from, "MMM d")} - {format(dateRange.to, "MMM d, yyyy")}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            <div className="flex flex-col items-start text-left">
                              <span className="text-xs font-medium text-gray-500">Transaction Date</span>
                              <span className="text-sm">Select Range</span>
                            </div>
                          </div>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent 
                      className="w-auto p-0 border border-indigo-200 shadow-lg rounded-md" 
                      align="start"
                    >
                      <div className="p-2 border-b border-indigo-100 bg-indigo-50">
                        <h3 className="font-medium text-indigo-900">Filter by Transaction Date</h3>
                        <p className="text-xs text-indigo-700">Select start and end dates</p>
                      </div>
                      <DayPicker
                        mode="range"
                        selected={dateRange}
                        onSelect={(range) => {
                          if (range?.from) {
                            setDateRange({ 
                              from: range.from, 
                              to: range.to || range.from 
                            });
                          } else {
                            setDateRange({ from: undefined, to: undefined });
                          }
                        }}
                        numberOfMonths={2}
                        className={cn("p-3")}
                        classNames={{
                          months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                          month: "space-y-4",
                          caption: "flex justify-center pt-1 relative items-center",
                          caption_label: "text-sm font-medium text-gray-900",
                          nav: "space-x-1 flex items-center",
                          nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 hover:bg-gray-100 rounded-full",
                          nav_button_previous: "absolute left-1",
                          nav_button_next: "absolute right-1",
                          table: "w-full border-collapse space-y-1",
                          head_row: "flex",
                          head_cell: "text-gray-500 rounded-md w-9 font-normal text-[0.8rem]",
                          row: "flex w-full mt-2",
                          cell: "text-center text-sm p-0 relative [&:has([aria-selected])]:bg-indigo-50 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                          day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100 rounded-md",
                          day_selected: "bg-indigo-600 text-white hover:bg-indigo-600 hover:text-white focus:bg-indigo-600 focus:text-white",
                          day_today: "bg-gray-100 text-gray-900",
                          day_outside: "text-gray-400 opacity-50",
                          day_disabled: "text-gray-400 opacity-50",
                          day_range_middle: "aria-selected:bg-indigo-100 aria-selected:text-indigo-900",
                          day_hidden: "invisible",
                        }}
                        modifiersStyles={{
                          selected: { backgroundColor: "#4f46e5", color: "white" },
                          today: { color: "#4f46e5", fontWeight: "bold" },
                          range_start: { backgroundColor: "#4f46e5", color: "white" },
                          range_end: { backgroundColor: "#4f46e5", color: "white" },
                        }}
                      />
                      <div className="p-3 border-t border-indigo-100 bg-indigo-50 flex justify-between">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDateRange({ from: undefined, to: undefined })}
                          className="text-indigo-700 border-indigo-300 hover:bg-indigo-100"
                        >
                          Clear
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => document.body.click()}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white"
                        >
                          Apply Filter
                        </Button>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="w-full md:w-auto md:self-start flex flex-col sm:flex-row gap-2">
                <div className="relative w-full md:w-[320px]">
                  <Input
                    placeholder="Search by name, phone, transaction ID"
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
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              {activeFilterCount > 0 && (
                <div className="w-full mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700">Active Filters:</span>
                    <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">
                      {activeFilterCount} {activeFilterCount === 1 ? 'filter' : 'filters'} applied
                    </Badge>
                    {activeFilterCount > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs text-gray-600 hover:text-gray-900"
                        onClick={() => {
                          setStatusFilter("all");
                          setPaymentModeFilter("all");
                          setOtpFilter("all");
                          setDateRange({ from: undefined, to: undefined });
                          setSearchQuery("");
                        }}
                      >
                        Clear All Filters
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {searchQuery && (
                <Badge variant="outline" className="flex items-center gap-1 bg-green-100 border-green-300 text-green-800 px-3 py-1.5 rounded-md">
                  <span className="font-medium text-green-800 mr-1">Search:</span>
                  <span className="font-semibold text-green-900">&quot;{searchQuery}&quot;</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 p-0 ml-1.5 text-green-600 hover:text-green-800 hover:bg-green-200 rounded-full"
                    onClick={() => {
                      setSearchQuery("");
                    }}
                  >
                    ×
                  </Button>
                </Badge>
              )}

              {dateRange.from && dateRange.to && (
                <Badge variant="outline" className="flex items-center gap-1 bg-indigo-100 border-indigo-300 text-indigo-800 px-3 py-1.5 rounded-md">
                  <CalendarIcon className="h-3.5 w-3.5 mr-1 text-indigo-600" />
                  <span className="font-medium text-indigo-800 mr-1">Transaction Date:</span>
                  <span className="font-semibold text-indigo-900">
                    {format(dateRange.from, "MMM d")}
                  </span>
                  <span className="mx-1 text-indigo-400">—</span>
                  <span className="font-semibold text-indigo-900">
                    {format(dateRange.to, "MMM d, yyyy")}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 p-0 ml-1.5 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-200 rounded-full"
                    onClick={() => {
                      setDateRange({ from: undefined, to: undefined });
                    }}
                  >
                    ×
                  </Button>
                </Badge>
              )}

              {statusFilter !== "all" && (
                <Badge variant="outline" className="flex items-center gap-1 bg-blue-100 border-blue-300 text-blue-800 px-3 py-1.5 rounded-md">
                  <span className="font-medium text-blue-800 mr-1">Payment Status:</span>
                  <span className="font-semibold text-blue-900">
                    {statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 p-0 ml-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-200 rounded-full"
                    onClick={() => {
                      setStatusFilter("all");
                    }}
                  >
                    ×
                  </Button>
                </Badge>
              )}

              {paymentModeFilter !== "all" && (
                <Badge variant="outline" className="flex items-center gap-1 bg-purple-100 border-purple-300 text-purple-800 px-3 py-1.5 rounded-md">
                  <span className="font-medium text-purple-800 mr-1">Payment Mode:</span>
                  <span className="font-semibold text-purple-900">
                    {paymentModeFilter.charAt(0).toUpperCase() + paymentModeFilter.slice(1)}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 p-0 ml-1.5 text-purple-600 hover:text-purple-800 hover:bg-purple-200 rounded-full"
                    onClick={() => {
                      setPaymentModeFilter("all");
                    }}
                  >
                    ×
                  </Button>
                </Badge>
              )}

              {otpFilter !== "all" && (
                <Badge variant="outline" className="flex items-center gap-1 bg-amber-100 border-amber-300 text-amber-800 px-3 py-1.5 rounded-md">
                  <span className="font-medium text-amber-800 mr-1">OTP Status:</span>
                  <span className="font-semibold text-amber-900">
                    {otpFilter === "verified" ? "Verified" : "Pending"}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 p-0 ml-1.5 text-amber-600 hover:text-amber-800 hover:bg-amber-200 rounded-full"
                    onClick={() => {
                      setOtpFilter("all");
                    }}
                  >
                    ×
                  </Button>
                </Badge>
              )}
            </div>

            {/* Last Updated Timestamp */}
            <div className="text-xs text-gray-500 mb-3 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
              Last updated: {formatLastRefreshed()}
            </div>

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}

            {isLoading ? (
              <div className="text-center py-8">Loading payment data...</div>
            ) : (
              <div className="overflow-hidden border border-gray-200 rounded-md w-full">
                <div className="flex justify-between items-center px-4 py-2 bg-gray-50 border-b">
                  <div className="text-sm font-medium text-gray-700">
                    {filteredChildRows.length} payments found
                  </div>
                  {filteredChildRows.length > 0 && activeFilterCount > 0 && (
                    <div className="text-xs text-gray-600">
                      Filtered from {transformBookingsToChildRows(bookings).filter(row => 
                        !excludePhoneNumbers.includes(row.phoneNumber)
                      ).length} total payments
                    </div>
                  )}
                </div>
                <div className="overflow-x-auto max-h-[calc(100vh-320px)] overflow-y-auto">
                  <table className="w-full divide-y divide-gray-200" style={{ minWidth: "1400px" }}>
                    <thead className="bg-gray-50 sticky top-0 z-10">
                      <tr>
                        <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[40px]">
                          S.No
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[130px]">
                          Transaction ID
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[110px]">
                          Trans. Date
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[130px]">
                          Reference ID
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[110px]">
                          Phone
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[140px]">
                          Child Name
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[50px]">
                          Age
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[110px]">
                          Workshop Date
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[110px]">
                          Workshop Time
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[150px]">
                          Workshop Theme
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[80px]">
                          Amount
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[120px]">
                          Payment Status
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[100px]">
                          Payment Mode
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[140px]">
                          Payment Gateway
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[100px]">
                          Center Code
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredChildRows.length > 0 ? (
                        (() => {
                          // Pre-process to identify unique booking groups
                          const bookingGroups = new Map();
                          let currentGroupId = 0;
                          
                          filteredChildRows.forEach(row => {
                            if (!bookingGroups.has(row.bookingId)) {
                              bookingGroups.set(row.bookingId, currentGroupId++);
                            }
                          });
                          
                          return filteredChildRows.map((row, index) => {
                            const isNewBookingGroup =
                              index === 0 ||
                              row.bookingId !== filteredChildRows[index - 1].bookingId;
                            
                            const groupStartClass = isNewBookingGroup
                              ? "border-t-2 border-blue-200"
                              : "";
                            
                            // Get booking group ID and use it for coloring
                            const bookingGroupId = bookingGroups.get(row.bookingId);
                            const bgColorClass = bookingGroupId % 2 === 0 
                              ? "bg-white" 
                              : "bg-gray-50";

                            return (
                              <tr
                                key={row.id}
                                className={`${bgColorClass} ${groupStartClass} hover:bg-gray-100`}
                                title={`Child ${row.childIndex + 1} of ${row.totalChildren} in booking ${row.bookingId}`}
                              >
                                <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-900">
                                  {index + 1}
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                                  <span className="font-mono text-xs tracking-tighter">
                                    {row.transactionId}
                                  </span>
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                                  {row.transactionDate}
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                                  <span className="font-mono text-xs tracking-tighter">
                                    {row.referenceId}
                                  </span>
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                                  {row.phoneNumber}
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                                  <div className="font-medium">
                                    {row.childName}
                                  </div>
                                  {row.totalChildren > 1 && (
                                    <div className="text-xs text-gray-500">
                                      Child {row.childIndex + 1} of {row.totalChildren}
                                    </div>
                                  )}
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                                  {row.childAge}
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                                  {row.workshopDate}
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                                  {row.workshopTime}
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                                  {row.workshopId ? (
                                    <a 
                                      href={`https://workshops.geniuslabs.live/${row.workshopId}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-600 hover:text-blue-800 hover:underline"
                                    >
                                      {row.workshopTheme || row.productInfo}
                                    </a>
                                  ) : (
                                    row.productInfo
                                  )}
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                                  ₹{row.amount.toLocaleString("en-IN")}
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap">
                                  {row.paymentStatus === "confirmed" || row.paymentStatus === "completed" ? (
                                    <Badge className="bg-green-100 text-green-800 border-green-300">
                                      {row.paymentStatus.charAt(0).toUpperCase() + row.paymentStatus.slice(1)}
                                    </Badge>
                                  ) : row.paymentStatus === "pending" ? (
                                    <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">
                                      Pending
                                    </Badge>
                                  ) : row.paymentStatus === "initiated" ? (
                                    <Badge className="bg-blue-100 text-blue-800 border-blue-300">
                                      Initiated
                                    </Badge>
                                  ) : row.paymentStatus === "failed" ? (
                                    <Badge className="bg-red-100 text-red-800 border-red-300">
                                      Failed
                                    </Badge>
                                  ) : (
                                    <Badge className="bg-gray-100 text-gray-800 border-gray-300">
                                      {row.paymentStatus}
                                    </Badge>
                                  )}
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                                  {row.paymentMode === "online" ? (
                                    <Badge className="bg-purple-100 text-purple-800 border-purple-300">
                                      Online
                                    </Badge>
                                  ) : (
                                    <Badge className="bg-blue-100 text-blue-800 border-blue-300">
                                      Offline
                                    </Badge>
                                  )}
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                                  {row.paymentGateway || "-"}
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                                  {row.centerCode}
                                </td>
                              </tr>
                            );
                          });
                        })()
                      ) : (
                        <tr>
                          <td
                            colSpan={14}
                            className="px-6 py-4 text-center text-gray-500"
                          >
                            No payment data found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 