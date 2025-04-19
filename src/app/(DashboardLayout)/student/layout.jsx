'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import { CircularProgress, Box, Typography, Alert } from '@mui/material';

export default function StudentLayout({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Redirect if user is logged in but not a student
    if (!loading && user && user.role !== 'student') {
      router.push('/dashboard');
    }
  }, [loading, user, router]);

  // Show loading while checking
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  // If no user or not student, show error
  if (!user || user.role !== 'student') {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" flexDirection="column" p={4}>
        <Alert severity="error" sx={{ mb: 2 }}>
          Access denied. This section is only for students.
        </Alert>
        <Typography variant="body1">
          You are being redirected...
        </Typography>
      </Box>
    );
  }

  // User is student, show children
  return children;
} 