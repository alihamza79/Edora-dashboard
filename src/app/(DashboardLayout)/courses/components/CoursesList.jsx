'use client';
import React, { useState, useEffect } from 'react';
import { Grid, CircularProgress, Box, Typography, Alert } from '@mui/material';
import CourseCard from './CourseCard';
import { Client, Databases, Query } from 'appwrite';
import { collections } from '@/appwrite/collections';
import { projectID, databaseId } from '@/appwrite/config';
import { useAuth } from '@/app/context/AuthContext';

const CoursesList = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        if (!user || !user.$id) {
          setLoading(false);
          setError("You need to be logged in to view your courses");
          return;
        }

        const client = new Client();
        client
          .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
          .setProject(projectID);

        const databases = new Databases(client);

        // Fetch courses created by the current user (tutor)
        const response = await databases.listDocuments(
          databaseId,
          collections.courses,
          [Query.equal('tutorId', user.$id)]
        );

        const coursesData = response.documents;
        
        // Fetch enrollment counts for each course
        const coursesWithEnrollments = await Promise.all(
          coursesData.map(async (course) => {
            try {
              const enrollments = await databases.listDocuments(
                databaseId,
                collections.enrollments,
                [Query.equal('courseId', course.$id)]
              );
              
              return {
                ...course,
                enrollmentCount: enrollments.documents.length
              };
            } catch (err) {
              console.error(`Error fetching enrollments for course ${course.$id}:`, err);
              return {
                ...course,
                enrollmentCount: 0
              };
            }
          })
        );

        setCourses(coursesWithEnrollments);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching courses:', error);
        setError("Failed to load courses. Please try again later.");
        setLoading(false);
      }
    };

    fetchCourses();
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
          You haven't created any courses yet. Click the "Create New Course" button to get started.
        </Typography>
      </Box>
    );
  }

  return (
    <Grid container spacing={3}>
      {courses.map((course) => (
        <Grid item xs={12} sm={6} md={4} key={course.$id}>
          <CourseCard course={course} />
        </Grid>
      ))}
    </Grid>
  );
};

export default CoursesList; 