'use client';
import React, { useState, useEffect } from 'react';
import {
  Grid,
  Box,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Button,
  Divider,
  Paper,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  LinearProgress,
} from '@mui/material';
import { Client, Databases, Query } from 'appwrite';
import { collections } from '@/appwrite/collections';
import { projectID, databaseId } from '@/appwrite/config';
import { useAuth } from '@/app/context/AuthContext';
import Link from 'next/link';
import SchoolIcon from '@mui/icons-material/School';
import BookIcon from '@mui/icons-material/Book';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';

const StudentDashboard = () => {
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [overallProgress, setOverallProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user || !user.$id) {
        setLoading(false);
        setError("You need to be logged in to view your dashboard");
        return;
      }

      try {
        setLoading(true);
        const client = new Client();
        client
          .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
          .setProject(projectID);

        const databases = new Databases(client);

        // Fetch enrollments
        const enrollmentResponse = await databases.listDocuments(
          databaseId,
          collections.enrollments,
          [Query.equal('userId', user.$id)]
        );

        if (enrollmentResponse.documents.length === 0) {
          setEnrolledCourses([]);
          setLoading(false);
          return;
        }

        // Extract course IDs from enrollments
        const courseIds = enrollmentResponse.documents.map(enrollment => enrollment.courseId);
        
        // Fetch enrolled courses data
        const coursesData = [];
        let totalProgress = 0;
        
        for (const courseId of courseIds) {
          try {
            const courseResponse = await databases.getDocument(
              databaseId,
              collections.courses,
              courseId
            );
            
            // Find the enrollment for this course
            const enrollment = enrollmentResponse.documents.find(
              enrollment => enrollment.courseId === courseId
            );
            
            // Add enrollment data to the course object
            const courseWithEnrollment = {
              ...courseResponse,
              enrollmentId: enrollment.$id,
              enrolledAt: enrollment.enrolledAt,
              progress: enrollment.progress || 0,
              completedLessons: enrollment.completedLessons || '',
              lastUpdated: enrollment.lastUpdated
            };
            
            coursesData.push(courseWithEnrollment);
            totalProgress += courseWithEnrollment.progress;
          } catch (err) {
            console.error(`Error fetching course ${courseId}:`, err);
            // Continue with other courses even if one fails
          }
        }

        // Calculate overall progress
        const avgProgress = coursesData.length > 0 ? totalProgress / coursesData.length : 0;
        setOverallProgress(Math.round(avgProgress));

        // Sort by last updated (most recent first)
        coursesData.sort((a, b) => {
          if (a.lastUpdated && b.lastUpdated) {
            return new Date(b.lastUpdated) - new Date(a.lastUpdated);
          }
          return 0;
        });

        setEnrolledCourses(coursesData);
        
        // Get recent activity (using completed lessons or last accessed)
        // This would typically come from a user activity or progress collection
        // For now, we'll use the enrollment data as a placeholder
        const recentActivityData = enrollmentResponse.documents
          .filter(enrollment => enrollment.lastUpdated)
          .sort((a, b) => new Date(b.lastUpdated) - new Date(a.lastUpdated))
          .slice(0, 5);
        
        setRecentActivity(recentActivityData);
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError("Failed to load dashboard data. Please try again later.");
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

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

  // Format date helper
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 4 }}>
        Student Dashboard
      </Typography>

      <Grid container spacing={4}>
        {/* Progress Overview */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <SchoolIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Learning Progress</Typography>
              </Box>
              <Divider sx={{ mb: 3 }} />
              
              <Box sx={{ position: 'relative', display: 'inline-flex', width: '100%', justifyContent: 'center', mb: 2 }}>
                <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                  <CircularProgress
                    variant="determinate"
                    value={overallProgress}
                    size={120}
                    thickness={5}
                    sx={{ color: 'primary.main' }}
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
                    <Typography variant="h4" component="div" color="text.secondary">
                      {overallProgress}%
                    </Typography>
                  </Box>
                </Box>
              </Box>
              
              <Typography variant="body1" align="center" sx={{ mb: 2 }}>
                Overall Course Progress
              </Typography>
              
              <Box sx={{ textAlign: 'center', mt: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Enrolled in {enrolledCourses.length} course{enrolledCourses.length !== 1 ? 's' : ''}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Continue Learning */}
        <Grid item xs={12} md={8}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <PlayCircleOutlineIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Continue Learning</Typography>
              </Box>
              <Divider sx={{ mb: 3 }} />
              
              {enrolledCourses.length > 0 ? (
                <>
                  <List>
                    {enrolledCourses.slice(0, 3).map((course) => (
                      <ListItem 
                        key={course.$id}
                        sx={{ 
                          mb: 2, 
                          p: 2, 
                          bgcolor: 'background.paper', 
                          borderRadius: 1,
                          boxShadow: 1
                        }}
                      >
                        <ListItemAvatar>
                          <Avatar 
                            src={course.thumbnail} 
                            variant="rounded"
                            sx={{ width: 60, height: 60, mr: 1 }}
                            alt={course.title}
                          >
                            <BookIcon />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={course.title}
                          secondary={
                            <Box sx={{ mt: 1 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                                <Typography variant="body2" color="text.secondary">Progress</Typography>
                                <Typography variant="body2" color="text.secondary">{course.progress}%</Typography>
                              </Box>
                              <LinearProgress variant="determinate" value={course.progress} sx={{ height: 6, borderRadius: 3 }} />
                            </Box>
                          }
                          sx={{ ml: 1 }}
                        />
                        <Link href={`/student/courses/content/${course.$id}`} passHref>
                          <Button 
                            variant="contained" 
                            color="primary" 
                            size="small"
                            sx={{ ml: 2 }}
                          >
                            Continue
                          </Button>
                        </Link>
                      </ListItem>
                    ))}
                  </List>
                  
                  {enrolledCourses.length > 3 && (
                    <Box sx={{ textAlign: 'center', mt: 2 }}>
                      <Link href="/student/enrolled" passHref>
                        <Button variant="outlined">
                          View All Enrolled Courses
                        </Button>
                      </Link>
                    </Box>
                  )}
                </>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body1" color="text.secondary" gutterBottom>
                    You haven't enrolled in any courses yet.
                  </Typography>
                  <Link href="/student/courses" passHref>
                    <Button 
                      variant="contained" 
                      color="primary"
                      sx={{ mt: 2 }}
                    >
                      Browse Courses
                    </Button>
                  </Link>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
        
        {/* Recent Activity */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <CalendarTodayIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Recent Activity</Typography>
              </Box>
              <Divider sx={{ mb: 3 }} />
              
              {recentActivity.length > 0 ? (
                <List>
                  {recentActivity.map((activity) => {
                    // Find the course for this activity
                    const course = enrolledCourses.find(c => c.$id === activity.courseId);
                    
                    return (
                      <ListItem key={activity.$id} sx={{ mb: 1 }}>
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: 'primary.light' }}>
                            <CheckCircleOutlineIcon />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={`Updated progress in ${course?.title || 'a course'}`}
                          secondary={formatDate(activity.lastUpdated)}
                        />
                      </ListItem>
                    );
                  })}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
                  No recent activity to display
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
        
        {/* Quick Links */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <BookIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Quick Links</Typography>
              </Box>
              <Divider sx={{ mb: 3 }} />
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Link href="/student/courses" passHref style={{ textDecoration: 'none' }}>
                    <Paper 
                      elevation={2} 
                      sx={{ 
                        p: 2, 
                        textAlign: 'center',
                        height: '100%',
                        cursor: 'pointer',
                        transition: 'all 0.3s',
                        '&:hover': {
                          transform: 'translateY(-3px)',
                          boxShadow: 3
                        }
                      }}
                    >
                      <SchoolIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                      <Typography variant="body1" fontWeight="medium">
                        Browse Courses
                      </Typography>
                    </Paper>
                  </Link>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Link href="/student/enrolled" passHref style={{ textDecoration: 'none' }}>
                    <Paper 
                      elevation={2} 
                      sx={{ 
                        p: 2, 
                        textAlign: 'center',
                        height: '100%',
                        cursor: 'pointer',
                        transition: 'all 0.3s',
                        '&:hover': {
                          transform: 'translateY(-3px)',
                          boxShadow: 3
                        }
                      }}
                    >
                      <BookIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                      <Typography variant="body1" fontWeight="medium">
                        My Courses
                      </Typography>
                    </Paper>
                  </Link>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default StudentDashboard; 