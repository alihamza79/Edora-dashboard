'use client';
import React from 'react';
import { Box, Typography, Paper, Chip, Grid, Button, Divider, Stack, CircularProgress, Alert, Card, CardMedia, List, ListItem, ListItemIcon, ListItemText, ListItemSecondaryAction, IconButton, Tooltip } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Client, Databases, Query, ID } from 'appwrite';
import { collections } from '@/appwrite/collections';
import { projectID, databaseId } from '@/appwrite/config';
import { useAuth } from '@/app/context/AuthContext';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SchoolIcon from '@mui/icons-material/School';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import LockIcon from '@mui/icons-material/Lock';
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

const CourseDetailsPage = ({ params }) => {
  const courseId = params.id;
  const [course, setCourse] = useState(null);
  const [courseContent, setCourseContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [contentLoading, setContentLoading] = useState(true);
  const [error, setError] = useState(null);
  const [enrollmentStatus, setEnrollmentStatus] = useState('not-enrolled');
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

    const fetchCourseContent = async () => {
      try {
        setContentLoading(true);
        const client = new Client();
        client
          .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
          .setProject(projectID);

        const databases = new Databases(client);
        
        // Fetch course content/lessons
        const content = await databases.listDocuments(
          databaseId,
          collections.courseContents,
          [
            Query.equal('courseId', courseId),
            Query.orderAsc('sequence')
          ]
        );
        
        setCourseContent(content.documents);
      } catch (error) {
        console.error('Error fetching course content:', error);
        // We don't set an error state here, just log it
        // This way the page still works even if content can't be loaded
      } finally {
        setContentLoading(false);
      }
    };

    if (courseId) {
      fetchCourseAndEnrollmentStatus();
      fetchCourseContent();
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

  const handleContentClick = (lessonId) => {
    if (enrollmentStatus === 'enrolled') {
      router.push(`/student/courses/learn/${courseId}/lessons/${lessonId}`);
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
    <Box sx={{ p: 3 }}>
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
            
            <Typography variant="body1" sx={{ mb: 3 }}>
              {course.description}
            </Typography>
            
            <Box sx={{ mt: 3 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Level
                  </Typography>
                  <Typography variant="body1">
                    {course.level ? course.level.charAt(0).toUpperCase() + course.level.slice(1) : 'Not specified'}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} sm={4}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Duration
                  </Typography>
                  <Typography variant="body1">
                    {course.duration || 'Not specified'}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} sm={4}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Category
                  </Typography>
                  <Typography variant="body1">
                    {course.category || 'Not specified'}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
            
            <Box sx={{ mt: 3 }}>
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
            </Box>
          </Paper>
          
          {/* Course Content Section */}
          <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
            <Box display="flex" alignItems="center" mb={2}>
              <VideoLibraryIcon sx={{ mr: 1 }} />
              <Typography variant="h6">
                Course Content
              </Typography>
            </Box>
            <Divider sx={{ mb: 2 }} />
            
            {contentLoading ? (
              <Box display="flex" justifyContent="center" p={3}>
                <CircularProgress size={30} />
              </Box>
            ) : courseContent.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                No content has been added to this course yet.
              </Typography>
            ) : (
              <List>
                {courseContent.map((lesson, index) => (
                  <ListItem 
                    key={lesson.$id}
                    sx={{ 
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1,
                      mb: 1,
                      cursor: enrollmentStatus === 'enrolled' ? 'pointer' : 'default',
                      '&:hover': {
                        bgcolor: enrollmentStatus === 'enrolled' ? 'action.hover' : 'transparent'
                      }
                    }}
                    onClick={() => handleContentClick(lesson.$id)}
                  >
                    <ListItemIcon>
                      {enrollmentStatus === 'enrolled' ? (
                        <PlayCircleOutlineIcon color="primary" />
                      ) : (
                        <LockIcon color="action" />
                      )}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Typography variant="subtitle1">
                          {index + 1}. {lesson.title}
                        </Typography>
                      }
                      secondary={
                        <Box component="span" display="flex" alignItems="center">
                          <AccessTimeIcon sx={{ fontSize: 16, mr: 0.5 }} />
                          <Typography variant="body2" component="span">
                            {lesson.duration || 'No duration specified'}
                          </Typography>
                          {lesson.description && (
                            <Typography variant="body2" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                              {lesson.description}
                            </Typography>
                          )}
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      {enrollmentStatus === 'enrolled' ? (
                        <Tooltip title="Watch Lesson">
                          <IconButton edge="end" color="primary">
                            <PlayCircleOutlineIcon />
                          </IconButton>
                        </Tooltip>
                      ) : (
                        <Tooltip title="Enroll to unlock">
                          <IconButton edge="end" disabled>
                            <LockIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            )}
            
            {enrollmentStatus !== 'enrolled' && courseContent.length > 0 && (
              <Alert severity="info" sx={{ mt: 2 }}>
                Enroll in this course to access all {courseContent.length} lessons
              </Alert>
            )}
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
            
            {/* Course Stats */}
            <Box sx={{ mb: 3 }}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Course Content
              </Typography>
              <Stack direction="row" spacing={3} sx={{ mb: 1 }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Lessons
                  </Typography>
                  <Typography variant="h6" fontWeight="medium">
                    {courseContent.length}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Duration
                  </Typography>
                  <Typography variant="h6" fontWeight="medium">
                    {course.duration || 'N/A'}
                  </Typography>
                </Box>
              </Stack>
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

export default CourseDetailsPage; 