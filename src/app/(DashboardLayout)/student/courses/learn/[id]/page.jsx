'use client';
import React from 'react';
import { Box } from '@mui/material';
import PageContainer from '@/app/(DashboardLayout)/components/container/PageContainer';
import CourseContent from '../../components/CourseContent';

const LearnCoursePage = ({ params }) => {
  return (
    <PageContainer title="Learn Course" description="Access course content and lessons">
      <CourseContent courseId={params.id} />
    </PageContainer>
  );
};

export default LearnCoursePage; 