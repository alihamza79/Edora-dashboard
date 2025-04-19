'use client';
import React from 'react';
import { Typography, Box } from '@mui/material';
import PageContainer from '@/app/components/container/PageContainer';
import StudentCoursesList from './components/StudentCoursesList';
import SchoolIcon from '@mui/icons-material/School';
import SearchIcon from '@mui/icons-material/Search';

const StudentCoursesPage = () => {
  return (
    <PageContainer title="Browse Courses" description="Search and explore available courses">
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4" fontWeight="bold">
            Browse Courses
          </Typography>
          <Typography variant="subtitle1" color="textSecondary">
            Search and discover courses from our talented instructors - find the perfect course for you
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <SchoolIcon sx={{ fontSize: 40, color: 'primary.main', mr: 1 }} />
          <SearchIcon sx={{ fontSize: 32, color: 'secondary.main' }} />
        </Box>
      </Box>
      <StudentCoursesList />
    </PageContainer>
  );
};

export default StudentCoursesPage; 