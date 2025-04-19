'use client';
import React from 'react';
import { Box, Container } from '@mui/material';

const PageContainer = ({ title, description, children, sx = {} }) => {
  return (
    <Box>
      <title>{title}</title>
      <meta name="description" content={description} />
      <Container 
        maxWidth="lg" 
        sx={{ 
          py: 3,
          ...sx 
        }}
      >
        {children}
      </Container>
    </Box>
  );
};

export default PageContainer; 