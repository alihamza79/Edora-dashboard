'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import { CircularProgress, Box, Typography, Alert } from '@mui/material';

export default function TutorLayout({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Redirect if user is logged in but not a tutor
    if (!loading && user && user.role !== 'tutor') {
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

  // If no user or not tutor, show error
  if (!user || user.role !== 'tutor') {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" flexDirection="column" p={4}>
        <Alert severity="error" sx={{ mb: 2 }}>
          Access denied. This section is only for tutors.
        </Alert>
        <Typography variant="body1">
          You are being redirected...
        </Typography>
      </Box>
    );
  }

  // User is tutor, show children
  return children;
} 