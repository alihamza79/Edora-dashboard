'use client';
import React, { useState, useEffect } from 'react';
import { Grid, CircularProgress, Box, Typography, Alert } from '@mui/material';
import StudentCourseCard from './StudentCourseCard';
import { Client, Databases, Query } from 'appwrite';
import { collections } from '@/appwrite/collections';
import { projectID, databaseId } from '@/appwrite/config';
import { useAuth } from '@/app/context/AuthContext';

const StudentCoursesList = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        if (!user || !user.$id) {
          setLoading(false);
          setError("You need to be logged in to view courses");
          return;
        }

        const client = new Client();
        client
          .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
          .setProject(projectID);

        const databases = new Databases(client);

        // Fetch only published courses for students
        const response = await databases.listDocuments(
          databaseId,
          collections.courses,
          [Query.equal('status', 'Published')]
        );

        setCourses(response.documents);
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
          No courses are currently available. Please check back later.
        </Typography>
      </Box>
    );
  }

  return (
    <Grid container spacing={3}>
      {courses.map((course) => (
        <Grid item xs={12} sm={6} md={4} key={course.$id}>
          <StudentCourseCard course={course} />
        </Grid>
      ))}
    </Grid>
  );
};

export default StudentCoursesList; 