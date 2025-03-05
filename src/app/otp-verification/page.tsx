"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import PageHeader from "@/components/ui/PageHeader";
import { useRouter } from "next/navigation";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ClockIcon } from "@heroicons/react/24/outline";

interface VerificationData {
  id: string;
  workshopId: string | null;
  childNames: string[];
  childAges: number[];
  parentName: string;
  phoneNumber: string;
  otpVerified: boolean;
  workshopDate: string;
  workshopTime: string;
  workshopLocation: string;
  transactionId: string;
  productInfo: string;
  amount: number;
  status: string;
  centerCode: string;
  createdAt: string;
  paymentStatus: string;
  paymentGateway?: string;
}

// Interface for individual child rows
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
  bookingTime: string;
  bookingDate: string;
  productInfo: string;
  amount: number;
  status: string;
  paymentGateway: string;
  createdAt: string;
  isFirstChild: boolean;
  totalChildren: number;
  childIndex: number;
  transactionId: string;
}

// Updated interface for tracker status
interface TrackerStatusItem {
  status: string;
  timestamp?: string;
}

export default function OtpVerificationPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [otpData, setOtpData] = useState<VerificationData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [trackerStatus, setTrackerStatus] = useState<Record<string, TrackerStatusItem>>({});
  const [isSavingTracker, setIsSavingTracker] = useState(false);
  const [dateFilter, setDateFilter] = useState<Date | undefined>(undefined);
  const [sortBy, setSortBy] = useState<string>("none");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [confirmingChildId, setConfirmingChildId] = useState<string | null>(null);
  const router = useRouter();

  // Memoize functions with useCallback
  const fetchTrackerStatus = useCallback(async () => {
    try {
      // Get the JWT token from local storage
      const token =
        localStorage.getItem("token") || sessionStorage.getItem("token");

      if (!token) {
        console.error("Authentication token not found");

        // Fallback to localStorage if not authenticated
        const savedTrackerStatus = localStorage.getItem("otpTrackerStatus");
        if (savedTrackerStatus) {
          setTrackerStatus(JSON.parse(savedTrackerStatus));
        }
        return;
      }

      const response = await fetch("/api/tracker-status", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        console.error("Not authorized to access tracker status");
        // Just use localStorage in this case
        const savedTrackerStatus = localStorage.getItem("otpTrackerStatus");
        if (savedTrackerStatus) {
          setTrackerStatus(JSON.parse(savedTrackerStatus));
        }
        return;
      }

      if (response.ok) {
        const data = await response.json();
        setTrackerStatus(data.trackerStatus || {});
      }
    } catch (err) {
      console.error("Failed to fetch tracker status:", err);

      // Fallback to localStorage if server fetch fails
      const savedTrackerStatus = localStorage.getItem("otpTrackerStatus");
      if (savedTrackerStatus) {
        setTrackerStatus(JSON.parse(savedTrackerStatus));
      }
    }
  }, []);

  // Save tracker status to server
  const saveTrackerStatus = useCallback(async () => {
    try {
      setIsSavingTracker(true);

      // Always save to localStorage as backup
      localStorage.setItem("otpTrackerStatus", JSON.stringify(trackerStatus));

      // Get the JWT token from local storage
      const token =
        localStorage.getItem("token") || sessionStorage.getItem("token");

      if (!token) {
        console.error("Authentication token not found");
        setIsSavingTracker(false);
        return;
      }

      const response = await fetch("/api/tracker-status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ trackerStatus }),
      });

      if (response.status === 401) {
        console.error("Not authorized to save tracker status");
        setIsSavingTracker(false);
        return;
      }

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
    } catch (err) {
      console.error("Failed to save tracker status:", err);
    } finally {
      setIsSavingTracker(false);
    }
  }, [trackerStatus]);

  const fetchOtpVerificationData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Get the JWT token from local storage
      const token =
        localStorage.getItem("token") || sessionStorage.getItem("token");

      if (!token) {
        setError("You must be logged in to view this page");
        setIsLoading(false);
        return;
      }

      const response = await fetch("/api/otp-verification", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        setError(
          "You are not authorized to view this page. Please login with admin or staff credentials."
        );
        setIsLoading(false);
        // Optionally redirect to login page
        setTimeout(() => router.push("/login"), 2000);
        return;
      }

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data = await response.json();
      setOtpData(data.verifications || []);
    } catch (err) {
      console.error("Failed to fetch OTP verification data:", err);
      if (err instanceof Error) {
        setError(`Failed to load OTP verification data: ${err.message}`);
      } else {
        setError(
          "Failed to load OTP verification data. Please try again later."
        );
      }
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchOtpVerificationData();
    fetchTrackerStatus();
  }, [fetchOtpVerificationData, fetchTrackerStatus]);

  // Save tracker status to server (debounced)
  useEffect(() => {
    // Skip initial empty state
    if (Object.keys(trackerStatus).length === 0) return;

    const timeoutId = setTimeout(() => {
      saveTrackerStatus();
    }, 1000); // 1 second debounce

    return () => clearTimeout(timeoutId);
  }, [trackerStatus, saveTrackerStatus]);

  // Format booking time from createdAt - convert UTC to IST (UTC+5:30)
  const formatBookingTime = (createdAt: string) => {
    try {
      // Create a Date object from the createdAt string
      const date = new Date(createdAt);

      // Format to IST time (UTC+5:30)
      return date.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
        timeZone: "Asia/Kolkata", // Indian Standard Time
      });
    } catch (error) {
      console.error("Error formatting booking time:", error);
      return "Invalid Time";
    }
  };

  // Format booking date from createdAt - convert UTC to IST (UTC+5:30)
  const formatBookingDate = (createdAt: string) => {
    try {
      // Create a Date object from the createdAt string
      const date = new Date(createdAt);

      // Format to IST date (UTC+5:30)
      return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        timeZone: "Asia/Kolkata", // Indian Standard Time
      });
    } catch (error) {
      console.error("Error formatting booking date:", error);
      return "Invalid Date";
    }
  };

  // Transform data to show each child individually
  const transformDataToChildRows = (
    data: VerificationData[]
  ): ChildRowData[] => {
    const childRows: ChildRowData[] = [];

    data.forEach((item) => {
      const { childNames, childAges } = item;
      childNames.forEach((childName, idx) => {
        childRows.push({
          id: `${item.id}-${idx}`,
          bookingId: item.id,
          childName,
          childAge: childAges[idx] || 0,
          parentName: item.parentName,
          phoneNumber: item.phoneNumber,
          otpVerified: item.otpVerified,
          workshopDate: item.workshopDate,
          workshopTime: item.workshopTime,
          bookingTime: formatBookingTime(item.createdAt),
          bookingDate: formatBookingDate(item.createdAt),
          productInfo: item.productInfo,
          amount: item.amount,
          status: item.paymentStatus || "Unknown",
          paymentGateway: item.paymentGateway || "N/A",
          createdAt: item.createdAt,
          isFirstChild: idx === 0,
          totalChildren: childNames.length,
          childIndex: idx,
          transactionId: item.transactionId || "N/A",
        });
      });
    });

    return childRows;
  };

  // Filter OTP data based on criteria
  const filteredData = useMemo(() => {
    let filtered = [...otpData];

    // Exclude specific phone numbers
    const excludePhoneNumbers = [
      "9426052435",
      "9571209434",
      "9997386442",
    ];
    filtered = filtered.filter(
      (item) => !excludePhoneNumbers.includes(item.phoneNumber)
    );

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.childNames.some((name) => name.toLowerCase().includes(query)) ||
          item.parentName.toLowerCase().includes(query) ||
          item.phoneNumber.includes(query) ||
          item.productInfo.toLowerCase().includes(query) ||
          (item.transactionId &&
            item.transactionId.toLowerCase().includes(query))
      );
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((item) => {
        if (statusFilter === "verified") return item.otpVerified;
        if (statusFilter === "pending") return !item.otpVerified;
        if (statusFilter === "payment_confirmed")
          return item.paymentStatus === "Confirmed";
        if (statusFilter === "payment_pending")
          return item.paymentStatus === "Pending";
        if (statusFilter === "payment_initiated")
          return item.paymentStatus === "Initiated";
        return true;
      });
    }

    // Apply date filter
    if (dateFilter) {
      const selectedDate = format(dateFilter, "dd/MM/yyyy");
      filtered = filtered.filter((item) => item.workshopDate === selectedDate);
    }

    // Apply sorting
    if (sortBy !== "none") {
      filtered.sort((a, b) => {
        if (sortBy === "date") {
          // Convert date from DD/MM/YYYY to YYYY-MM-DD for proper comparison
          const dateA = a.workshopDate.split("/").reverse().join("-");
          const dateB = b.workshopDate.split("/").reverse().join("-");
          return sortDirection === "asc"
            ? dateA.localeCompare(dateB)
            : dateB.localeCompare(dateA);
        }

        if (sortBy === "time") {
          // Extract hour and minute and convert to 24-hour format for comparison
          const timeA = a.workshopTime;
          const timeB = b.workshopTime;
          return sortDirection === "asc"
            ? timeA.localeCompare(timeB)
            : timeB.localeCompare(timeA);
        }

        return 0;
      });
    }

    return filtered;
  }, [otpData, statusFilter, searchQuery, dateFilter, sortBy, sortDirection]);

  // Change let to const
  const childRows = transformDataToChildRows(filteredData);

  // Modify the handleTrackerChange function
  const handleTrackerChange = (childId: string, status: string) => {
    // If user is trying to mark as done, show confirmation first
    if (status === "done") {
      setConfirmingChildId(childId);
    } else {
      // For other status changes, update immediately
      setTrackerStatus((prev) => ({
        ...prev,
        [childId]: { 
          status: status, 
          timestamp: status === "done" ? new Date().toISOString() : undefined 
        },
      }));
    }
  };

  // Function to confirm and finalize status change
  const confirmStatusChange = (childId: string) => {
    setTrackerStatus((prev) => ({
      ...prev,
      [childId]: { 
        status: "done", 
        timestamp: new Date().toISOString() 
      },
    }));
    setConfirmingChildId(null);
  };

  // Function to cancel status change
  const cancelStatusChange = () => {
    setConfirmingChildId(null);
  };

  // Function to format the timestamp into a readable format
  const formatTimestamp = (timestamp?: string) => {
    if (!timestamp) return "";
    
    try {
      const date = new Date(timestamp);
      return format(date, "MMM dd, yyyy 'at' h:mm a");
    } catch (error) {
      console.error("Error formatting timestamp:", error);
      return "Invalid date";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader pageName="OTP Verification" />
      <div className="flex-1 p-6 transition-all duration-300 ease-in-out">
        <div className="flex flex-col w-full">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">
              OTP Verification
            </h1>
            <p className="text-gray-600">
              View and manage OTP verification status for workshop bookings
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex flex-col md:flex-row md:justify-between mb-6 gap-4">
              <div className="flex flex-col md:flex-row gap-2 items-start md:items-center flex-wrap">
                <Select
                  value={statusFilter}
                  onValueChange={(value) => setStatusFilter(value)}
                >
                  <SelectTrigger className="w-[180px]">
                    <div className="flex items-center">
                      {statusFilter === "all" ? (
                        <span>Filter Status</span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <span className="text-primary">Status:</span>
                          {statusFilter === "verified"
                            ? "OTP Verified"
                            : statusFilter === "pending"
                            ? "OTP Pending"
                            : statusFilter === "payment_confirmed"
                            ? "Payment Confirmed"
                            : statusFilter === "payment_pending"
                            ? "Payment Pending"
                            : "Payment Initiated"}
                        </span>
                      )}
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="verified">OTP Verified</SelectItem>
                    <SelectItem value="pending">OTP Pending</SelectItem>
                    <SelectItem value="payment_confirmed">
                      Payment Confirmed
                    </SelectItem>
                    <SelectItem value="payment_pending">
                      Payment Pending
                    </SelectItem>
                    <SelectItem value="payment_initiated">
                      Payment Initiated
                    </SelectItem>
                  </SelectContent>
                </Select>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-[180px] justify-start"
                    >
                      {dateFilter ? (
                        format(dateFilter, "PPP")
                      ) : (
                        <span>Filter by Date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dateFilter}
                      onSelect={setDateFilter}
                      initialFocus
                    />
                    {dateFilter && (
                      <div className="p-2 border-t border-gray-200">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDateFilter(undefined)}
                          className="w-full"
                        >
                          Clear Date
                        </Button>
                      </div>
                    )}
                  </PopoverContent>
                </Popover>

                <Select
                  value={sortBy}
                  onValueChange={(value) => setSortBy(value)}
                >
                  <SelectTrigger className="w-[220px]">
                    <div className="flex items-center gap-2">
                      {sortBy === "none" ? (
                        <span>Sort by...</span>
                      ) : (
                        <>
                          <span>
                            Sort by:{" "}
                            {sortBy === "date"
                              ? "Workshop Date"
                              : "Workshop Time"}
                          </span>
                          <span className="text-xs bg-primary/10 text-primary px-1 rounded">
                            {sortDirection === "asc" ? "↑ A-Z" : "↓ Z-A"}
                          </span>
                        </>
                      )}
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Sorting</SelectItem>
                    <SelectItem value="date">Sort by Workshop Date</SelectItem>
                    <SelectItem value="time">Sort by Workshop Time</SelectItem>
                  </SelectContent>
                </Select>

                {sortBy !== "none" && (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() =>
                      setSortDirection((prev) =>
                        prev === "asc" ? "desc" : "asc"
                      )
                    }
                    className="h-10 w-10 p-0"
                    title={`Change to ${
                      sortDirection === "asc" ? "descending" : "ascending"
                    } order`}
                  >
                    {sortDirection === "asc" ? "↑" : "↓"}
                  </Button>
                )}

                <Button
                  variant="outline"
                  onClick={fetchOtpVerificationData}
                  className="h-10"
                  title="Refresh data"
                >
                  Refresh
                </Button>
              </div>

              <div className="flex items-center space-x-2">
                <Input
                  placeholder="Search by name or phone"
                  className="w-full md:w-[250px]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Button onClick={() => setSearchQuery("")}>Clear</Button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              {dateFilter && (
                <Badge variant="outline" className="flex items-center gap-1">
                  Date: {format(dateFilter, "PPP")}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4 p-0 text-gray-500 hover:text-gray-900"
                    onClick={() => setDateFilter(undefined)}
                  >
                    ×
                  </Button>
                </Badge>
              )}

              {sortBy !== "none" && (
                <Badge variant="outline" className="flex items-center gap-1">
                  Sorted by:{" "}
                  {sortBy === "date" ? "Workshop Date" : "Workshop Time"} (
                  {sortDirection === "asc" ? "Ascending" : "Descending"})
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
              <div className="text-center py-8">Loading OTP data...</div>
            ) : (
              <div className="overflow-hidden border border-gray-200 rounded-md w-full transition-all duration-300 ease-in-out">
                <div className="overflow-x-auto max-h-[calc(100vh-280px)] overflow-y-auto relative">
                  <table className="min-w-full divide-y divide-gray-200 table-fixed">
                    <thead className="bg-gray-50 sticky top-0 z-10">
                      <tr>
                        <th className="sticky left-0 z-20 bg-gray-50 px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[40px]">
                          S.No
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[130px]">
                          Transaction ID
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[80px]">
                          Phone
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[100px]">
                          Trans. Date/Time
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[120px]">
                          Child Name
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[35px]">
                          Age
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[70px]">
                          OTP
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[90px]">
                          Welcome Call
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[90px]">
                          Workshop Date
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[70px]">
                          Workshop Time
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[130px]">
                          Workshop Theme
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[70px]">
                          Amount
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[90px]">
                          Payment Status
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[90px]">
                          Payment Gateway
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {childRows.length > 0 ? (
                        childRows.map((child, index) => {
                          const isNewBookingGroup =
                            index === 0 ||
                            child.bookingId !== childRows[index - 1].bookingId;
                          const groupStartClass = isNewBookingGroup
                            ? "border-t-2 border-blue-200"
                            : "";
                          const bgColorClass =
                            index % 2 === 0 ? "bg-white" : "bg-gray-50";

                          return (
                            <tr
                              key={child.id}
                              className={`${bgColorClass} ${groupStartClass} hover:bg-gray-100`}
                              title={`Child ${child.childIndex + 1} of ${
                                child.totalChildren
                              } in booking ${child.bookingId}`}
                            >
                              <td className="sticky left-0 z-20 px-2 py-2 whitespace-nowrap text-sm text-gray-900 bg-inherit">
                                {index + 1}
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                                <span className="font-mono text-xs tracking-tighter">
                                  {child.transactionId}
                                </span>
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                                {child.phoneNumber}
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                                <div className="flex flex-col">
                                  <span>{child.bookingDate}</span>
                                  <span className="text-xs text-gray-500">
                                    {child.bookingTime}
                                  </span>
                                </div>
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                                <div className="font-medium">
                                  {child.childName}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {child.totalChildren > 1 &&
                                    `Child ${child.childIndex + 1} of ${
                                      child.totalChildren
                                    }`}
                                </div>
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                                {child.childAge}
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap">
                                {child.otpVerified ? (
                                  <Badge className="bg-green-100 text-green-800 border-green-300">
                                    Verified
                                  </Badge>
                                ) : (
                                  <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">
                                    Pending
                                  </Badge>
                                )}
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap">
                                <div className="flex items-center">
                                  <Select
                                    value={(trackerStatus[child.id]?.status || "pending")}
                                    onValueChange={(value) => handleTrackerChange(child.id, value)}
                                  >
                                    <SelectTrigger
                                      className={`h-8 ${
                                        trackerStatus[child.id]?.status === "done"
                                          ? "border-green-500 bg-green-50"
                                          : "border-yellow-500 bg-yellow-50"
                                      }`}
                                      disabled={trackerStatus[child.id]?.status === "done" || isSavingTracker}
                                    >
                                      <div className="flex items-center">
                                        {trackerStatus[child.id]?.status === "done" ? (
                                          <span className="text-green-600 font-medium">
                                            Done
                                          </span>
                                        ) : (
                                          <span className="text-yellow-600 font-medium">
                                            Pending
                                          </span>
                                        )}
                                      </div>
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="done">
                                        <span className="text-green-600 font-medium">
                                          Done
                                        </span>
                                      </SelectItem>
                                      <SelectItem value="pending">
                                        <span className="text-yellow-600 font-medium">
                                          Pending
                                        </span>
                                      </SelectItem>
                                    </SelectContent>
                                  </Select>
                                  {isSavingTracker && (
                                    <div className="ml-2 h-3 w-3 animate-pulse bg-blue-500 rounded-full" />
                                  )}
                                  {trackerStatus[child.id]?.status === "done" && trackerStatus[child.id]?.timestamp && (
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <div className="ml-2 cursor-help">
                                            <ClockIcon className="h-4 w-4 text-gray-400" />
                                          </div>
                                        </TooltipTrigger>
                                        <TooltipContent side="top" className="bg-gray-800 text-white">
                                          <p className="text-xs">
                                            Marked as done on:
                                            <br />
                                            <span className="font-medium">
                                              {formatTimestamp(trackerStatus[child.id]?.timestamp)}
                                            </span>
                                          </p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  )}
                                </div>
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                                {child.workshopDate}
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                                {child.workshopTime}
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                                {child.productInfo}
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                                ₹{child.amount.toLocaleString("en-IN")}
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap">
                                {child.status === "Confirmed" ? (
                                  <Badge className="bg-green-100 text-green-800 border-green-300">
                                    Confirmed
                                  </Badge>
                                ) : child.status === "Pending" ? (
                                  <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">
                                    Pending
                                  </Badge>
                                ) : child.status === "Initiated" ? (
                                  <Badge className="bg-blue-100 text-blue-800 border-blue-300">
                                    Initiated
                                  </Badge>
                                ) : child.status === "Completed" ? (
                                  <Badge className="bg-green-100 text-green-800 border-green-300">
                                    Completed
                                  </Badge>
                                ) : child.status === "Cancelled" ? (
                                  <Badge className="bg-red-100 text-red-800 border-red-300">
                                    Cancelled
                                  </Badge>
                                ) : (
                                  <Badge className="bg-gray-100 text-gray-800 border-gray-300">
                                    {child.status}
                                  </Badge>
                                )}
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                                {child.paymentGateway}
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td
                            colSpan={13}
                            className="px-6 py-4 text-center text-gray-500"
                          >
                            No OTP verification data found
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

      {/* Add confirmation dialog */}
      {confirmingChildId && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Confirm Status Change</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to mark this welcome call as done? 
              <span className="font-semibold text-red-600 block mt-2">
                This action cannot be undone.
              </span>
            </p>
            <div className="flex justify-end space-x-4">
              <Button variant="outline" onClick={cancelStatusChange}>
                Cancel
              </Button>
              <Button 
                onClick={() => confirmStatusChange(confirmingChildId)}
                className="bg-primary text-white hover:bg-primary/90"
              >
                Confirm
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
