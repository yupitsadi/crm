'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  HomeIcon, 
  UsersIcon,
  ClipboardDocumentCheckIcon, 
  CreditCardIcon,
  FingerPrintIcon,
  ChartBarIcon,
  ArrowRightOnRectangleIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  
  // Check authentication status on mount and when pathname changes
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      setIsAuthenticated(!!token);
    };
    
    // Initial check
    checkAuth();
    
    // Listen for storage events (when token is added/removed in other tabs)
    window.addEventListener('storage', checkAuth);
    
    // Set up an interval to periodically check auth status
    // This ensures the sidebar state stays in sync with auth state
    const intervalId = setInterval(checkAuth, 1000);
    
    return () => {
      window.removeEventListener('storage', checkAuth);
      clearInterval(intervalId);
    };
  }, [pathname]); // Re-run when pathname changes
  
  // Set sidebar state in localStorage to persist between page refreshes
  useEffect(() => {
    // Check if there's a saved preference
    const savedState = localStorage.getItem('sidebarExpanded');
    if (savedState !== null) {
      setIsExpanded(savedState === 'true');
    }
    
    // Add a listener to detect when the window resizes
    const handleResize = () => {
      // On small screens, collapse the sidebar automatically
      if (window.innerWidth < 768) {
        setIsExpanded(false);
      }
    };
    
    // Initial check
    handleResize();
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Persist sidebar state to localStorage
  useEffect(() => {
    localStorage.setItem('sidebarExpanded', isExpanded.toString());
    
    // Dispatch a custom event for other components to listen for
    window.dispatchEvent(new CustomEvent('sidebarStateChange', { 
      detail: { isExpanded } 
    }));
  }, [isExpanded]);
  
  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    router.push('/login');
  };
  
  // Handle navigation and collapse sidebar on small screens
  const handleNavigation = () => {
    // Only auto-collapse on small screens
    if (window.innerWidth < 768) {
      setIsExpanded(false);
    }
  };

  // Toggle sidebar expansion
  const toggleSidebar = () => {
    setIsExpanded(!isExpanded);
  };
  
  const navigation: NavItem[] = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    { name: 'Workshops', href: '/workshops', icon: UsersIcon },
    { name: 'OTP Verification', href: '/otp-verification', icon: FingerPrintIcon },
    { name: 'Payment Tracking', href: '/payment-tracking', icon: CreditCardIcon },
    { name: 'Attendance', href: '/attendance-marking', icon: ClipboardDocumentCheckIcon },
    { name: 'Analytics', href: '/workshop-analytics', icon: ChartBarIcon },
  ];
  
  // Don't render sidebar if not authenticated
  if (!isAuthenticated) {
    return null;
  }
  
  return (
    <div 
      className={`h-full bg-gray-800 fixed left-0 top-0 text-white transition-all duration-300 ease-in-out z-30 shadow-lg ${isExpanded ? 'w-64' : 'w-16'}`}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      <div className={`flex items-center ${isExpanded ? 'px-6 pt-8 pb-4 justify-start' : 'px-2 py-8 justify-center'}`}>
        <Image 
          src="/Logo.png" 
          alt="Logo" 
          width={isExpanded ? 100 : 40} 
          height={isExpanded ? 100 : 40}
          className="transition-all duration-300 ease-in-out"
        />
        {isExpanded && <h2 className="text-xl font-bold ml-2 transition-opacity duration-300 ease-in-out">Workshop CRM</h2>}
      </div>
      
      <button 
        onClick={toggleSidebar} 
        className="absolute -right-3 top-20 bg-gray-700 p-1.5 rounded-full transform shadow-md hover:bg-gray-600 transition-all"
        aria-label={isExpanded ? "Collapse sidebar" : "Expand sidebar"}
      >
        {isExpanded ? 
          <ChevronLeftIcon className="h-4 w-4 text-white" /> : 
          <ChevronRightIcon className="h-4 w-4 text-white" />
        }
      </button>
      
      <nav className={`mt-5 ${isExpanded ? 'px-3' : 'px-1'} space-y-1`}>
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={handleNavigation}
              className={`
                group flex items-center ${isExpanded ? 'px-2' : 'px-3 justify-center'} py-2 text-sm font-medium rounded-md transition-all duration-200
                ${isActive 
                  ? 'bg-gray-900 text-white' 
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'}
              `}
              title={!isExpanded ? item.name : ''}
            >
              <item.icon
                className={`
                  ${isExpanded ? 'mr-3' : 'mr-0'} flex-shrink-0 h-6 w-6 transition-all duration-200
                  ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-300'}
                `}
                aria-hidden="true"
              />
              <span className={`transition-opacity duration-300 whitespace-nowrap ${isExpanded ? 'opacity-100' : 'opacity-0 absolute'}`}>
                {item.name}
              </span>
            </Link>
          );
        })}
        
        {/* Logout button */}
        <button
          onClick={handleLogout}
          className={`w-full mt-4 group flex items-center ${isExpanded ? 'px-2' : 'px-3 justify-center'} py-2 text-sm font-medium rounded-md text-gray-300 hover:bg-gray-700 hover:text-white transition-all duration-200`}
          title={!isExpanded ? 'Logout' : ''}
        >
          <ArrowRightOnRectangleIcon
            className={`${isExpanded ? 'mr-3' : 'mr-0'} flex-shrink-0 h-6 w-6 text-gray-400 group-hover:text-gray-300 transition-all duration-200`}
            aria-hidden="true"
          />
          <span className={`transition-opacity duration-300 whitespace-nowrap ${isExpanded ? 'opacity-100' : 'opacity-0 absolute'}`}>
            Logout
          </span>
        </button>
      </nav>
    </div>
  );
} 