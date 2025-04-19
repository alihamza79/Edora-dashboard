'use client';
import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Button, CircularProgress, Alert, Card, CardMedia } from '@mui/material';
import { Client, Databases } from 'appwrite';
import { collections } from '@/appwrite/collections';
import { projectID, databaseId } from '@/appwrite/config';
import { useAuth } from '@/app/context/AuthContext';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CourseChat from '@/app/components/CourseChat';
import { useRouter } from 'next/navigation';

const CourseChatPage = ({ params }) => {
  const courseId = params.id;
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    const fetchCourseDetails = async () => {
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
        
        // Check if the current user is the tutor for this course
        if (courseData.tutorId !== user?.$id) {
          setError("You don't have permission to access this course chat as you are not the tutor.");
          setLoading(false);
          return;
        }
        
        setCourse(courseData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching course details:', error);
        setError('Failed to load course details. Please try again later.');
        setLoading(false);
      }
    };

    if (courseId && user) {
      fetchCourseDetails();
    }
  }, [courseId, user]);

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

  return (
    <Box sx={{ p: 3 }}>
      {/* Header with Navigation */}
      <Box mb={4} display="flex" alignItems="center">
        <Button 
          startIcon={<ArrowBackIcon />} 
          onClick={() => router.push('/courses')}
          sx={{ mr: 2 }}
        >
          Back to Courses
        </Button>
        <Typography variant="h4" flex={1}>{course.title} - Chat</Typography>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <Card sx={{ mb: 3, borderRadius: 2, overflow: 'hidden' }}>
          {course.thumbnail ? (
            <CardMedia
              component="img"
              height="200"
              image={course.thumbnail}
              alt={course.title}
              sx={{ objectFit: 'cover' }}
            />
          ) : (
            <Box 
              sx={{ 
                height: 200, 
                bgcolor: 'grey.100', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center' 
              }}
            >
              <Typography variant="h6" color="text.secondary">
                No thumbnail available
              </Typography>
            </Box>
          )}
        </Card>

        <Paper 
          elevation={3} 
          sx={{ 
            borderRadius: 2,
            overflow: 'hidden'
          }}
        >
          <Box sx={{ height: 'calc(100vh - 350px)', minHeight: '500px' }}>
            <CourseChat courseId={courseId} />
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default CourseChatPage; 