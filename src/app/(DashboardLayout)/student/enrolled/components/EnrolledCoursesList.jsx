'use client';
import React, { useState, useEffect } from 'react';
import { Grid, CircularProgress, Box, Typography, Alert } from '@mui/material';
import EnrolledCourseCard from './EnrolledCourseCard';
import { Client, Databases, Query } from 'appwrite';
import { collections } from '@/appwrite/collections';
import { projectID, databaseId } from '@/appwrite/config';
import { useAuth } from '@/app/context/AuthContext';

const EnrolledCoursesList = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchEnrolledCourses = async () => {
      try {
        if (!user || !user.$id) {
          setLoading(false);
          setError("You need to be logged in to view your enrolled courses");
          return;
        }

        const client = new Client();
        client
          .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
          .setProject(projectID);

        const databases = new Databases(client);

        // First, get all enrollments for the current user
        const enrollmentResponse = await databases.listDocuments(
          databaseId,
          collections.enrollments,
          [Query.equal('userId', user.$id)]
        );

        if (enrollmentResponse.documents.length === 0) {
          setCourses([]);
          setLoading(false);
          return;
        }

        // Extract course IDs from enrollments
        const courseIds = enrollmentResponse.documents.map(enrollment => enrollment.courseId);
        
        // Fetch all enrolled courses
        const coursesData = [];
        
        // Since we can't query with "in" for multiple IDs easily, we'll do it one by one
        // In a production app, you might want to batch these or use a different approach
        for (const courseId of courseIds) {
          try {
            const courseResponse = await databases.getDocument(
              databaseId,
              collections.courses,
              courseId
            );
            
            // Find the enrollment for this course to get enrollment details
            const enrollment = enrollmentResponse.documents.find(
              enrollment => enrollment.courseId === courseId
            );
            
            // Add enrollment data to the course object
            coursesData.push({
              ...courseResponse,
              enrollmentId: enrollment.$id,
              enrolledAt: enrollment.enrolledAt,
              enrollmentStatus: enrollment.status
            });
          } catch (err) {
            console.error(`Error fetching course ${courseId}:`, err);
            // Continue with other courses even if one fails
          }
        }

        setCourses(coursesData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching enrolled courses:', error);
        setError("Failed to load your enrolled courses. Please try again later.");
        setLoading(false);
      }
    };

    fetchEnrolledCourses();
  }, [user]);

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="60vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="60vh"
      >
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (courses.length === 0) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="60vh"
      >
        <Typography variant="h6" color="textSecondary">
          You are not enrolled in any courses yet. Browse courses to enroll.
        </Typography>
      </Box>
    );
  }

  return (
    <Grid container spacing={3}>
      {courses.map((course) => (
        <Grid item xs={12} sm={6} md={4} key={course.$id}>
          <EnrolledCourseCard course={course} />
        </Grid>
      ))}
    </Grid>
  );
};

export default EnrolledCoursesList; 