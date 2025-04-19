'use client';

import React from 'react';
import { Box, Typography, Button, Stack } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import Link from 'next/link';
import CoursesList from './components/CoursesList';

const CoursesPage = () => {
  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4">My Courses</Typography>
        <Link href="/courses/create" passHref>
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<AddIcon />}
          >
            Create New Course
          </Button>
        </Link>
      </Stack>
      <CoursesList />
    </Box>
  );
};

export default CoursesPage;