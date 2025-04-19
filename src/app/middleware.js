'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { checkAuth } from '@/appwrite/Services/authServices';

// List of public routes that don't require authentication
const publicRoutes = [
  '/auth/auth1/login',
  '/auth/auth1/register',
  '/auth/auth1/forgot-password',
];

// List of allowed routes/directories
const allowedRoutes = [
  '/student',
  '/courses',
  '/dashboard',
  '/teacher',
  // Include auth routes as they're needed for login
  '/auth',
  // Include API routes for functionality
  '/api',
  // Include root page
  '/'
];

// Explicitly restricted paths from the template that should be redirected
const explicitlyRestrictedPaths = [
  '/apps',
  '/ui-components',
  '/theme-pages',
  '/tables',
  '/sample-page',
  '/react-tables',
  '/charts',
  '/dashboards',
  '/forms',
  '/icons',
  '/widgets'
];

// Function to check if a path is allowed
const isPathAllowed = (path) => {
  // Always allow public routes
  if (publicRoutes.includes(path)) return true;
  
  // Check if path is explicitly restricted
  if (explicitlyRestrictedPaths.some(restrictedPath => path.startsWith(restrictedPath))) {
    return false;
  }
  
  // Check if the path starts with any of the allowed routes
  return allowedRoutes.some(route => path.startsWith(route));
};

export function AuthMiddleware({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuthentication = async () => {
      const isAuthenticated = await checkAuth();
      const isPublicRoute = publicRoutes.includes(pathname);

      if (!isAuthenticated && !isPublicRoute) {
        // Not authenticated and trying to access a protected route
        router.push('/auth/auth1/login');
      } else if (isAuthenticated && isPublicRoute) {
        // Already authenticated but trying to access auth pages
        const userType = localStorage.getItem('userType') || 'student';
        router.push(userType === 'tutor' ? '/dashboard/tutor' : '/dashboard/student');
      } else if (isAuthenticated && !isPathAllowed(pathname)) {
        // Path is not in the allowed list, redirect to dashboard
        const userType = localStorage.getItem('userType') || 'student';
        router.push(userType === 'tutor' ? '/dashboard/tutor' : '/dashboard/student');
      }
      
      setLoading(false);
    };

    checkAuthentication();
  }, [pathname, router]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return children;
}

export function RoleMiddleware({ children, allowedRoles = [] }) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkRole = async () => {
      const isAuthenticated = await checkAuth();
      
      if (!isAuthenticated) {
        router.push('/auth/auth1/login');
        return;
      }
      
      const userType = localStorage.getItem('userType');
      
      if (allowedRoles.length > 0 && !allowedRoles.includes(userType)) {
        // User doesn't have the required role
        router.push(userType === 'tutor' ? '/dashboard/tutor' : '/dashboard/student');
      }
      
      // Check if the path is allowed
      if (!isPathAllowed(pathname)) {
        router.push(userType === 'tutor' ? '/dashboard/tutor' : '/dashboard/student');
      }
      
      setLoading(false);
    };

    checkRole();
  }, [router, allowedRoles, pathname]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return children;
} 