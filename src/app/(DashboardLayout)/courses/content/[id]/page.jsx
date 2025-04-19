'use client';

import React from 'react';
import { Box, Typography, Paper, Button, IconButton, Breadcrumbs } from '@mui/material';
import PageContainer from '@/app/components/container/PageContainer';
import Link from 'next/link';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CourseContentManager from '../components/CourseContentManager';

const CourseContentPage = ({ params }) => {
  const courseId = params.id;

  return (
    <PageContainer title="Course Content Management" description="Manage course videos and materials">
      <Box mb={4} display="flex" alignItems="center">
        <Link href="/courses" passHref>
          <IconButton sx={{ mr: 1 }}>
            <ArrowBackIcon />
          </IconButton>
        </Link>
        <Breadcrumbs aria-label="breadcrumb">
          <Link href="/courses" passHref>
            <Typography color="inherit">Courses</Typography>
          </Link>
          <Typography color="text.primary">Content Management</Typography>
        </Breadcrumbs>
      </Box>

      <Paper elevation={3} sx={{ p: 3 }}>
        <CourseContentManager courseId={courseId} />
      </Paper>
    </PageContainer>
  );
};

export default CourseContentPage; 