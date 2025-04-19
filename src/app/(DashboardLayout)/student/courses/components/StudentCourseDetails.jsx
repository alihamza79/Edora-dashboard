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
  LinearProgress,
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
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import ArticleIcon from '@mui/icons-material/Article';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

const StudentCourseDetails = ({ courseId }) => {
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [enrollmentStatus, setEnrollmentStatus] = useState('not-enrolled'); // 'not-enrolled', 'enrolled', 'enrolling'
  const [sections, setSections] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [completedLessons, setCompletedLessons] = useState([]);
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
        
        // Fetch tutor details if tutorId is available
        if (courseData.tutorId) {
          try {
            const tutorData = await databases.getDocument(
              databaseId,
              collections.users,
              courseData.tutorId
            );
            
            // Add tutor info to course data
            setCourse(prev => ({
              ...prev,
              tutorName: tutorData.name || tutorData.email || 'Unknown Instructor'
            }));
          } catch (error) {
            console.error('Error fetching tutor details:', error);
          }
        }
        
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
              
              // Fetch course sections and lessons data
              try {
                const sectionsData = await databases.listDocuments(
                  databaseId,
                  collections.courseSections,
                  [
                    Query.equal('courseId', courseId),
                    Query.orderAsc('order')
                  ]
                );
                
                setSections(sectionsData.documents);
                
                const lessonsData = await databases.listDocuments(
                  databaseId,
                  collections.lessons,
                  [
                    Query.equal('courseId', courseId),
                    Query.orderAsc('sectionOrder'),
                    Query.orderAsc('order')
                  ]
                );
                
                setLessons(lessonsData.documents);
                
                // Fetch completed lessons
                const progressData = await databases.listDocuments(
                  databaseId,
                  collections.lessonProgress,
                  [
                    Query.equal('userId', user.$id),
                    Query.equal('courseId', courseId),
                    Query.equal('completed', true)
                  ]
                );
                
                setCompletedLessons(progressData.documents);
              } catch (err) {
                console.error('Error fetching course content:', err);
              }
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

  // Calculate progress
  const progress = lessons.length > 0 
    ? Math.round((completedLessons.length / lessons.length) * 100) 
    : 0;

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
                  {course.tutorName && (
                    <ListItem>
                      <ListItemIcon>
                        <SchoolIcon />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Instructor" 
                        secondary={course.tutorName} 
                      />
                    </ListItem>
                  )}
                  
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
          
          <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              Course Content
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            {enrollmentStatus === 'enrolled' && (
              <Box sx={{ mb: 3 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                  <Typography variant="body2" color="text.secondary">
                    Your progress
                  </Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {progress}%
                  </Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={progress} 
                  sx={{ 
                    height: 8, 
                    borderRadius: 5,
                    backgroundColor: 'rgba(0,0,0,0.1)',
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 5,
                    }
                  }} 
                />
              </Box>
            )}
            
            {/* Course Content Preview */}
            <Box>
              {loading ? (
                <Box display="flex" justifyContent="center" py={3}>
                  <CircularProgress size={30} />
                </Box>
              ) : (
                <List>
                  {sections.length > 0 ? (
                    sections.map((section, index) => (
                      <Box key={section.$id || index} sx={{ mb: 2 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mt: 2, mb: 1 }}>
                          {section.title || `Section ${index + 1}`}
                        </Typography>
                        
                        <List disablePadding>
                          {lessons
                            .filter(lesson => lesson.sectionId === section.$id)
                            .map((lesson, lessonIndex) => {
                              const isCompleted = completedLessons.some(
                                progress => progress.lessonId === lesson.$id
                              );
                              
                              return (
                                <ListItem 
                                  key={lesson.$id || lessonIndex} 
                                  sx={{ 
                                    py: 0.5,
                                    pl: 1,
                                    borderLeft: isCompleted ? '3px solid #4caf50' : 'none',
                                  }}
                                >
                                  <ListItemIcon sx={{ minWidth: 36 }}>
                                    {isCompleted ? (
                                      <CheckCircleIcon fontSize="small" color="success" />
                                    ) : (
                                      lesson.type === 'video' ? (
                                        <PlayArrowIcon fontSize="small" color="primary" />
                                      ) : (
                                        <ArticleIcon fontSize="small" color="primary" />
                                      )
                                    )}
                                  </ListItemIcon>
                                  <ListItemText 
                                    primary={lesson.title} 
                                    secondary={lesson.duration}
                                    primaryTypographyProps={{ 
                                      variant: 'body2',
                                      sx: isCompleted ? { textDecoration: 'line-through', color: 'text.secondary' } : {}
                                    }}
                                    secondaryTypographyProps={{ variant: 'caption' }}
                                  />
                                </ListItem>
                              );
                            })}
                        </List>
                      </Box>
                    ))
                  ) : (
                    <Box py={2}>
                      <Typography variant="body2" color="text.secondary" align="center">
                        No content sections available yet.
                      </Typography>
                    </Box>
                  )}
                </List>
              )}
            </Box>
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
              {enrollmentStatus === 'enrolled' && (
                <Box mb={2}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Your Progress
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box sx={{ position: 'relative', display: 'inline-flex', mr: 2 }}>
                      <CircularProgress
                        variant="determinate"
                        value={progress}
                        size={60}
                        thickness={5}
                        sx={{
                          circle: {
                            strokeLinecap: 'round',
                          }
                        }}
                      />
                      <Box
                        sx={{
                          top: 0,
                          left: 0,
                          bottom: 0,
                          right: 0,
                          position: 'absolute',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Typography variant="caption" fontWeight="bold">
                          {progress}%
                        </Typography>
                      </Box>
                    </Box>
                    <Box>
                      <Typography variant="body2">
                        {completedLessons.length} of {lessons.length} lessons completed
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              )}
              
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