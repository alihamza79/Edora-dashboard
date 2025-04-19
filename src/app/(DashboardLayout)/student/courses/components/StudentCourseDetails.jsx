'use client';
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Chip,
  Grid,
  Button,
  Divider,
  Stack,
  CircularProgress,
  Alert,
  Card,
  CardMedia,
  CardContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SchoolIcon from '@mui/icons-material/School';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import SignalCellularAltIcon from '@mui/icons-material/SignalCellularAlt';
import CategoryIcon from '@mui/icons-material/Category';
import { Client, Databases, Query, ID } from 'appwrite';
import { collections } from '@/appwrite/collections';
import { projectID, databaseId } from '@/appwrite/config';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';

const StudentCourseDetails = ({ courseId }) => {
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [enrollmentStatus, setEnrollmentStatus] = useState('not-enrolled'); // 'not-enrolled', 'enrolled', 'enrolling'
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    const fetchCourseAndEnrollmentStatus = async () => {
      try {
        setLoading(true);
        const client = new Client();
        client
          .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
          .setProject(projectID);

        const databases = new Databases(client);
        
        // Fetch course details
        const courseData = await databases.getDocument(
          databaseId,
          collections.courses,
          courseId
        );
        
        setCourse(courseData);
        
        if (user && user.$id) {
          // Check if user is already enrolled
          try {
            const enrollments = await databases.listDocuments(
              databaseId,
              collections.enrollments,
              [
                Query.equal('userId', user.$id),
                Query.equal('courseId', courseId)
              ]
            );
            
            if (enrollments.documents.length > 0) {
              setEnrollmentStatus('enrolled');
            } else {
              setEnrollmentStatus('not-enrolled');
            }
          } catch (err) {
            console.error('Error checking enrollment:', err);
            setEnrollmentStatus('not-enrolled');
          }
        }
      } catch (error) {
        console.error('Error fetching course details:', error);
        setError('Failed to load course details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (courseId) {
      fetchCourseAndEnrollmentStatus();
    }
  }, [courseId, user]);

  const handleEnroll = async () => {
    if (!user || !user.$id) {
      setError('You need to be logged in to enroll in courses');
      return;
    }

    try {
      setEnrollmentStatus('enrolling');
      
      const client = new Client();
      client
        .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
        .setProject(projectID);

      const databases = new Databases(client);
      
      // Create enrollment record
      await databases.createDocument(
        databaseId,
        collections.enrollments,
        ID.unique(),
        {
          userId: user.$id,
          courseId: courseId,
          enrolledAt: new Date().toISOString(),
          status: 'active'
        }
      );
      
      setEnrollmentStatus('enrolled');
    } catch (error) {
      console.error('Error enrolling in course:', error);
      setError('Failed to enroll in course. Please try again later.');
      setEnrollmentStatus('not-enrolled');
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );
  }

  if (!course) {
    return (
      <Alert severity="warning" sx={{ mt: 2 }}>
        Course not found
      </Alert>
    );
  }

  // Format date
  const formattedDate = new Date(course.$createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Parse tags
  const tags = course.tags ? course.tags.split(',').map(tag => tag.trim()) : [];

  return (
    <Box>
      <Box mb={4} display="flex" alignItems="center">
        <Button 
          startIcon={<ArrowBackIcon />} 
          onClick={() => router.push('/student/courses')}
          sx={{ mr: 2 }}
        >
          Back to Courses
        </Button>
        <Typography variant="h4" flex={1}>{course.title}</Typography>
      </Box>

      <Grid container spacing={4}>
        <Grid item xs={12} md={8}>
          <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              Course Overview
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="body1" sx={{ mb: 3 }}>
                  {course.description}
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <List>
                  <ListItem>
                    <ListItemIcon>
                      <SignalCellularAltIcon />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Level" 
                      secondary={course.level ? course.level.charAt(0).toUpperCase() + course.level.slice(1) : 'Not specified'} 
                    />
                  </ListItem>
                  
                  <ListItem>
                    <ListItemIcon>
                      <AccessTimeIcon />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Duration" 
                      secondary={course.duration || 'Not specified'} 
                    />
                  </ListItem>
                  
                  <ListItem>
                    <ListItemIcon>
                      <CategoryIcon />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Category" 
                      secondary={course.category || 'Not specified'} 
                    />
                  </ListItem>
                </List>
              </Grid>
              
              <Grid item xs={12} sx={{ mt: 2 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Tags
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {tags.length > 0 ? (
                    tags.map((tag, index) => (
                      <Chip 
                        key={index} 
                        label={tag} 
                        size="small" 
                        sx={{ m: 0.5 }} 
                      />
                    ))
                  ) : (
                    <Typography variant="body2" color="text.secondary">No tags</Typography>
                  )}
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              Course Preview
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            {course.thumbnail ? (
              <Card sx={{ mb: 3 }}>
                <CardMedia
                  component="img"
                  image={course.thumbnail}
                  alt={course.title}
                  sx={{ maxHeight: 200, objectFit: 'cover' }}
                />
              </Card>
            ) : (
              <Card sx={{ mb: 3, bgcolor: 'grey.100', height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  No thumbnail available
                </Typography>
              </Card>
            )}
            
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Price
              </Typography>
              <Typography variant="h5" color="primary" fontWeight="bold">
                {course.price ? `$${parseFloat(course.price).toFixed(2)}` : 'Free'}
              </Typography>
            </Box>
            
            <Box sx={{ mb: 3 }}>
              <Button 
                variant="contained" 
                color="primary"
                size="large"
                fullWidth
                startIcon={<SchoolIcon />}
                onClick={handleEnroll}
                disabled={enrollmentStatus === 'enrolled' || enrollmentStatus === 'enrolling'}
              >
                {enrollmentStatus === 'enrolled' ? 'Enrolled' : 
                 enrollmentStatus === 'enrolling' ? 'Enrolling...' : 'Enroll Now'}
              </Button>
              
              {enrollmentStatus === 'enrolled' && (
                <Button 
                  variant="outlined" 
                  color="primary"
                  size="large"
                  fullWidth
                  sx={{ mt: 2 }}
                  onClick={() => router.push(`/student/courses/learn/${courseId}`)}
                >
                  Go to Course
                </Button>
              )}
            </Box>
          </Paper>
          
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Created By
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              {course.tutorName || 'Course Instructor'}
            </Typography>
            
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Created On
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              {formattedDate}
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default StudentCourseDetails; 