'use client';

import React from 'react';
import { Box, Typography, Paper, Chip, Grid, Button, Divider, Stack } from '@mui/material';
import PageContainer from '@/app/components/container/PageContainer';
import CourseDetails from '../components/CourseDetails';

const CourseDetailPage = ({ params }) => {
  return (
    <PageContainer title="Course Details" description="View course details">
      <CourseDetails courseId={params.id} />
    </PageContainer>
  );
};

export default CourseDetailPage; 