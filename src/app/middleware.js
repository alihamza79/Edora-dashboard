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
      
      setLoading(false);
    };

    checkRole();
  }, [router, allowedRoles]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return children;
} 