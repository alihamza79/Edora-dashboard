'use client';
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Divider,
  Button,
  CircularProgress,
  Alert,
  Card,
  CardMedia,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Checkbox,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import LockIcon from '@mui/icons-material/Lock';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import BookIcon from '@mui/icons-material/Book';
import { Client, Databases, Query, ID } from 'appwrite';
import { collections } from '@/appwrite/collections';
import { projectID, databaseId } from '@/appwrite/config';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import Grid from '@mui/material/Grid';

const CourseContent = ({ courseId }) => {
  const [course, setCourse] = useState(null);
  const [sections, setSections] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [currentLesson, setCurrentLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingContent, setLoadingContent] = useState(false);
  const [error, setError] = useState(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [completedLessons, setCompletedLessons] = useState({});
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    const fetchCourseData = async () => {
      try {
        setLoading(true);
        
        if (!user || !user.$id) {
          setError("You need to be logged in to view course content");
          setLoading(false);
          return;
        }

        const client = new Client();
        client
          .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
          .setProject(projectID);

        const databases = new Databases(client);
        
        // Check enrollment status
        const enrollments = await databases.listDocuments(
          databaseId,
          collections.enrollments,
          [
            Query.equal('userId', user.$id),
            Query.equal('courseId', courseId)
          ]
        );
        
        if (enrollments.documents.length === 0) {
          setIsEnrolled(false);
          setError("You are not enrolled in this course");
          setLoading(false);
          return;
        }
        
        setIsEnrolled(true);
        
        // Fetch course details
        const courseData = await databases.getDocument(
          databaseId,
          collections.courses,
          courseId
        );
        
        setCourse(courseData);
        
        // Fetch course sections
        const sectionsData = await databases.listDocuments(
          databaseId,
          collections.courseSections,
          [
            Query.equal('courseId', courseId),
            Query.orderAsc('order')
          ]
        );
        
        setSections(sectionsData.documents);
        
        // Fetch all lessons for this course
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
        
        // Set initial lesson if available
        if (lessonsData.documents.length > 0) {
          setCurrentLesson(lessonsData.documents[0]);
        }
        
        // Fetch completed lessons
        try {
          const progressData = await databases.listDocuments(
            databaseId,
            collections.lessonProgress,
            [
              Query.equal('userId', user.$id),
              Query.equal('courseId', courseId),
              Query.equal('completed', true)
            ]
          );
          
          const completedMap = {};
          progressData.documents.forEach(progress => {
            completedMap[progress.lessonId] = true;
          });
          
          setCompletedLessons(completedMap);
        } catch (error) {
          console.error('Error fetching lesson progress:', error);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching course data:', error);
        setError("Failed to load course content. Please try again later.");
        setLoading(false);
      }
    };

    fetchCourseData();
  }, [courseId, user]);

  const handleSelectLesson = async (lesson) => {
    try {
      setLoadingContent(true);
      setCurrentLesson(lesson);
      
      // Here you could track progress, update last viewed, etc.
      
      setLoadingContent(false);
    } catch (error) {
      console.error('Error selecting lesson:', error);
      setLoadingContent(false);
    }
  };
  
  const toggleLessonCompletion = async (lessonId, event) => {
    if (event) {
      event.stopPropagation();
    }
    
    try {
      const client = new Client();
      client
        .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
        .setProject(projectID);

      const databases = new Databases(client);
      
      const isCurrentlyCompleted = completedLessons[lessonId];
      
      if (isCurrentlyCompleted) {
        // Find and delete the progress document
        const progressData = await databases.listDocuments(
          databaseId,
          collections.lessonProgress,
          [
            Query.equal('userId', user.$id),
            Query.equal('lessonId', lessonId)
          ]
        );
        
        if (progressData.documents.length > 0) {
          await databases.deleteDocument(
            databaseId,
            collections.lessonProgress,
            progressData.documents[0].$id
          );
        }
        
        // Update local state
        setCompletedLessons(prev => {
          const updated = {...prev};
          delete updated[lessonId];
          return updated;
        });
      } else {
        // Create a new progress document
        await databases.createDocument(
          databaseId,
          collections.lessonProgress,
          ID.unique(),
          {
            userId: user.$id,
            courseId: courseId,
            lessonId: lessonId,
            completed: true,
            completedAt: new Date().toISOString()
          }
        );
        
        // Update local state
        setCompletedLessons(prev => ({
          ...prev,
          [lessonId]: true
        }));
      }
    } catch (error) {
      console.error('Error updating lesson progress:', error);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
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
      <Box>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
        <Button 
          startIcon={<ArrowBackIcon />} 
          variant="contained"
          onClick={() => router.push('/student/courses')}
        >
          Back to Courses
        </Button>
      </Box>
    );
  }

  if (!isEnrolled) {
    return (
      <Box>
        <Alert severity="warning" sx={{ mb: 3 }}>
          You need to enroll in this course to access its content.
        </Alert>
        <Button 
          variant="contained" 
          onClick={() => router.push(`/student/courses/${courseId}`)}
        >
          Go to Course Details
        </Button>
      </Box>
    );
  }

  // Calculate course progress
  const completedCount = Object.keys(completedLessons).length;
  const totalLessons = lessons.length;
  const progress = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

  return (
    <Box>
      <Box mb={3} display="flex" alignItems="center">
        <Button 
          startIcon={<ArrowBackIcon />} 
          onClick={() => router.push(`/student/courses/${courseId}`)}
          sx={{ mr: 2 }}
        >
          Back to Course
        </Button>
        <Typography variant="h5" component="h1" flex={1}>
          {course?.title}
        </Typography>
      </Box>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper elevation={3} sx={{ mb: 3 }}>
            {currentLesson && (
              <Box>
                {loadingContent ? (
                  <Box display="flex" justifyContent="center" alignItems="center" height="300px">
                    <CircularProgress />
                  </Box>
                ) : (
                  <>
                    {currentLesson.videoUrl ? (
                      <Box sx={{ position: 'relative', paddingTop: '56.25%', width: '100%' }}>
                        <iframe
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                          }}
                          src={currentLesson.videoUrl}
                          title={currentLesson.title}
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      </Box>
                    ) : (
                      <Card sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'grey.100' }}>
                        <BookIcon sx={{ fontSize: 60, color: 'text.secondary' }} />
                      </Card>
                    )}
                  </>
                )}
                
                <Box p={3}>
                  <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                    <Typography variant="h5" gutterBottom>
                      {currentLesson.title}
                    </Typography>
                    <Checkbox
                      checked={!!completedLessons[currentLesson.$id]}
                      onChange={(e) => toggleLessonCompletion(currentLesson.$id, e)}
                      color="success"
                      sx={{ '& .MuiSvgIcon-root': { fontSize: 28 } }}
                    />
                  </Box>
                  
                  <Box display="flex" alignItems="center" mb={2}>
                    <Typography variant="body2" color="text.secondary">
                      {completedLessons[currentLesson.$id] ? 'Marked as completed' : 'Mark as completed'}
                    </Typography>
                  </Box>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 2 }}>
                    <Tab label="Description" />
                    <Tab label="Resources" />
                  </Tabs>
                  
                  {activeTab === 0 && (
                    <Typography variant="body1">
                      {currentLesson.description || 'No description available for this lesson.'}
                    </Typography>
                  )}
                  
                  {activeTab === 1 && (
                    <Box>
                      {currentLesson.resources && currentLesson.resources.length > 0 ? (
                        <List>
                          {currentLesson.resources.map((resource, index) => (
                            <ListItem key={index}>
                              <ListItemIcon>
                                <FileIcon />
                              </ListItemIcon>
                              <ListItemText 
                                primary={resource.title} 
                                secondary={resource.description}
                              />
                              <Button 
                                variant="outlined" 
                                size="small"
                                href={resource.url}
                                target="_blank"
                              >
                                Download
                              </Button>
                            </ListItem>
                          ))}
                        </List>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          No resources available for this lesson.
                        </Typography>
                      )}
                    </Box>
                  )}
                </Box>
              </Box>
            )}
            
            {!currentLesson && (
              <Box p={3} textAlign="center">
                <Typography variant="body1" color="text.secondary">
                  Select a lesson from the course content to start learning.
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Paper elevation={3} sx={{ height: '100%' }}>
            <Box p={2}>
              <Typography variant="h6" gutterBottom>
                Course Content
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Your progress: {progress}%
                </Typography>
                <Box sx={{ width: '100%', bgcolor: 'rgba(0,0,0,0.1)', height: 10, borderRadius: 5 }}>
                  <Box sx={{ 
                    width: `${progress}%`, 
                    bgcolor: '#4caf50', 
                    height: '100%', 
                    borderRadius: 5,
                    transition: 'width 0.3s ease'
                  }} />
                </Box>
                <Typography variant="caption" color="text.secondary">
                  {completedCount} of {totalLessons} lessons completed
                </Typography>
              </Box>
            </Box>
            <Divider />
            
            <Box sx={{ maxHeight: '600px', overflow: 'auto' }}>
              {sections.length > 0 ? (
                sections.map((section) => (
                  <Accordion key={section.$id} defaultExpanded>
                    <AccordionSummary
                      expandIcon={<ExpandMoreIcon />}
                      aria-controls={`section-${section.$id}-content`}
                      id={`section-${section.$id}-header`}
                    >
                      <Typography variant="subtitle1">
                        {section.title}
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails sx={{ p: 0 }}>
                      <List dense disablePadding>
                        {lessons
                          .filter(lesson => lesson.sectionId === section.$id)
                          .map((lesson) => (
                            <ListItemButton 
                              key={lesson.$id}
                              selected={currentLesson && currentLesson.$id === lesson.$id}
                              onClick={() => handleSelectLesson(lesson)}
                              sx={{
                                borderLeft: completedLessons[lesson.$id] ? '3px solid #4caf50' : 'none',
                              }}
                            >
                              <ListItemIcon>
                                <Checkbox
                                  edge="start"
                                  checked={!!completedLessons[lesson.$id]}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleLessonCompletion(lesson.$id, e);
                                  }}
                                  color="success"
                                />
                              </ListItemIcon>
                              <ListItemText 
                                primary={lesson.title} 
                                secondary={`${lesson.duration || '-- min'}`}
                                primaryTypographyProps={{
                                  style: completedLessons[lesson.$id] ? { 
                                    textDecoration: 'line-through',
                                    color: 'rgba(0, 0, 0, 0.5)'
                                  } : {}
                                }}
                              />
                            </ListItemButton>
                          ))}
                      </List>
                    </AccordionDetails>
                  </Accordion>
                ))
              ) : (
                <Box p={3} textAlign="center">
                  <Typography variant="body2" color="text.secondary">
                    No content available for this course yet.
                  </Typography>
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

const FileIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  <path d="M16 13H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  <path d="M16 17H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  <path d="M10 9H9H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
</svg>;

export default CourseContent; 