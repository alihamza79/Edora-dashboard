'use client';
import React, { useEffect } from 'react';
import { Box } from '@mui/material';
import PageContainer from '@/app/(DashboardLayout)/components/container/PageContainer';
import CourseContent from '../../components/CourseContent';

const LearnCoursePage = ({ params }) => {
  // Add effect to collapse sidebar when viewing course content
  useEffect(() => {
    // Function to handle collapsing sidebar elements
    const collapseSidebar = () => {
      try {
        // Add a class to the body to indicate we're in full course view
        document.body.classList.add('course-view-mode');
        
        // Try to find all possible sidebar elements
        const sidebarElements = [
          document.querySelector('.mainWrapper'),
          document.querySelector('.MuiDrawer-root'),
          document.querySelector('aside'),
          document.querySelector('.sidebar'),
          document.querySelector('#sidebar-content'),
          document.querySelector('[class*="sidebar"]'),
          document.querySelector('[class*="drawer"]')
        ];
        
        // Apply styles to collapse each found element
        sidebarElements.forEach(element => {
          if (element) {
            element.style.display = 'none';
            element.style.width = '0';
            element.style.maxWidth = '0';
            element.style.visibility = 'hidden';
            element.classList.add('sidebar-collapsed');
          }
        });
        
        // Find main content to expand it
        const mainContent = document.querySelector('main') || document.querySelector('.mainContent');
        if (mainContent) {
          mainContent.style.paddingLeft = '0';
          mainContent.style.marginLeft = '0';
          mainContent.style.width = '100%';
          mainContent.style.maxWidth = '100%';
        }
      } catch (error) {
        console.error('Error collapsing sidebar:', error);
      }
    };
    
    // Call immediately and after a short delay to handle dynamic content
    collapseSidebar();
    const timeoutId = setTimeout(collapseSidebar, 300);
    
    // Cleanup function to restore the sidebar when leaving
    return () => {
      clearTimeout(timeoutId);
      document.body.classList.remove('course-view-mode');
      
      // Try to find all sidebar elements to restore
      const sidebarElements = [
        document.querySelector('.mainWrapper'),
        document.querySelector('.MuiDrawer-root'),
        document.querySelector('aside'),
        document.querySelector('.sidebar'),
        document.querySelector('[class*="sidebar"]'),
        document.querySelector('[class*="drawer"]')
      ];
      
      // Restore each found element
      sidebarElements.forEach(element => {
        if (element) {
          element.style.display = '';
          element.style.width = '';
          element.style.maxWidth = '';
          element.style.visibility = '';
          element.classList.remove('sidebar-collapsed');
        }
      });
      
      // Restore main content layout
      const mainContent = document.querySelector('main') || document.querySelector('.mainContent');
      if (mainContent) {
        mainContent.style.paddingLeft = '';
        mainContent.style.marginLeft = '';
        mainContent.style.width = '';
        mainContent.style.maxWidth = '';
      }
    };
  }, []);
  
  return (
    <PageContainer 
      title="Learn Course" 
      description="Access course content and lessons"
      sx={{ maxWidth: '100%', px: 0 }}
    >
      <CourseContent courseId={params.id} />
    </PageContainer>
  );
};

export default LearnCoursePage; 