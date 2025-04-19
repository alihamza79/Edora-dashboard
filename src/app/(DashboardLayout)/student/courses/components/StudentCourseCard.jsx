'use client';
import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  CardActions,
  Button,
  Box,
  Chip,
  CardMedia,
  Divider,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import Link from 'next/link';

const StudentCourseCard = ({ course }) => {
  // Default image if no thumbnail is available
  const thumbnailUrl = course.thumbnail 
    ? course.thumbnail 
    : 'https://via.placeholder.com/300x200?text=Course+Thumbnail';

  // Format price
  const formattedPrice = course.price ? `$${parseFloat(course.price).toFixed(2)}` : 'Free';

  // Format date
  const formattedDate = new Date(course.$createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <Card 
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        transition: 'all 0.3s',
        '&:hover': {
          transform: 'translateY(-5px)',
          boxShadow: '0 10px 20px rgba(0,0,0,0.1)',
        }
      }}
    >
      <Box sx={{ height: 200, overflow: 'hidden', position: 'relative' }}>
        <CardMedia
          component="img"
          sx={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center',
          }}
          image={thumbnailUrl}
          alt={course.title}
        />
      </Box>
      <CardContent sx={{ flexGrow: 1, pb: 1 }}>
        <Typography gutterBottom variant="h5" component="div" noWrap>
          {course.title}
        </Typography>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
          <Chip 
            label={formattedPrice} 
            color={course.price ? "primary" : "success"} 
            size="small" 
            variant="outlined"
          />
          <Typography variant="caption" color="text.secondary">
            Created: {formattedDate}
          </Typography>
        </Box>
        <Typography 
          variant="body2" 
          color="text.secondary" 
          sx={{ 
            mb: 1,
            height: '40px', 
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            textOverflow: 'ellipsis',
          }}
        >
          {course.description}
        </Typography>
        <Box display="flex" flexWrap="wrap" gap={0.5}>
          {course.tags && course.tags.split(',').map((tag, index) => (
            <Chip 
              key={index} 
              label={tag.trim()} 
              size="small" 
              sx={{ mr: 0.5, mb: 0.5 }}
            />
          ))}
        </Box>
      </CardContent>
      <Divider />
      <CardActions sx={{ justifyContent: 'center', padding: '16px' }}>
        <Link href={`/student/courses/${course.$id}`} passHref>
          <Button 
            variant="contained" 
            color="primary"
            startIcon={<VisibilityIcon />}
            fullWidth
          >
            View Course
          </Button>
        </Link>
      </CardActions>
    </Card>
  );
};

export default StudentCourseCard; 