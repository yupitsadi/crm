"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useDebouncedCallback } from "use-debounce";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format, startOfDay, endOfDay, isWithinInterval } from "date-fns";
import PageHeader from "@/components/ui/PageHeader";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ClockIcon } from "@heroicons/react/24/outline";
import { CalendarIcon } from "@heroicons/react/24/outline";
import { cn } from "@/lib/utils";
import { DayPicker } from "react-day-picker";

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
  workshopId?: string;
}

// Updated interface for tracker status
interface TrackerStatusItem {
  status: string;
  createdAt: string;      // When the status was first created
  lastUpdatedAt: string;  // When the status was last changed
}

// Add DateRange interface at the top of the file with other interfaces
interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

// Create a custom CalendarWithRange component at the top of the file after imports
// This ensures the date range is properly styled with start, middle, and end dates
function CalendarWithRange({
  className,
  dateRange,
  setDateRange,
}: {
  className?: string;
  dateRange: DateRange;
  setDateRange: (dateRange: DateRange) => void;
}) {
  // Add state to control the currently displayed month
  const [currentMonth, setCurrentMonth] = useState<Date>(
    dateRange.from || new Date()
  );

  // Handle month change to only advance by one month at a time
  const handleMonthChange = (month: Date) => {
    setCurrentMonth(month);
  };
  
  // Calculate the next month for display purposes
  const nextMonth = new Date(currentMonth);
  nextMonth.setMonth(nextMonth.getMonth() + 1);

  return (
    <div className="calendar-wrapper">
      <div className="flex justify-between items-center mb-2 p-1 bg-indigo-50 rounded-lg">
        <span className="text-sm font-semibold text-indigo-800 px-2">
          {format(currentMonth, 'MMMM yyyy')} — {format(nextMonth, 'MMMM yyyy')}
        </span>
        <div className="flex space-x-1">
          <button 
            onClick={() => {
              const prevMonth = new Date(currentMonth);
              prevMonth.setMonth(prevMonth.getMonth() - 1);
              setCurrentMonth(prevMonth);
            }}
            className="px-2 py-1 bg-white hover:bg-indigo-100 text-indigo-600 rounded-md text-xs flex items-center border border-indigo-200"
            aria-label="Previous month"
          >
            <span className="mr-1">←</span> Prev
          </button>
          <button 
            onClick={() => {
              const nextMonth = new Date(currentMonth);
              nextMonth.setMonth(nextMonth.getMonth() + 1);
              setCurrentMonth(nextMonth);
            }}
            className="px-2 py-1 bg-white hover:bg-indigo-100 text-indigo-600 rounded-md text-xs flex items-center border border-indigo-200"
            aria-label="Next month"
          >
            Next <span className="ml-1">→</span>
          </button>
        </div>
      </div>
      <DayPicker
        mode="range"
        defaultMonth={currentMonth}
        month={currentMonth}
        onMonthChange={handleMonthChange}
        selected={{
          from: dateRange.from,
          to: dateRange.to,
        }}
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
        pagedNavigation={false}
        showOutsideDays={true}
        fixedWeeks={true}
        hideNavigation={true}
        className={cn("rounded-md p-3", className)}
        modifiers={{
          range_start: dateRange.from,
          range_end: dateRange.to,
          range_middle: dateRange.from && dateRange.to ? {
            after: dateRange.from,
            before: dateRange.to
          } : undefined
        }}
        modifiersClassNames={{
          range_start: "rdp-day_range_start",
          range_end: "rdp-day_range_end",
          range_middle: "rdp-day_range_middle",
          selected: "rdp-day_selected"
        }}
      />
      
      {/* Display range information if a range is selected */}
      {dateRange.from && dateRange.to && (
        <div className="mt-2 p-2 bg-indigo-50 rounded-md border border-indigo-100 text-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-indigo-600 rounded-full"></div>
              <span className="text-indigo-900 font-medium">Selected Date Range:</span>
            </div>
            <div className="text-indigo-700 font-bold">
              {format(dateRange.from, "MMM d")} - {format(dateRange.to, "MMM d, yyyy")}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Add a style tag at the top of the component to ensure date range is properly styled
const CustomDateRangeStyles = () => {
  return (
    <style jsx global>{`
      /* Calendar container */
      .calendar-wrapper .rdp {
        --rdp-accent-color: #4f46e5;
        --rdp-background-color: #c7d2fe;
        margin: 0;
      }
      
      /* Hide default calendar navigation and caption */
      .rdp-caption {
        display: none !important;
      }
      
      /* Hide the default navigation bar completely */
      .rdp-nav {
        display: none !important;
      }
      
      /* Make months display side by side */
      .rdp-months {
        display: flex !important;
        flex-direction: row !important;
        justify-content: space-between !important;
        gap: 1rem !important;
      }
      
      /* Ensure each month has proper width */
      .rdp-month {
        margin: 0 !important;
        max-width: calc(50% - 0.5rem) !important;
      }
      
      /* Date Range Picker Styles */
      .rdp-day_range_start,
      .rdp-day_range_end {
        background-color: #4f46e5 !important;
        color: white !important;
        font-weight: bold !important;
        position: relative;
        z-index: 2;
      }
      
      .rdp-day_range_start {
        border-top-left-radius: 0.375rem !important;
        border-bottom-left-radius: 0.375rem !important;
      }
      
      .rdp-day_range_end {
        border-top-right-radius: 0.375rem !important;
        border-bottom-right-radius: 0.375rem !important;
      }
      
      .rdp-day_range_middle {
        background-color: #c7d2fe !important;
        color: #312e81 !important;
        position: relative;
      }
      
      /* Add connecting line for range */
      .rdp-day_range_middle::before {
        content: "";
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: #c7d2fe;
        z-index: -1;
      }
      
      .rdp-day_range_middle:hover {
        background-color: #a5b4fc !important;
        color: #312e81 !important;
      }
      
      .rdp-day_selected {
        background-color: #4f46e5 !important;
        color: white !important;
      }
      
      .rdp-day_today {
        background-color: #ffedd5 !important;
        color: #9a3412 !important;
        border: 1px solid #fdba74 !important;
        font-weight: bold !important;
      }
      
      /* Navigation button styles */
      .rdp-nav_button {
        background-color: #eef2ff;
        color: #4f46e5;
        border-radius: 0.375rem;
        padding: 0.25rem;
        margin: 0 0.25rem;
        width: 2rem;
        height: 2rem;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
      }
      
      .rdp-nav_button:hover {
        background-color: #4f46e5;
        color: white;
      }
      
      /* Add visual indicator for navigation direction */
      .rdp-nav_button_previous::before {
        content: "←";
        font-size: 1rem;
        font-weight: bold;
      }
      
      .rdp-nav_button_next::before {
        content: "→";
        font-size: 1rem;
        font-weight: bold;
      }
      
      /* Make calendar responsive */
      @media (max-width: 768px) {
        .rdp-months {
          flex-direction: column !important;
        }
        
        .rdp-month {
          max-width: 100% !important;
        }
      }
    `}</style>
  );
};

export default function OtpVerificationPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [otpData, setOtpData] = useState<VerificationData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [trackerStatus, setTrackerStatus] = useState<Record<string, TrackerStatusItem>>({});
  const [isSavingTracker, setIsSavingTracker] = useState(false);
  // Add state for tracking the last refresh time
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);
  // Replace single date filter with date range
  const [dateRange, setDateRange] = useState<DateRange>({
    from: undefined,
    to: undefined
  });
  const [sortBy, setSortBy] = useState<string>("none");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [confirmingChildId, setConfirmingChildId] = useState<string | null>(null);
  const [workshopThemes, setWorkshopThemes] = useState<Record<string, string>>({});
  // Add a ref to track when the tracker status was last cleaned
  const lastCleanedRef = useRef<number>(Date.now());
  
  // Add a ref to track if initial fetch has happened
  const initialFetchDoneRef = useRef<boolean>(false);
  // const router = useRouter(); // Commented out as it's currently unused

  // Function to fetch workshop themes by IDs - Define this BEFORE fetchOtpData
  const fetchWorkshopThemes = useCallback(async (workshopIds: string[]) => {
    if (!workshopIds.length) return;
    
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      if (!token) return;
      
      // Only fetch themes for workshops we don't already have
      const missingThemeIds = workshopIds.filter(id => !workshopThemes[id]);
      
      if (missingThemeIds.length === 0) {
        console.log("All workshop themes already cached, skipping fetch");
        return;
      }
      
      console.log(`Fetching themes for ${missingThemeIds.length} workshops`);
      
      // Use the batch API instead of individual requests
      const response = await fetch(`/api/workshop-themes?ids=${missingThemeIds.join(',')}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.themes) {
          setWorkshopThemes(prev => ({
            ...prev,
            ...data.themes
          }));
          console.log(`Fetched ${Object.keys(data.themes).length} workshop themes (${data.cached} from cache, ${data.fetched} from DB)`);
        }
      } else {
        console.error("Failed to fetch workshop themes:", await response.text());
      }
    } catch (error) {
      console.error("Error fetching workshop themes:", error);
    }
  }, [workshopThemes]);

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

  // Now define fetchOtpData after fetchWorkshopThemes is defined
  const fetchOtpData = useCallback(async () => {
    try {
      setIsLoading(true);
      // Get the JWT token from local storage
      const token =
        localStorage.getItem("token") || sessionStorage.getItem("token");

      if (!token) {
        throw new Error("Authentication token not found");
      }

      const response = await fetch("/api/otp-verification", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Handle unauthorized response
      if (response.status === 401) {
        throw new Error("Not authorized to access OTP data");
      }

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const data = await response.json();
      
      if (data.verifications && Array.isArray(data.verifications)) {
        const otpVerifications = data.verifications;
        setOtpData(otpVerifications);
        
        // Extract unique workshop IDs to fetch themes
        const workshopIds = new Set<string>();
        otpVerifications.forEach((verification: VerificationData) => {
          if (verification.workshopId) {
            workshopIds.add(verification.workshopId);
          }
        });
        
        // Fetch workshop themes for each workshop ID
        fetchWorkshopThemes(Array.from(workshopIds));
        
        // Update the last refresh time
        setLastRefreshTime(new Date());
      } else {
        throw new Error("Invalid response format from API");
      }
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch OTP data";
      setError(errorMessage);
      console.error("Error in fetchOtpData:", err);
    } finally {
      setIsLoading(false);
    }
  }, [fetchWorkshopThemes]);

  // Handle refresh button click
  const handleRefresh = useCallback(() => {
    // Add force refresh parameter when manually refreshing
    const refreshOtpData = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem("token") || sessionStorage.getItem("token");
        
        if (!token) {
          throw new Error("Authentication token not found");
        }
        
        // Add refresh=true parameter to bypass cache
        const response = await fetch("/api/otp-verification?refresh=true", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        
        if (response.status === 401) {
          throw new Error("Not authorized to access OTP data");
        }
        
        if (!response.ok) {
          throw new Error(`Server returned ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.verifications && Array.isArray(data.verifications)) {
          setOtpData(data.verifications);
          
          // Extract unique workshop IDs
          const workshopIds = new Set<string>();
          data.verifications.forEach((verification: VerificationData) => {
            if (verification.workshopId) {
              workshopIds.add(verification.workshopId);
            }
          });
          
          // Fetch workshop themes
          fetchWorkshopThemes(Array.from(workshopIds));
          
          // Update refresh time
          setLastRefreshTime(new Date());
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to refresh data";
        setError(errorMessage);
        console.error("Error refreshing OTP data:", err);
      } finally {
        setIsLoading(false);
      }
    };
    
    // Execute refresh functions
    refreshOtpData();
    fetchTrackerStatus();
  }, [fetchWorkshopThemes, fetchTrackerStatus]);

  // Format the last refresh time for display
  const formatRefreshTime = useCallback((date: Date | null) => {
    if (!date) return "Never";
    
    return new Intl.DateTimeFormat('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    }).format(date);
  }, []);

  // This useEffect handles data loading and cleanup
  useEffect(() => {
    // Define the cleanup function to be used for tracker status
    const cleanupTrackerStatus = () => {
      if (Object.keys(trackerStatus).length > 500) {
        // Keep only recent or done items
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        setTrackerStatus(prev => {
          const itemsToKeep = Object.entries(prev)
            .filter(([, data]) => {
              // Keep items that are marked as "done" or were updated recently
              return data.status === "done" || 
                    new Date(data.lastUpdatedAt) >= thirtyDaysAgo;
            })
            .reduce((obj, [key, value]) => ({ ...obj, [key]: value }), {});
          
          console.log(`Cleaned up tracker status state: reduced from ${Object.keys(prev).length} to ${Object.keys(itemsToKeep).length} items`);
          return itemsToKeep;
        });
      }
    };

    // Only fetch data once on initial mount
    if (!initialFetchDoneRef.current) {
      fetchOtpData();
      fetchTrackerStatus();
      initialFetchDoneRef.current = true;
    }
    
    // Set up a periodic cleanup every hour to prevent memory growth
    const cleanupInterval = setInterval(cleanupTrackerStatus, 3600000); // 1 hour
    
    // Cleanup function to clear interval when component unmounts
    return () => {
      clearInterval(cleanupInterval);
    };
    // We intentionally only want this to run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array is intentional - only run on mount

  // Create a properly debounced save function
  const debouncedSaveTrackerStatus = useDebouncedCallback(
    async () => {
      try {
        setIsSavingTracker(true);

        // Clean up localStorage data before saving
        // Only store items that are "done" or are from the last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const localStorageItems = Object.entries(trackerStatus)
          .filter(([, data]) => {
            // Keep items that are either marked as "done" or were updated recently
            return data.status === "done" || 
                  new Date(data.lastUpdatedAt) >= thirtyDaysAgo;
          })
          .reduce((obj, [key, value]) => ({ ...obj, [key]: value }), {});
        
        // Save the cleaned up data to localStorage
        localStorage.setItem("otpTrackerStatus", JSON.stringify(localStorageItems));

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

        // Check if we need to clean up the tracker status
        // Clean if there are too many items or if it's been more than 24 hours
        const MAX_ITEMS = 1000;
        const ONE_DAY_MS = 86400000; // 24 hours in milliseconds
        
        if (Object.keys(trackerStatus).length > MAX_ITEMS ||
            Date.now() - lastCleanedRef.current > ONE_DAY_MS) {
          // Keep only recent items or most active ones
          const itemsToKeep = Object.entries(trackerStatus)
            .sort((a, b) => {
              // Sort by lastUpdatedAt time (most recent first)
              const timeA = new Date(a[1].lastUpdatedAt).getTime();
              const timeB = new Date(b[1].lastUpdatedAt).getTime();
              return timeB - timeA;
            })
            .slice(0, Math.floor(MAX_ITEMS / 2))
            .reduce((obj, [key, value]) => ({ ...obj, [key]: value }), {});
          
          setTrackerStatus(itemsToKeep);
          lastCleanedRef.current = Date.now();
        }
      } catch (err) {
        console.error("Failed to save tracker status:", err);
      } finally {
        setIsSavingTracker(false);
      }
    },
    // Debounce delay: 2000ms (2 seconds) - more efficient than the previous approach
    2000
  );

  // Update effect to use the debounced save function
  useEffect(() => {
    // Skip initial empty state
    if (Object.keys(trackerStatus).length === 0) return;
    
    // Call the debounced save function directly
    debouncedSaveTrackerStatus();
    
    // No need for manual timeout management
  }, [trackerStatus, debouncedSaveTrackerStatus]);

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
          workshopId: item.workshopId || undefined,
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
    if (dateRange.from && dateRange.to) {
      const fromDate = startOfDay(dateRange.from);
      const toDate = endOfDay(dateRange.to);
      
      filtered = filtered.filter((item) => {
        try {
          // Convert the createdAt timestamp (transaction date) to a Date object
          const itemDate = new Date(item.createdAt);
          return isWithinInterval(itemDate, { start: fromDate, end: toDate });
        } catch {
          console.error("Error parsing date:", item.createdAt);
          return false;
        }
      });
    }

    // First apply default sorting by transaction date (most recent first)
    filtered.sort((a, b) => {
      try {
        const dateA = new Date(a.createdAt);
        const dateB = new Date(b.createdAt);
        return dateB.getTime() - dateA.getTime(); // Sort descending (newest first)
      } catch (error) {
        console.error("Error sorting by transaction date:", error);
        return 0;
      }
    });

    // Then apply any explicit sorting options if selected
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
  }, [otpData, statusFilter, searchQuery, dateRange, sortBy, sortDirection]);

  // Change let to const
  const childRows = transformDataToChildRows(filteredData);

  // Modify the handleTrackerChange function
  const handleTrackerChange = (childId: string, status: string) => {
    // If the status is already "done", don't allow changes
    if (trackerStatus[childId]?.status === "done") {
      return; // Prevent any status changes once marked as done
    }
    
    // If user is trying to mark as done, show confirmation first
    if (status === "done") {
      setConfirmingChildId(childId);
    } else {
      // For other status changes (only to "pending"), update normally
      setTrackerStatus((prev) => ({
        ...prev,
        [childId]: { 
          status: status, 
          createdAt: prev[childId]?.createdAt || new Date().toISOString(),
          lastUpdatedAt: new Date().toISOString()
        },
      }));
    }
  };

  // Function to confirm and finalize status change to "done"
  const confirmStatusChange = (childId: string) => {
    // Record the timestamp when marked as done - this is permanent
    const timestamp = new Date().toISOString();
    
    setTrackerStatus((prev) => ({
      ...prev,
      [childId]: { 
        status: "done", 
        createdAt: timestamp, // Record when it was marked as done
        lastUpdatedAt: timestamp // Same as createdAt for "done" status
      },
    }));
    setConfirmingChildId(null);
  };

  // Function to cancel status change
  const cancelStatusChange = () => {
    setConfirmingChildId(null);
  };

  // For showing when the call was made
  const formatCallTime = (trackerItem: TrackerStatusItem) => {
    // Use createdAt for the timestamp when the call was marked as done
    const timestamp = trackerItem?.createdAt;
    
    if (!timestamp) return "Unknown time";
    
    try {
      const date = new Date(timestamp);
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return "Invalid date";
      }
      
      // Format the date in a user-friendly way
      return format(date, "MMM dd, yyyy 'at' h:mm a");
    } catch (error) {
      console.error("Error formatting call time:", error);
      return "Invalid date format";
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader pageName="OTP Verification" />
      <CustomDateRangeStyles />
      <div className="flex-1 p-6 transition-all duration-300 ease-in-out">
        <div className="flex flex-col w-full">
          <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between">
            <div>
              
              <div className="mt-3 flex items-center space-x-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleRefresh}
                  disabled={isLoading}
                  className="flex items-center space-x-1"
                >
                  {isLoading ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
                      <span>Refreshing...</span>
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-refresh-cw">
                        <polyline points="23 4 23 10 17 10"></polyline>
                        <polyline points="1 20 1 14 7 14"></polyline>
                        <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
                      </svg>
                      <span>Refresh</span>
                    </>
                  )}
                </Button>
                <div className="text-sm text-gray-500">
                  Last refreshed: <span className="font-medium">{formatRefreshTime(lastRefreshTime)}</span>
                </div>
              </div>
            </div>
            {/* Empty div to maintain layout - removing the original refresh button section */}
            <div className="mt-3 md:mt-0"></div>
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
                              <span className="text-xs text-gray-500">Transaction Date</span>
                              <span>Select Date Range</span>
                            </div>
                          </div>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent 
                      className="w-auto sm:min-w-[500px] md:min-w-[600px] lg:min-w-[700px] p-4 border-2 border-indigo-200 bg-white shadow-lg shadow-indigo-100/40 rounded-xl" 
                      align="start"
                      sideOffset={5}
                    >
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <h4 className="font-medium text-sm text-indigo-900">Select Transaction Date Range</h4>
                          <p className="text-xs text-indigo-600">
                            Filter bookings by when they were created
                          </p>
                        </div>
                        <div className="flex flex-col">
                          <div className="grid gap-2">
                            <div className="bg-white p-1 rounded-lg border border-indigo-100 overflow-visible">
                              <CalendarWithRange
                                className={`${dateRange.from && dateRange.to ? 'border-indigo-300 bg-indigo-50 text-indigo-900 hover:bg-indigo-100' : ''}`}
                                dateRange={dateRange}
                                setDateRange={setDateRange}
                              />
                            </div>
                          </div>
                          {dateRange.from && dateRange.to && (
                            <div className="flex justify-between items-center mt-4 bg-indigo-50 p-2 rounded-md border border-indigo-100">
                              <div className="text-sm text-indigo-900">
                                <span className="font-medium">Selected: </span>
                                <span className="font-bold">{format(dateRange.from, "MMM d")} - {format(dateRange.to, "MMM d, yyyy")}</span>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                className="border-indigo-200 hover:bg-indigo-100 text-indigo-700"
                                onClick={() => {
                                  setDateRange({ from: undefined, to: undefined });
                                }}
                              >
                                Clear
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <Select
                    value={sortBy}
                    onValueChange={(value) => setSortBy(value)}
                  >
                    <SelectTrigger className="w-[180px]">
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
                      <SelectItem value="date">Workshop Date</SelectItem>
                      <SelectItem value="time">Workshop Time</SelectItem>
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

              <div className="w-full md:w-auto md:self-start">
                <Input
                  placeholder="Search by name, phone, transaction ID"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full md:w-[320px]"
                />
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
              <div className="text-center py-8">
                <div className="inline-flex items-center justify-center">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
                  <span className="ml-3 text-lg font-medium text-gray-700">
                    Loading OTP data...
                  </span>
                </div>
              </div>
            ) : (
              <div className="overflow-hidden border border-gray-200 rounded-md w-full transition-all duration-300 ease-in-out">
                <div className="overflow-x-auto max-h-[calc(100vh-280px)] overflow-y-auto relative scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100">
                  <table className="w-full divide-y divide-gray-200" style={{ paddingRight: "24px", minWidth: "1400px" }}>
                    <thead className="bg-gray-50 sticky top-0 z-10">
                      <tr>
                        <th className="sticky left-0 z-20 bg-gray-50 px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[40px]">
                          S.No
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[130px]">
                          Transaction ID
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[110px]">
                          Phone
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[120px]">
                          Trans. Date/Time
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[140px]">
                          Child Name
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[50px]">
                          Age
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[80px]">
                          OTP
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[120px]">
                          Welcome Call
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
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[140px] pr-6">
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
                                      className={`h-8 w-full min-w-[90px] ${
                                        trackerStatus[child.id]?.status === "done"
                                          ? "border-green-500 bg-green-50"
                                          : "border-yellow-500 bg-yellow-50"
                                      }`}
                                      disabled={trackerStatus[child.id]?.status === "done" || isSavingTracker}
                                    >
                                      <div className="flex items-center justify-center">
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
                                  {trackerStatus[child.id]?.status === "done" && trackerStatus[child.id]?.createdAt && (
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
                                              {formatCallTime(trackerStatus[child.id])}
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
                                {child.workshopId ? (
                                  <a 
                                    href={`https://workshops.geniuslabs.live/${child.workshopId}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:text-blue-800 hover:underline"
                                  >
                                    {workshopThemes[child.workshopId] || child.productInfo}
                                  </a>
                                ) : (
                                  child.productInfo
                                )}
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
                              <td className="px-3 py-2 pr-6 whitespace-nowrap text-sm text-gray-900">
                                {child.paymentGateway || "-"}
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td
                            colSpan={14}
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
