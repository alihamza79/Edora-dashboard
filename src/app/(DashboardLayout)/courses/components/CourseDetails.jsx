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
  IconButton,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { Client, Databases } from 'appwrite';
import { collections } from '@/appwrite/collections';
import { projectID, databaseId } from '@/appwrite/config';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const CourseDetails = ({ courseId }) => {
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const fetchCourseDetails = async () => {
      try {
        setLoading(true);
        const client = new Client();
        client
          .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
          .setProject(projectID);

        const databases = new Databases(client);
        const courseData = await databases.getDocument(
          databaseId,
          collections.courses,
          courseId
        );
        
        setCourse(courseData);
      } catch (error) {
        console.error('Error fetching course details:', error);
        setError('Failed to load course details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (courseId) {
      fetchCourseDetails();
    }
  }, [courseId]);

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
      try {
        setLoading(true);
        const client = new Client();
        client
          .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
          .setProject(projectID);

        const databases = new Databases(client);
        await databases.deleteDocument(
          databaseId,
          collections.courses,
          courseId
        );
        
        router.push('/courses');
      } catch (error) {
        console.error('Error deleting course:', error);
        setError('Failed to delete course. Please try again later.');
        setLoading(false);
      }
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
          onClick={() => router.push('/courses')}
          sx={{ mr: 2 }}
        >
          Back to Courses
        </Button>
        <Typography variant="h4" flex={1} color="error">{course.title}</Typography>
        <Link href={`/courses/edit/${courseId}`} passHref>
          <Button
            variant="outlined"
            color="primary"
            startIcon={<EditIcon />}
            sx={{ mr: 1 }}
          >
            Edit
          </Button>
        </Link>
        <Button
          variant="outlined"
          color="error"
          startIcon={<DeleteIcon />}
          onClick={handleDelete}
        >
          Delete
        </Button>
      </Box>

      <Grid container spacing={4}>
        <Grid item xs={12} md={8}>
          <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              Course Information
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="body1" sx={{ mb: 3 }}>
                  {course.description}
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Level
                </Typography>
                <Typography variant="body1" sx={{ mb: 2, textTransform: 'capitalize' }}>
                  {course.level || 'Not specified'}
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Duration
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {course.duration || 'Not specified'}
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Category
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {course.category || 'Not specified'}
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Price
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {course.price ? `$${parseFloat(course.price).toFixed(2)}` : 'Free'}
                </Typography>
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">
                  Status
                </Typography>
                <Chip 
                  label={course.status || 'Draft'} 
                  color={course.status === 'Published' ? 'success' : 'default'} 
                  size="small"
                  sx={{ mt: 0.5 }}
                />
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
                Created On
              </Typography>
              <Typography variant="body2">{formattedDate}</Typography>
            </Box>
            
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Last Updated
              </Typography>
              <Typography variant="body2">
                {course.$updatedAt !== course.$createdAt
                  ? new Date(course.$updatedAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })
                  : 'Not updated since creation'
                }
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default CourseDetails; 