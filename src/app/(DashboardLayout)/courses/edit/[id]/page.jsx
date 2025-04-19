'use client';

import React from 'react';
import PageContainer from '@/app/components/container/PageContainer';
import CourseForm from '../../components/CourseForm';
import { Typography, Box, Paper } from '@mui/material';

const EditCoursePage = ({ params }) => {
  return (
    <PageContainer title="Edit Course" description="Edit your course details">
      <Box mb={4}>
        <Typography variant="h4">Edit Course</Typography>
        <Typography variant="subtitle1" color="textSecondary">
          Update your course information below
        </Typography>
      </Box>
      <Paper elevation={3} sx={{ p: 3 }}>
        <CourseForm mode="edit" courseId={params.id} />
      </Paper>
    </PageContainer>
  );
};

export default EditCoursePage; 