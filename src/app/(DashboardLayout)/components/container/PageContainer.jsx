'use client';
import React from 'react';
import { Box, Container } from '@mui/material';

const PageContainer = ({ title, description, children, sx = {} }) => {
  // Check if we should apply full width styles based on the path
  const isCourseLearnPage = typeof window !== 'undefined' && 
    window.location.pathname.includes('/student/courses/learn/');

  return (
    <Box className={isCourseLearnPage ? 'full-width-container' : ''}>
      <title>{title}</title>
      <meta name="description" content={description} />
      <Container 
        maxWidth={isCourseLearnPage ? 'xl' : 'lg'} 
        sx={{ 
          py: 3,
          ...(isCourseLearnPage && {
            px: {xs: 1, md: 2},
            maxWidth: '100% !important',
          }),
          ...sx 
        }}
        className={isCourseLearnPage ? 'course-learn-container' : ''}
      >
        {children}
      </Container>
    </Box>
  );
};

export default PageContainer; 