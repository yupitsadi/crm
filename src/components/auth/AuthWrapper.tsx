'use client';

import { useState, useEffect, ReactNode, useCallback, createContext, useContext, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Spinner } from '../ui/spinner';
import { auth, TokenPayload } from '@/lib/auth';

// Define context types
interface AuthContextType {
  user: TokenPayload | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, userData: UserData) => void;
  logout: () => void;
  refreshSession: () => Promise<boolean>;
}

// Define user data interface
interface UserData {
  id: string;
  email: string;
  role: string;
  firstName: string;
  lastName: string;
  refreshToken?: string;
  [key: string]: unknown;
}

// Create context with default values
const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: () => {},
  logout: () => {},
  refreshSession: async () => false,
});

// Export hook for using auth context
export const useAuth = () => useContext(AuthContext);

interface AuthWrapperProps {
  children: ReactNode;
}

export default function AuthWrapper({ children }: AuthWrapperProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<TokenPayload | null>(null);
  
  // Use refs to prevent dependency cycles
  const isInitialMount = useRef(true);
  const isRefreshing = useRef(false);
  
  // Public routes that don't require authentication
  const publicRoutes = ['/login', '/signup', '/forgot-password', '/reset-password'];
  const isPublicRoute = publicRoutes.includes(pathname || '');
  
  // Function to refresh the access token
  const refreshSession = useCallback(async (): Promise<boolean> => {
    // Prevent multiple simultaneous refresh attempts
    if (isRefreshing.current) return false;
    
    try {
      isRefreshing.current = true;
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) return false;
      
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });
      
      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('token', data.token);
        
        if (data.refreshToken) {
          localStorage.setItem('refreshToken', data.refreshToken);
        }
        
        const userData = auth.getUserFromToken(data.token);
        if (userData) {
          setUser(userData);
          setIsAuthenticated(true);
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error('Error refreshing session:', error);
      return false;
    } finally {
      isRefreshing.current = false;
    }
  }, []);
  
  // Function to login
  const login = useCallback((token: string, userData: UserData) => {
    localStorage.setItem('token', token);
    if (userData.refreshToken) {
      localStorage.setItem('refreshToken', userData.refreshToken);
    }
    
    // Store minimal user data
    localStorage.setItem('user', JSON.stringify({
      id: userData.id,
      email: userData.email,
      role: userData.role,
      firstName: userData.firstName,
      lastName: userData.lastName,
    }));
    
    const tokenUser = auth.getUserFromToken(token);
    setUser(tokenUser);
    setIsAuthenticated(true);
  }, []);
  
  // Function to logout
  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    sessionStorage.clear();
    
    setUser(null);
    setIsAuthenticated(false);
    
    router.push('/login');
  }, [router]);
  
  // Initial authentication check only runs once
  useEffect(() => {
    // Skip if not initial mount to prevent infinite loops
    if (!isInitialMount.current) return;
    isInitialMount.current = false;
    
    const checkAuth = async () => {
      try {
        // Get token from storage
        const token = localStorage.getItem('token');
        
        if (!token) {
          // No token, not authenticated
          setIsAuthenticated(false);
          setUser(null);
          
          // If not on public route, redirect to login
          if (!isPublicRoute) {
            router.push('/login');
          }
        } else if (!auth.isTokenExpired(token)) {
          // Valid token, set authenticated
          const userData = auth.getUserFromToken(token);
          setUser(userData);
          setIsAuthenticated(true);
          
          // If on public route, redirect to dashboard
          if (isPublicRoute) {
            router.push('/dashboard');
          }
        } else {
          // Token expired, try refresh
          const success = await refreshSession();
          
          if (!success && !isPublicRoute) {
            // Failed to refresh and not on public route, redirect to login
            router.push('/login');
          }
        }
      } catch (error) {
        console.error('Auth check error:', error);
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
    // This effect should only run once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // Handle redirect when pathname changes
  useEffect(() => {
    // Skip during initial loading
    if (isLoading) return;
    
    // Handle redirects based on authentication state and current route
    if (isAuthenticated && isPublicRoute) {
      router.push('/dashboard');
    } else if (!isAuthenticated && !isPublicRoute) {
      router.push('/login');
    }
  }, [isAuthenticated, isPublicRoute, isLoading, router]);
  
  // Token refresh interval
  useEffect(() => {
    // Skip if not authenticated
    if (!isAuthenticated) return;
    
    // Function to check token expiration
    const checkTokenExpiration = () => {
      const token = localStorage.getItem('token');
      if (token && auth.isTokenAboutToExpire(token)) {
        refreshSession().catch(console.error);
      }
    };
    
    // Set up interval
    const intervalId = setInterval(checkTokenExpiration, 5 * 60 * 1000);
    
    // Clean up on unmount
    return () => clearInterval(intervalId);
  }, [isAuthenticated, refreshSession]);
  
  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }
  
  // Provide auth context to children
  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        login,
        logout,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
} 