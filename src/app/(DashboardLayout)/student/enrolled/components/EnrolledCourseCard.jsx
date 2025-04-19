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
  LinearProgress,
} from '@mui/material';
import PlayCircleIcon from '@mui/icons-material/PlayCircle';
import VisibilityIcon from '@mui/icons-material/Visibility';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import Link from 'next/link';

const EnrolledCourseCard = ({ course }) => {
  // Default image if no thumbnail is available
  const thumbnailUrl = course.thumbnail 
    ? course.thumbnail 
    : 'https://via.placeholder.com/300x200?text=Course+Thumbnail';

  // Format date
  const enrolledDate = new Date(course.enrolledAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Get progress from enrollment data or default to 0
  const progress = course.progress || 0;

  // Calculate completed lessons
  const completedLessonsCount = course.completedLessons ? course.completedLessons.split(',').length : 0;

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
        <Box 
          sx={{ 
            position: 'absolute', 
            bottom: 0, 
            left: 0, 
            width: '100%', 
            bgcolor: 'rgba(0,0,0,0.6)', 
            color: 'white',
            p: 1,
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <AccessTimeIcon sx={{ mr: 1, fontSize: 18 }} />
          <Typography variant="caption" component="span">
            Enrolled: {enrolledDate}
          </Typography>
        </Box>
      </Box>
      <CardContent sx={{ flexGrow: 1, pb: 1 }}>
        <Typography gutterBottom variant="h5" component="div" noWrap>
          {course.title}
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Chip 
            label={course.level ? course.level.charAt(0).toUpperCase() + course.level.slice(1) : 'All Levels'} 
            size="small" 
            sx={{ mr: 1 }} 
            color="primary"
            variant="outlined"
          />
          {course.duration && (
            <Typography variant="caption" color="text.secondary">
              {course.duration}
            </Typography>
          )}
        </Box>

        <Box sx={{ mt: 2, mb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="body2" color="text.secondary">Progress</Typography>
            <Typography variant="body2" color="text.secondary">{progress}%</Typography>
          </Box>
          <LinearProgress variant="determinate" value={progress} sx={{ height: 8, borderRadius: 4 }} />
          
          {completedLessonsCount > 0 && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
              {completedLessonsCount} lesson{completedLessonsCount !== 1 ? 's' : ''} completed
            </Typography>
          )}
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

export default EnrolledCourseCard; 