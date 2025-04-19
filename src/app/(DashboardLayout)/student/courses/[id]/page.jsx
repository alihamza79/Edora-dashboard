'use client';
import React from 'react';
import { Box } from '@mui/material';
import PageContainer from '@/app/(DashboardLayout)/components/container/PageContainer';
import StudentCourseDetails from '../components/StudentCourseDetails';

const CourseDetailsPage = ({ params }) => {
  return (
    <PageContainer title="Course Details" description="View course details and enroll">
      <StudentCourseDetails courseId={params.id} />
    </PageContainer>
  );
};

export default CourseDetailsPage; 