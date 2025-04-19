'use client';
import { useEffect } from 'react';
import { CircularProgress, Box } from '@mui/material';
import { useAuth } from '@/app/context/AuthContext';
import { useRouter } from 'next/navigation';

const Dashboard = () => {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      // Redirect based on user role
      if (user.role === 'student') {
        router.push('/student/courses');
      } else if (user.role === 'tutor') {
        router.push('/courses');
      }
      // For other roles, stay on dashboard
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        minHeight="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  // This will rarely be shown as the useEffect will redirect
  return (
    <Box 
      display="flex" 
      justifyContent="center" 
      alignItems="center" 
      minHeight="100vh"
    >
      <CircularProgress />
      <span style={{ marginLeft: '10px' }}>Redirecting you to the right place...</span>
    </Box>
  );
};

export default Dashboard; 