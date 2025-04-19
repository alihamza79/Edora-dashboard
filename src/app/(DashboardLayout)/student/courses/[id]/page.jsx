'use client';
import React from 'react';
import { Box, Typography, Paper, Chip, Grid, Button, Divider, Stack, CircularProgress, Alert, Card, CardMedia, List, ListItem, ListItemIcon, ListItemText, ListItemSecondaryAction, IconButton, Tooltip, Accordion, AccordionSummary, AccordionDetails, Tabs, Tab, Checkbox, LinearProgress } from '@mui/material';
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
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import InfoIcon from '@mui/icons-material/Info';

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
  const [activeTab, setActiveTab] = useState(0);
  const [showPlayer, setShowPlayer] = useState(false);
  const [currentContent, setCurrentContent] = useState(null);
  const [completedLessons, setCompletedLessons] = useState({});
  const [progressPercent, setProgressPercent] = useState(0);
  const [enrollmentId, setEnrollmentId] = useState(null);
  const [savingProgress, setSavingProgress] = useState(false);

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
              const enrollment = enrollments.documents[0];
              setEnrollmentStatus('enrolled');
              setEnrollmentId(enrollment.$id);
              
              // Load completed lessons from enrollment
              if (enrollment.completedLessons) {
                try {
                  const completed = JSON.parse(enrollment.completedLessons);
                  setCompletedLessons(completed);
                } catch (e) {
                  console.error('Error parsing completed lessons:', e);
                  setCompletedLessons({});
                }
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
        // Set first content as current if user is enrolled
        if (content.documents.length > 0) {
          setCurrentContent(content.documents[0]);
        }
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

  // Calculate progress percentage whenever completedLessons or courseContent changes
  useEffect(() => {
    if (courseContent.length > 0) {
      const completedCount = Object.values(completedLessons).filter(value => value).length;
      const percent = Math.round((completedCount / courseContent.length) * 100);
      setProgressPercent(percent);
    }
  }, [completedLessons, courseContent]);

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
      const enrollment = await databases.createDocument(
        databaseId,
        collections.enrollments,
        ID.unique(),
        {
          userId: user.$id,
          courseId: courseId,
          enrolledAt: new Date().toISOString(),
          status: 'active',
          completedLessons: JSON.stringify({}),
          progress: 0
        }
      );
      
      setEnrollmentStatus('enrolled');
      setEnrollmentId(enrollment.$id);
    } catch (error) {
      console.error('Error enrolling in course:', error);
      setError('Failed to enroll in course. Please try again later.');
      setEnrollmentStatus('not-enrolled');
    }
  };

  const handleLessonCheckbox = async (lessonId, isCompleted) => {
    if (!enrollmentId) return;
    
    setSavingProgress(true);
    
    // Update local state first
    const updatedCompletedLessons = {
      ...completedLessons,
      [lessonId]: isCompleted
    };
    
    setCompletedLessons(updatedCompletedLessons);
    
    try {
      // Update in database
      const client = new Client();
      client
        .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
        .setProject(projectID);

      const databases = new Databases(client);
      
      // Calculate progress percentage
      const completedCount = Object.values(updatedCompletedLessons).filter(value => value).length;
      const progressValue = Math.round((completedCount / courseContent.length) * 100);
      
      // Show saving feedback to user
      console.log(`Saving progress: ${progressValue}% complete`);
      
      await databases.updateDocument(
        databaseId,
        collections.enrollments,
        enrollmentId,
        {
          completedLessons: JSON.stringify(updatedCompletedLessons),
          progress: progressValue,
          lastUpdated: new Date().toISOString()
        }
      );
      
      // Feedback that progress was saved
      console.log('Course progress saved successfully');
    } catch (error) {
      console.error('Error updating lesson progress:', error);
      // Revert to previous state on error
      setCompletedLessons(completedLessons);
    } finally {
      setSavingProgress(false);
    }
  };

  const handleContentClick = (lesson) => {
    if (enrollmentStatus === 'enrolled') {
      setCurrentContent(lesson);
      setShowPlayer(true);
      // Scroll to player
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleGoToCourse = () => {
    setShowPlayer(true);
    // Make sure we have a current content selected
    if (!currentContent && courseContent.length > 0) {
      setCurrentContent(courseContent[0]);
    }
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
      {/* Header with Navigation */}
      <Box mb={4} display="flex" alignItems="center">
        <Button 
          startIcon={<ArrowBackIcon />} 
          onClick={() => {
            if (showPlayer) {
              setShowPlayer(false);
            } else {
              router.push('/student/courses');
            }
          }}
          sx={{ mr: 2 }}
        >
          {showPlayer ? 'Back to Course Details' : 'Back to Courses'}
        </Button>
        <Typography variant="h4" flex={1}>{course.title}</Typography>
      </Box>

      {/* Video Player Section - Only shown when enrolled and player is active */}
      {showPlayer && enrollmentStatus === 'enrolled' && currentContent && (
        <Box sx={{ mb: 4 }}>
          <Grid container spacing={2}>
            {/* Video Player */}
            <Grid item xs={12} md={8}>
              <Paper elevation={3} sx={{ p: 0, borderRadius: 2, overflow: 'hidden', position: 'relative' }}>
                {currentContent.fileUrl ? (
                  <Box sx={{ position: 'relative', width: '100%', pt: '56.25%' /* 16:9 Aspect Ratio */ }}>
                    <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
                      <video 
                        controls 
                        width="100%" 
                        height="100%"
                        src={currentContent.fileUrl}
                        style={{ objectFit: 'cover' }}
                      >
                        Your browser does not support the video tag.
                      </video>
                    </Box>
                  </Box>
                ) : (
                  <Box 
                    sx={{ 
                      height: 400, 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      bgcolor: 'grey.900'
                    }}
                  >
                    <Typography variant="h6" color="white">
                      No video available for this lesson
                    </Typography>
                  </Box>
                )}
                
                <Box sx={{ p: 3 }}>
                  <Typography variant="h5" gutterBottom>
                    {currentContent.title}
                  </Typography>
                  {currentContent.description && (
                    <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
                      {currentContent.description}
                    </Typography>
                  )}
                  
                  <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                    <Chip 
                      icon={<AccessTimeIcon />} 
                      label={currentContent.duration || 'No duration specified'} 
                      size="small" 
                      variant="outlined"
                    />
                    <Chip 
                      icon={<InfoIcon />} 
                      label={currentContent.type || 'Video'} 
                      size="small" 
                      variant="outlined"
                      color="primary"
                    />
                    
                    {/* Lesson completion checkbox */}
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Checkbox
                        checked={!!completedLessons[currentContent.$id]}
                        onChange={(e) => handleLessonCheckbox(currentContent.$id, e.target.checked)}
                        color="success"
                        disabled={savingProgress}
                      />
                      <Typography variant="body2" color={completedLessons[currentContent.$id] ? "success.main" : "text.secondary"}>
                        {completedLessons[currentContent.$id] ? "Completed" : "Mark as completed"}
                      </Typography>
                    </Box>
                  </Stack>
                </Box>
              </Paper>
            </Grid>
            
            {/* Course Content Sidebar */}
            <Grid item xs={12} md={4}>
              <Paper elevation={3} sx={{ 
                borderRadius: 2, 
                maxHeight: '600px',
                display: 'flex',
                flexDirection: 'column'
              }}>
                <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
                  <Typography variant="h6">Course progress</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    <Box sx={{ width: '100%', mr: 1 }}>
                      <LinearProgress variant="determinate" value={progressPercent} sx={{ height: 8, borderRadius: 5 }} />
                    </Box>
                    <Box sx={{ minWidth: 35 }}>
                      <Typography variant="body2" color="text.secondary">{`${progressPercent}%`}</Typography>
                    </Box>
                  </Box>
                </Box>
                
                <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
                  <Typography variant="h6">Course content</Typography>
                </Box>
                
                {contentLoading ? (
                  <Box display="flex" justifyContent="center" p={3}>
                    <CircularProgress size={30} />
                  </Box>
                ) : (
                  <Box sx={{ overflowY: 'auto', flexGrow: 1 }}>
                    <List disablePadding>
                      {courseContent.map((lesson, index) => (
                        <ListItem 
                          key={lesson.$id}
                          button
                          selected={currentContent?.$id === lesson.$id}
                          onClick={() => handleContentClick(lesson)}
                          sx={{ 
                            borderBottom: '1px solid',
                            borderColor: 'divider',
                            py: 1,
                            px: 1.5,
                            backgroundColor: currentContent?.$id === lesson.$id ? 'action.selected' : 'transparent',
                            '&:hover': {
                              backgroundColor: 'action.hover'
                            }
                          }}
                        >
                          <Checkbox
                            edge="start"
                            checked={!!completedLessons[lesson.$id]}
                            onChange={(e) => {
                              e.stopPropagation(); // Prevent triggering the ListItem click
                              handleLessonCheckbox(lesson.$id, e.target.checked);
                            }}
                            color="success"
                            disabled={savingProgress}
                            sx={{ p: 0, mr: 1 }}
                          />
                          <ListItemIcon sx={{ minWidth: 36 }}>
                            {currentContent?.$id === lesson.$id ? (
                              <PlayCircleOutlineIcon color="primary" />
                            ) : (
                              <Typography variant="body2" color="text.secondary" sx={{ width: 24, textAlign: 'center' }}>
                                {index + 1}
                              </Typography>
                            )}
                          </ListItemIcon>
                          <ListItemText
                            primary={
                              <Typography 
                                variant="body1" 
                                noWrap
                                sx={{ 
                                  color: completedLessons[lesson.$id] ? 'success.main' : 'inherit',
                                  textDecoration: completedLessons[lesson.$id] ? 'line-through' : 'none',
                                  opacity: completedLessons[lesson.$id] ? 0.8 : 1
                                }}
                              >
                                {lesson.title}
                              </Typography>
                            }
                            secondary={
                              <Typography variant="caption" color="text.secondary" display="flex" alignItems="center">
                                <AccessTimeIcon sx={{ fontSize: 14, mr: 0.5 }} />
                                {lesson.duration || 'No duration'}
                              </Typography>
                            }
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}
              </Paper>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* Course Details Section (shown when player is not active) */}
      {!showPlayer && (
        <Grid container spacing={4}>
          <Grid item xs={12} md={8}>
            {/* Tabs for different sections */}
            <Paper elevation={3} sx={{ mb: 4 }}>
              <Tabs
                value={activeTab}
                onChange={handleTabChange}
                variant="fullWidth"
                sx={{ borderBottom: 1, borderColor: 'divider' }}
              >
                <Tab label="Overview" />
                <Tab label="Content" />
              </Tabs>
              
              {/* Overview Tab */}
              {activeTab === 0 && (
                <Box sx={{ p: 3 }}>
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
                </Box>
              )}
              
              {/* Content Tab */}
              {activeTab === 1 && (
                <Box sx={{ p: 3 }}>
                  <Box display="flex" alignItems="center" mb={2}>
                    <VideoLibraryIcon sx={{ mr: 1 }} />
                    <Typography variant="h6">
                      Course Content
                    </Typography>
                  </Box>
                  <Divider sx={{ mb: 2 }} />
                  
                  {enrollmentStatus === 'enrolled' && (
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="subtitle1" gutterBottom>Your Progress</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Box sx={{ width: '100%', mr: 1 }}>
                          <LinearProgress variant="determinate" value={progressPercent} sx={{ height: 10, borderRadius: 5 }} />
                        </Box>
                        <Box sx={{ minWidth: 35 }}>
                          <Typography variant="body2" color="text.secondary">{`${progressPercent}%`}</Typography>
                        </Box>
                      </Box>
                    </Box>
                  )}
                  
                  {contentLoading ? (
                    <Box display="flex" justifyContent="center" p={3}>
                      <CircularProgress size={30} />
                    </Box>
                  ) : courseContent.length === 0 ? (
                    <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                      No content has been added to this course yet.
                    </Typography>
                  ) : (
                    <Accordion defaultExpanded={true} sx={{ mb: 2 }}>
                      <AccordionSummary
                        expandIcon={<ExpandMoreIcon />}
                        sx={{ bgcolor: 'background.paper' }}
                      >
                        <Typography variant="subtitle1" fontWeight="medium">
                          Section 1: Course Content ({courseContent.length} items)
                        </Typography>
                      </AccordionSummary>
                      <AccordionDetails sx={{ p: 0 }}>
                        <List disablePadding>
                          {courseContent.map((lesson, index) => (
                            <ListItem 
                              key={lesson.$id}
                              sx={{ 
                                borderBottom: '1px solid',
                                borderColor: 'divider',
                                cursor: enrollmentStatus === 'enrolled' ? 'pointer' : 'default',
                                p: 1.5,
                                '&:hover': {
                                  bgcolor: enrollmentStatus === 'enrolled' ? 'action.hover' : 'transparent'
                                }
                              }}
                              onClick={() => handleContentClick(lesson)}
                            >
                              {enrollmentStatus === 'enrolled' && (
                                <Checkbox
                                  edge="start"
                                  checked={!!completedLessons[lesson.$id]}
                                  onChange={(e) => {
                                    e.stopPropagation();
                                    handleLessonCheckbox(lesson.$id, e.target.checked);
                                  }}
                                  color="success"
                                  disabled={savingProgress}
                                  sx={{ p: 0, mr: 1 }}
                                />
                              )}
                              <ListItemIcon>
                                {enrollmentStatus === 'enrolled' ? (
                                  completedLessons[lesson.$id] ? (
                                    <CheckCircleIcon color="success" />
                                  ) : (
                                    <PlayCircleOutlineIcon color="primary" />
                                  )
                                ) : (
                                  <LockIcon color="action" />
                                )}
                              </ListItemIcon>
                              <ListItemText
                                primary={
                                  <Typography 
                                    variant="subtitle1"
                                    sx={{ 
                                      color: completedLessons[lesson.$id] ? 'success.main' : 'inherit',
                                      textDecoration: completedLessons[lesson.$id] ? 'line-through' : 'none',
                                      opacity: completedLessons[lesson.$id] ? 0.8 : 1
                                    }}
                                  >
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
                      </AccordionDetails>
                    </Accordion>
                  )}
                  
                  {enrollmentStatus !== 'enrolled' && courseContent.length > 0 && (
                    <Alert severity="info" sx={{ mt: 2 }}>
                      Enroll in this course to access all {courseContent.length} lessons
                    </Alert>
                  )}
                </Box>
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
              
              {enrollmentStatus === 'enrolled' && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Your Progress
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Box sx={{ width: '100%', mr: 1 }}>
                      <LinearProgress variant="determinate" value={progressPercent} sx={{ height: 8, borderRadius: 5 }} />
                    </Box>
                    <Box sx={{ minWidth: 35 }}>
                      <Typography variant="body2" color="text.secondary">{`${progressPercent}%`}</Typography>
                    </Box>
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    {Object.values(completedLessons).filter(v => v).length} of {courseContent.length} lessons completed
                  </Typography>
                </Box>
              )}
              
              <Box sx={{ mb: 3 }}>
                <Button 
                  variant="contained" 
                  color="primary"
                  size="large"
                  fullWidth
                  startIcon={<SchoolIcon />}
                  onClick={enrollmentStatus === 'enrolled' ? handleGoToCourse : handleEnroll}
                  disabled={enrollmentStatus === 'enrolling'}
                >
                  {enrollmentStatus === 'enrolled' ? 'Go to Course' : 
                   enrollmentStatus === 'enrolling' ? 'Enrolling...' : 'Enroll Now'}
                </Button>
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
      )}
    </Box>
  );
};

export default CourseDetailsPage; 