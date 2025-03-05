'use client';

import { useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Spinner } from '../ui/spinner';

interface AuthWrapperProps {
  children: ReactNode;
}

export default function AuthWrapper({ children }: AuthWrapperProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  
  useEffect(() => {
    // Public routes that don't require authentication
    const publicRoutes = ['/login', '/signup', '/forgot-password', '/reset-password'];
    
    // Check if user is authenticated
    const token = localStorage.getItem('token');
    const isPublicRoute = publicRoutes.includes(pathname);
    
    if (!token && !isPublicRoute) {
      // Redirect to login if not authenticated and not on a public route
      router.push('/login');
    } else if (token && isPublicRoute) {
      // Redirect to dashboard if authenticated and on a public route
      router.push('/dashboard');
    } else {
      // Set authenticated state
      setIsAuthenticated(!!token);
    }
  }, [pathname, router]);
  
  // Show loading spinner while checking authentication
  if (isAuthenticated === null) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }
  
  // Render children once we know the authentication state
  return <>{children}</>;
} 