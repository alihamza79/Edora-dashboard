'use client';
import React, { useState, useEffect, useMemo } from 'react';
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
  IconButton,
  LinearProgress,
  Tooltip,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import LockIcon from '@mui/icons-material/Lock';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import BookIcon from '@mui/icons-material/Book';
import MenuIcon from '@mui/icons-material/Menu';
import { Client, Databases, Query } from 'appwrite';
import { collections } from '@/appwrite/collections';
import { projectID, databaseId } from '@/appwrite/config';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';

const CourseContent = ({ courseId }) => {
  const [course, setCourse] = useState(null);
  const [sections, setSections] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [currentLesson, setCurrentLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingContent, setLoadingContent] = useState(false);
  const [error, setError] = useState(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [completedLessons, setCompletedLessons] = useState({});
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [tutor, setTutor] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [progress, setProgress] = useState(0);
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
        
        // Fetch tutor information
        if (courseData.tutorId) {
          try {
            const tutorData = await databases.getDocument(
              databaseId,
              collections.users,
              courseData.tutorId
            );
            setTutor(tutorData);
          } catch (error) {
            console.error('Error fetching tutor data:', error);
          }
        }
        
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

  // Calculate progress whenever completedLessons or lessons change
  useEffect(() => {
    if (lessons.length === 0) return;
    
    const completedCount = Object.keys(completedLessons).length;
    const totalLessons = lessons.length;
    const calculatedProgress = Math.round((completedCount / totalLessons) * 100);
    
    setProgress(calculatedProgress);
  }, [completedLessons, lessons]);

  const handleSelectLesson = async (lesson) => {
    try {
      setLoadingContent(true);
      setCurrentLesson(lesson);
      
      // Automatically close sidebar on mobile when selecting a lesson
      if (window.innerWidth < 960) {
        setSidebarOpen(false);
      }
      
      setLoadingContent(false);
    } catch (error) {
      console.error('Error selecting lesson:', error);
      setLoadingContent(false);
    }
  };

  const toggleLessonCompletion = async (lessonId, event) => {
    event.stopPropagation();
    
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

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
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
        <IconButton 
          onClick={toggleSidebar} 
          sx={{ display: { xs: 'block', md: 'none' } }}
        >
          <MenuIcon />
        </IconButton>
      </Box>
      
      <Box 
        sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', md: 'row' },
          gap: 3
        }}
      >
        {/* Sidebar */}
        <Box 
          sx={{ 
            width: { xs: '100%', md: sidebarOpen ? '300px' : '0' },
            display: sidebarOpen ? 'block' : 'none',
            transition: 'width 0.3s ease',
            flexShrink: 0
          }}
        >
          <Paper elevation={3} sx={{ height: '100%' }}>
            <Box p={2}>
              <Typography variant="h6" gutterBottom>
                Course Content
              </Typography>
              {tutor && (
                <Typography variant="body2" color="text.secondary">
                  Instructor: {tutor.name || tutor.email}
                </Typography>
              )}
              
              <Box sx={{ mt: 2, mb: 1 }}>
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
            </Box>
            <Divider />
            
            <List sx={{ p: 0, maxHeight: { xs: '300px', md: '600px' }, overflow: 'auto' }}>
              {sections.length > 0 ? (
                sections.map((section) => (
                  <Accordion key={section.$id} defaultExpanded disableGutters>
                    <AccordionSummary
                      expandIcon={<ExpandMoreIcon />}
                      sx={{ px: 2, py: 1 }}
                    >
                      <Typography variant="subtitle1">
                        {section.title}
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails sx={{ p: 0 }}>
                      <List component="div" disablePadding>
                        {lessons
                          .filter(lesson => lesson.sectionId === section.$id)
                          .map((lesson) => (
                            <ListItemButton
                              key={lesson.$id}
                              selected={currentLesson && currentLesson.$id === lesson.$id}
                              onClick={() => handleSelectLesson(lesson)}
                              sx={{ 
                                pl: 4, 
                                pr: 2, 
                                py: 1,
                                borderLeft: completedLessons[lesson.$id] ? '3px solid #4caf50' : 'none',
                              }}
                            >
                              <ListItemIcon sx={{ minWidth: 36 }}>
                                <Checkbox
                                  edge="start"
                                  checked={!!completedLessons[lesson.$id]}
                                  tabIndex={-1}
                                  onClick={(e) => toggleLessonCompletion(lesson.$id, e)}
                                  sx={{ p: 0.5 }}
                                  color="success"
                                />
                              </ListItemIcon>
                              <ListItemText 
                                primary={lesson.title} 
                                primaryTypographyProps={{ 
                                  variant: 'body2',
                                  sx: completedLessons[lesson.$id] ? { 
                                    textDecoration: 'line-through',
                                    color: 'text.secondary'
                                  } : {}
                                }}
                              />
                              <Tooltip title={lesson.type === 'video' ? "Video lesson" : "Text lesson"}>
                                <ListItemIcon sx={{ minWidth: 24 }}>
                                  {lesson.type === 'video' ? 
                                    <PlayCircleOutlineIcon fontSize="small" color="primary" /> : 
                                    <FileIcon />
                                  }
                                </ListItemIcon>
                              </Tooltip>
                            </ListItemButton>
                          ))}
                      </List>
                    </AccordionDetails>
                  </Accordion>
                ))
              ) : (
                <ListItem>
                  <ListItemText primary="No content available yet" />
                </ListItem>
              )}
            </List>
          </Paper>
        </Box>
        
        {/* Main Content */}
        <Box sx={{ flexGrow: 1 }}>
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
                    <Typography variant="h5" component="h2">
                      {currentLesson.title}
                    </Typography>
                    <Tooltip title={completedLessons[currentLesson.$id] ? "Mark as incomplete" : "Mark as completed"}>
                      <Checkbox
                        checked={!!completedLessons[currentLesson.$id]}
                        onChange={(e) => toggleLessonCompletion(currentLesson.$id, e)}
                        color="success"
                        sx={{ '& .MuiSvgIcon-root': { fontSize: 28 } }}
                      />
                    </Tooltip>
                  </Box>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
                    {currentLesson.description || 'No description available for this lesson.'}
                  </Typography>
                  
                  {currentLesson.resources && currentLesson.resources.length > 0 && (
                    <Box mt={4}>
                      <Typography variant="h6" gutterBottom>
                        Resources
                      </Typography>
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
                    </Box>
                  )}
                </Box>
              </Box>
            )}
            
            {!currentLesson && (
              <Box p={3} textAlign="center">
                <Typography variant="body1">
                  Select a lesson from the sidebar to start learning.
                </Typography>
              </Box>
            )}
          </Paper>
        </Box>
      </Box>
    </Box>
  );
};

const FileIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M16 13H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M16 17H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M10 9H9H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export default CourseContent; 