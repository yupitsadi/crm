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
  const [sortBy, setSortBy] = useState<string>("none");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [otpFilter, setOtpFilter] = useState<string>("all");
  
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
    let childRows = transformBookingsToChildRows(bookings);
    
    // Exclude specific phone numbers
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
    
    childRows = childRows.filter(row => !excludePhoneNumbers.includes(row.phoneNumber));
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      childRows = childRows.filter(row => 
        row.childName.toLowerCase().includes(query) ||
        row.parentName.toLowerCase().includes(query) ||
        row.phoneNumber.includes(query) ||
        row.productInfo.toLowerCase().includes(query) ||
        row.transactionId.toLowerCase().includes(query) ||
        row.referenceId.toLowerCase().includes(query)
      );
    }
    
    // Apply payment status filter
    if (statusFilter !== "all") {
      childRows = childRows.filter(row => 
        statusFilter === "confirmed" ? row.paymentStatus === "confirmed" :
        statusFilter === "completed" ? row.paymentStatus === "completed" :
        statusFilter === "failed" ? row.paymentStatus === "failed" : true
      );
    }
    
    // Apply payment mode filter
    if (paymentModeFilter !== "all") {
      childRows = childRows.filter(row => row.paymentMode === paymentModeFilter);
    }
    
    // Apply OTP verification filter
    if (otpFilter !== "all") {
      childRows = childRows.filter(row => 
        otpFilter === "verified" ? row.otpVerified :
        otpFilter === "pending" ? !row.otpVerified : true
      );
    }
    
    // Apply date range filter
    if (dateRange.from && dateRange.to) {
      const start = new Date(dateRange.from);
      start.setHours(0, 0, 0, 0);
      
      const end = new Date(dateRange.to);
      end.setHours(23, 59, 59, 999);
      
      childRows = childRows.filter(row => {
        const bookingDate = new Date(row.createdAt);
        return bookingDate >= start && bookingDate <= end;
      });
    }
    
    // Apply sorting
    if (sortBy !== "none") {
      childRows.sort((a, b) => {
        let comparison = 0;
        
        if (sortBy === "date") {
          // Sort by workshop date
          const dateA = new Date(a.workshopDate);
          const dateB = new Date(b.workshopDate);
          comparison = dateA.getTime() - dateB.getTime();
        } else if (sortBy === "time") {
          // Sort by workshop time
          comparison = a.workshopTime.localeCompare(b.workshopTime);
        } else if (sortBy === "amount") {
          // Sort by payment amount
          comparison = a.amount - b.amount;
        } else if (sortBy === "payment") {
          // Sort by payment status
          comparison = a.paymentStatus.localeCompare(b.paymentStatus);
        }
        
        // Apply sort direction
        return sortDirection === "asc" ? comparison : -comparison;
      });
    }
    
    return childRows;
  }, [bookings, searchQuery, statusFilter, paymentModeFilter, otpFilter, dateRange, sortBy, sortDirection, transformBookingsToChildRows]); // Add transformBookingsToChildRows back

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader pageName="Payment Tracking" />
      <div className="flex-1 p-6 transition-all duration-300 ease-in-out">
        <div className="flex flex-col w-full">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">
              Payment Tracking
            </h1>
            <p className="text-gray-600">
              Track and manage all workshop booking payments
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex flex-col md:flex-row gap-2 items-start md:items-center flex-wrap md:mr-auto">
                <div className="flex flex-col sm:flex-row gap-2">
                  <Select
                    value={statusFilter}
                    onValueChange={(value) => setStatusFilter(value)}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Payment Status" />
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
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Payment Mode" />
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
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="OTP Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All OTP Status</SelectItem>
                      <SelectItem value="verified">OTP Verified</SelectItem>
                      <SelectItem value="pending">OTP Pending</SelectItem>
                    </SelectContent>
                  </Select>

                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={`w-[220px] justify-start ${dateRange.from && dateRange.to ? 'border-indigo-300 bg-indigo-50 text-indigo-900 hover:bg-indigo-100' : ''}`}
                      >
                        {dateRange.from && dateRange.to ? (
                          <div className="flex items-center">
                            <CalendarIcon className="mr-2 h-4 w-4 text-indigo-600" />
                            <span>
                              {format(dateRange.from, "MMM d")} - {format(dateRange.to, "MMM d, yyyy")}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            <div className="flex flex-col items-start text-left">
                              <span className="text-xs text-gray-500">Booking Date</span>
                              <span>Select Date Range</span>
                            </div>
                          </div>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent 
                      className="w-auto p-0" 
                      align="start"
                    >
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
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="w-full md:w-auto md:self-start flex flex-col sm:flex-row gap-2">
                <Input
                  placeholder="Search by name, phone, transaction ID"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full md:w-[320px]"
                />
                <Select
                  value={sortBy}
                  onValueChange={setSortBy}
                >
                  <SelectTrigger className="w-[180px]">
                    <div className="flex items-center justify-between">
                      <span>
                        {sortBy === "none"
                          ? "Sort By"
                          : sortBy === "date"
                          ? "Workshop Date"
                          : sortBy === "time"
                          ? "Workshop Time"
                          : sortBy === "amount"
                          ? "Amount"
                          : "Payment Status"}
                      </span>
                      {sortBy !== "none" && (
                        <span className="text-xs bg-primary/10 text-primary px-1 rounded">
                          {sortDirection === "asc" ? "↑ A-Z" : "↓ Z-A"}
                        </span>
                      )}
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Sorting</SelectItem>
                    <SelectItem value="date">Workshop Date</SelectItem>
                    <SelectItem value="time">Workshop Time</SelectItem>
                    <SelectItem value="amount">Amount</SelectItem>
                    <SelectItem value="payment">Payment Status</SelectItem>
                  </SelectContent>
                </Select>

                {sortBy !== "none" && (
                  <Button
                    variant="outline"
                    size="default"
                    onClick={() =>
                      setSortDirection(
                        sortDirection === "asc" ? "desc" : "asc"
                      )
                    }
                    className="w-[100px] flex justify-between items-center"
                  >
                    {sortDirection === "asc" ? "Ascending" : "Descending"}
                    <span className="text-xs">
                      {sortDirection === "asc" ? "↑" : "↓"}
                    </span>
                  </Button>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              {dateRange.from && dateRange.to && (
                <Badge variant="outline" className="flex items-center gap-1 bg-indigo-100 border-indigo-300 text-indigo-800">
                  <CalendarIcon className="h-3 w-3 mr-1 text-indigo-600" />
                  Transaction Date: 
                  <span className="font-semibold ml-1">
                    {format(dateRange.from, "MMM d")}
                  </span>
                  <span className="mx-1">-</span>
                  <span className="font-semibold">
                    {format(dateRange.to, "MMM d, yyyy")}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4 p-0 ml-1 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-200"
                    onClick={() => {
                      setDateRange({ from: undefined, to: undefined });
                    }}
                  >
                    ×
                  </Button>
                </Badge>
              )}

              {statusFilter !== "all" && (
                <Badge variant="outline" className="flex items-center gap-1 bg-blue-100 border-blue-300 text-blue-800">
                  Payment Status: {statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4 p-0 ml-1 text-blue-600 hover:text-blue-800 hover:bg-blue-200"
                    onClick={() => {
                      setStatusFilter("all");
                    }}
                  >
                    ×
                  </Button>
                </Badge>
              )}

              {paymentModeFilter !== "all" && (
                <Badge variant="outline" className="flex items-center gap-1 bg-purple-100 border-purple-300 text-purple-800">
                  Payment Mode: {paymentModeFilter.charAt(0).toUpperCase() + paymentModeFilter.slice(1)}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4 p-0 ml-1 text-purple-600 hover:text-purple-800 hover:bg-purple-200"
                    onClick={() => {
                      setPaymentModeFilter("all");
                    }}
                  >
                    ×
                  </Button>
                </Badge>
              )}

              {otpFilter !== "all" && (
                <Badge variant="outline" className="flex items-center gap-1 bg-amber-100 border-amber-300 text-amber-800">
                  OTP: {otpFilter === "verified" ? "Verified" : "Pending"}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4 p-0 ml-1 text-amber-600 hover:text-amber-800 hover:bg-amber-200"
                    onClick={() => {
                      setOtpFilter("all");
                    }}
                  >
                    ×
                  </Button>
                </Badge>
              )}

              {sortBy !== "none" && (
                <Badge variant="outline" className="flex items-center gap-1">
                  Sorted by:{" "}
                  {sortBy === "date" 
                    ? "Workshop Date" 
                    : sortBy === "time" 
                    ? "Workshop Time" 
                    : sortBy === "amount" 
                    ? "Amount" 
                    : "Payment Status"}
                  ({sortDirection === "asc" ? "Ascending" : "Descending"})
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4 p-0 text-gray-500 hover:text-gray-900"
                    onClick={() => setSortBy("none")}
                  >
                    ×
                  </Button>
                </Badge>
              )}
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
                <div className="overflow-x-auto max-h-[calc(100vh-280px)] overflow-y-auto">
                  <table className="w-full divide-y divide-gray-200" style={{ minWidth: "1400px" }}>
                    <thead className="bg-gray-50 sticky top-0 z-10">
                      <tr>
                        <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[40px]">
                          S.No
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[130px]">
                          Transaction ID
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