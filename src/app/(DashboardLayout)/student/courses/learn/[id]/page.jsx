'use client';
import React, { useEffect } from 'react';
import { Box } from '@mui/material';
import PageContainer from '@/app/(DashboardLayout)/components/container/PageContainer';
import CourseContent from '../../components/CourseContent';

const LearnCoursePage = ({ params }) => {
  // Add effect to collapse sidebar when viewing course content
  useEffect(() => {
    // Add a class to the body to indicate we're in full course view
    document.body.classList.add('course-view-mode');
    
    // Try to find the sidebar element and collapse it
    const sidebarElement = document.querySelector('.mainWrapper');
    if (sidebarElement) {
      sidebarElement.classList.add('sidebar-collapsed');
    }
    
    // Cleanup function to remove the class when leaving the page
    return () => {
      document.body.classList.remove('course-view-mode');
      if (sidebarElement) {
        sidebarElement.classList.remove('sidebar-collapsed');
      }
    };
  }, []);
  
  return (
    <PageContainer 
      title="Learn Course" 
      description="Access course content and lessons"
      sx={{ maxWidth: 'xl', px: 0 }}
    >
      <CourseContent courseId={params.id} />
    </PageContainer>
  );
};

export default LearnCoursePage; 