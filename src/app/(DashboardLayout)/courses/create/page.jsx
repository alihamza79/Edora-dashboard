'use client';

import React from 'react';
import PageContainer from '@/app/components/container/PageContainer';
import CourseForm from '../components/CourseForm';
import { Typography, Box, Paper } from '@mui/material';

const CreateCoursePage = () => {
  return (
    <PageContainer title="Create New Course" description="Create a new course for your students">
      <Box mb={4}>
        <Typography variant="h4">Create New Course</Typography>
        <Typography variant="subtitle1" color="textSecondary">
          Fill in the details below to create a new course
        </Typography>
      </Box>
      <Paper elevation={3} sx={{ p: 3 }}>
        <CourseForm mode="create" />
      </Paper>
    </PageContainer>
  );
};

export default CreateCoursePage; 