'use client';
import React from 'react';
import { Typography, Box, Button } from '@mui/material';
import PageContainer from '@/app/components/container/PageContainer';
import StudentCoursesList from './components/StudentCoursesList';
import SchoolIcon from '@mui/icons-material/School';

const StudentCoursesPage = () => {
  return (
    <PageContainer title="Browse Courses" description="Browse all available courses">
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4" fontWeight="bold">
            Browse Courses
          </Typography>
          <Typography variant="subtitle1" color="textSecondary">
            Discover and enroll in courses from our talented instructors
          </Typography>
        </Box>
        <SchoolIcon sx={{ fontSize: 40, color: 'primary.main' }} />
      </Box>
      <StudentCoursesList />
    </PageContainer>
  );
};

export default StudentCoursesPage; 