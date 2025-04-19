'use client';
import React from 'react';
import { Typography, Box, Paper, Button } from '@mui/material';
import PageContainer from '@/app/(DashboardLayout)/components/container/PageContainer';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import Link from 'next/link';

const WishlistPage = () => {
  return (
    <PageContainer title="My Wishlist" description="Courses you've saved for later">
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4" fontWeight="bold">
            My Wishlist
          </Typography>
          <Typography variant="subtitle1" color="textSecondary">
            Courses you've saved to check out later
          </Typography>
        </Box>
        <BookmarkIcon sx={{ fontSize: 40, color: 'primary.main' }} />
      </Box>
      
      <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
        <BookmarkIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2, opacity: 0.6 }} />
        <Typography variant="h5" color="text.secondary" gutterBottom>
          Your wishlist is empty
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Browse courses and click the bookmark icon to add them to your wishlist
        </Typography>
        <Link href="/student/courses" passHref>
          <Button variant="contained" color="primary">
            Browse Courses
          </Button>
        </Link>
      </Paper>
    </PageContainer>
  );
};

export default WishlistPage; 