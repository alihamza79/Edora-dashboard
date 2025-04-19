'use client';
import React, { useState } from 'react';
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
  Avatar,
  Tooltip,
  Popover,
  Paper,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import PersonIcon from '@mui/icons-material/Person';
import SchoolIcon from '@mui/icons-material/School';
import Link from 'next/link';

const StudentCourseCard = ({ course, tutorName = 'Unknown Instructor', tutorStats = 0 }) => {
  const [anchorEl, setAnchorEl] = useState(null);

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

  const handleTutorMouseEnter = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleTutorMouseLeave = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);

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
          <Box 
            onMouseEnter={handleTutorMouseEnter}
            onMouseLeave={handleTutorMouseLeave}
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              cursor: 'pointer'
            }}
          >
            <Avatar
              alt={tutorName}
              sx={{ width: 24, height: 24, mr: 1, bgcolor: 'primary.main' }}
            >
              <PersonIcon sx={{ fontSize: 16 }} />
            </Avatar>
            <Typography variant="caption" color="text.secondary">
              {tutorName}
            </Typography>
          </Box>
          <Popover
            open={open}
            anchorEl={anchorEl}
            onClose={handleTutorMouseLeave}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'center',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'center',
            }}
            disableRestoreFocus
            sx={{
              pointerEvents: 'none',
            }}
          >
            <Paper sx={{ p: 2, maxWidth: 280 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Avatar
                  alt={tutorName}
                  sx={{ width: 40, height: 40, mr: 2, bgcolor: 'primary.main' }}
                >
                  <PersonIcon />
                </Avatar>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                    {tutorName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Instructor
                  </Typography>
                </Box>
              </Box>
              <Divider sx={{ my: 1 }} />
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <SchoolIcon sx={{ mr: 1, color: 'primary.main', fontSize: 18 }} />
                <Typography variant="body2">
                  {tutorStats} {tutorStats === 1 ? 'course' : 'courses'} available
                </Typography>
              </Box>
            </Paper>
          </Popover>
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