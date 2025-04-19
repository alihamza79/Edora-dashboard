'use client';
import React from 'react';
import { Typography, Box } from '@mui/material';
import PageContainer from '@/app/(DashboardLayout)/components/container/PageContainer';
import EnrolledCoursesList from './components/EnrolledCoursesList';
import SchoolIcon from '@mui/icons-material/School';

const EnrolledCoursesPage = () => {
  return (
    <PageContainer title="My Enrolled Courses" description="View your enrolled courses">
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4" fontWeight="bold">
            My Enrolled Courses
          </Typography>
          <Typography variant="subtitle1" color="textSecondary">
            Continue your learning journey with these courses
          </Typography>
        </Box>
        <SchoolIcon sx={{ fontSize: 40, color: 'primary.main' }} />
      </Box>
      <EnrolledCoursesList />
    </PageContainer>
  );
};

export default EnrolledCoursesPage; 