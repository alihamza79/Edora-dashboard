'use client';
import { useEffect } from 'react';
import { CircularProgress, Box } from '@mui/material';
import { useAuth } from '@/app/context/AuthContext';
import { useRouter } from 'next/navigation';

const Dashboard = () => {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Handle redirection after auth is loaded
    if (!loading) {
      if (!user) {
        // If not logged in, hard redirect to login page
        window.location.href = '/auth/login';
        return;
      }

      // Check for the current URL to avoid infinite redirect loops
      const currentPath = window.location.pathname;
      if (currentPath === '/dashboard') {
        // Hard redirect based on role to ensure a clean state
        if (user.role === 'student') {
          window.location.href = '/student/dashboard';
        } else if (user.role === 'tutor') {
          window.location.href = '/teacher/dashboard';
        } else {
          // For other roles or if role is undefined, use default dashboard
          window.location.href = '/courses';
        }
      }
    }
  }, [user, loading]);

  return (
    <Box 
      display="flex" 
      justifyContent="center" 
      alignItems="center" 
      flexDirection="column"
      minHeight="80vh"
    >
      <CircularProgress size={40} />
      <Box mt={2}>
        <span>Redirecting to your dashboard...</span>
      </Box>
    </Box>
  );
};

export default Dashboard; 