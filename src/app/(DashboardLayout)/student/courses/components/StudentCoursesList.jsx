'use client';
import React, { useState, useEffect } from 'react';
import { 
  Grid, 
  CircularProgress, 
  Box, 
  Typography, 
  Alert,
  TextField,
  InputAdornment,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Paper,
  Divider
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import StudentCourseCard from './StudentCourseCard';
import { Client, Databases, Query } from 'appwrite';
import { collections } from '@/appwrite/collections';
import { projectID, databaseId } from '@/appwrite/config';
import { useAuth } from '@/app/context/AuthContext';

const StudentCoursesList = () => {
  const [courses, setCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [tutors, setTutors] = useState([]);
  const [tutorStats, setTutorStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTutor, setSelectedTutor] = useState('all');
  const { user } = useAuth();

  useEffect(() => {
    const fetchCoursesAndTutors = async () => {
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

        const coursesData = response.documents;
        setCourses(coursesData);
        setFilteredCourses(coursesData);

        // Extract unique tutor IDs
        const tutorIds = [...new Set(coursesData.map(course => course.tutorId))];
        
        // Calculate tutor stats (number of courses per tutor)
        const tutorCourseCounts = {};
        coursesData.forEach(course => {
          if (course.tutorId) {
            tutorCourseCounts[course.tutorId] = (tutorCourseCounts[course.tutorId] || 0) + 1;
          }
        });
        setTutorStats(tutorCourseCounts);
        
        // Fetch tutor details - using users collection where userId = tutorId
        const tutorsData = [];
        
        try {
          // Get all users who are tutors
          const usersResponse = await databases.listDocuments(
            databaseId,
            collections.users,
            []
          );
          
          // Create a map of userId to user for easy lookup
          const usersMap = {};
          usersResponse.documents.forEach(user => {
            usersMap[user.userId] = user;
          });
          
          // Map tutor IDs to user documents
          for (const tutorId of tutorIds) {
            if (usersMap[tutorId]) {
              tutorsData.push(usersMap[tutorId]);
            }
          }
          
          setTutors(tutorsData);
        } catch (err) {
          console.error('Error fetching tutors:', err);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching courses:', error);
        setError("Failed to load courses. Please try again later.");
        setLoading(false);
      }
    };

    fetchCoursesAndTutors();
  }, [user]);

  // Filter courses when search term or selected tutor changes
  useEffect(() => {
    if (courses.length) {
      let filtered = [...courses];
      
      // Filter by search term (case-insensitive)
      if (searchTerm) {
        filtered = filtered.filter(course => 
          course.title.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      
      // Filter by selected tutor
      if (selectedTutor !== 'all') {
        filtered = filtered.filter(course => course.tutorId === selectedTutor);
      }
      
      setFilteredCourses(filtered);
    }
  }, [searchTerm, selectedTutor, courses]);

  // Handle search input change
  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };
  
  // Handle tutor selection change
  const handleTutorChange = (event) => {
    setSelectedTutor(event.target.value);
  };

  // Find tutor name by ID (using userId field from users collection)
  const getTutorName = (tutorId) => {
    const tutor = tutors.find(t => t.userId === tutorId);
    return tutor ? tutor.name : 'Unknown Instructor';
  };

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
    <>
      <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Search courses by title..."
              value={searchTerm}
              onChange={handleSearchChange}
              variant="outlined"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth variant="outlined">
              <InputLabel id="tutor-select-label">Filter by Instructor</InputLabel>
              <Select
                labelId="tutor-select-label"
                value={selectedTutor}
                onChange={handleTutorChange}
                label="Filter by Instructor"
              >
                <MenuItem value="all">All Instructors</MenuItem>
                {tutors.map((tutor) => (
                  <MenuItem key={tutor.userId} value={tutor.userId}>
                    {tutor.name} ({tutorStats[tutor.userId] || 0} courses)
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {filteredCourses.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 5 }}>
          <Typography variant="h6" color="textSecondary">
            No courses match your search criteria
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {filteredCourses.map((course) => (
            <Grid item xs={12} sm={6} md={4} key={course.$id}>
              <StudentCourseCard 
                course={course} 
                tutorName={getTutorName(course.tutorId)}
                tutorStats={tutorStats[course.tutorId] || 0}
              />
            </Grid>
          ))}
        </Grid>
      )}
    </>
  );
};

export default StudentCoursesList; 