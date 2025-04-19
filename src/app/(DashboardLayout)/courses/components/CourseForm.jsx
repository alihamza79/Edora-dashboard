'use client';
import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  Grid,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Typography,
  Alert,
  Chip,
  Stack,
  InputAdornment,
  CircularProgress,
  Divider,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { Client, Databases, ID } from 'appwrite';
import { collections } from '@/appwrite/collections';
import { projectID, databaseId } from '@/appwrite/config';
import storageServices from '@/appwrite/Services/storageServices';
import { useAuth } from '@/app/context/AuthContext';
import { useRouter } from 'next/navigation';

const CourseForm = ({ mode = 'create', courseId = null }) => {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ show: false, type: '', message: '' });
  const [previewUrl, setPreviewUrl] = useState('');
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [tagInput, setTagInput] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);

  const initialFormData = {
    title: '',
    description: '',
    price: '',
    duration: '',
    level: 'beginner',
    category: '',
    tags: [],
    status: 'Draft',
    thumbnail: '',
  };

  const [formData, setFormData] = useState(initialFormData);

  useEffect(() => {
    if (mode === 'edit' && courseId) {
      fetchCourseData();
    }
  }, [mode, courseId]);

  const fetchCourseData = async () => {
    try {
      setLoading(true);
      const client = new Client();
      client
        .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
        .setProject(projectID);

      const databases = new Databases(client);
      const course = await databases.getDocument(
        databaseId,
        collections.courses,
        courseId
      );

      if (course) {
        setFormData({
          title: course.title || '',
          description: course.description || '',
          price: course.price || '',
          duration: course.duration || '',
          level: course.level || 'beginner',
          category: course.category || '',
          tags: course.tags ? course.tags.split(',').map(tag => tag.trim()) : [],
          status: course.status || 'Draft',
          thumbnail: course.thumbnail || '',
        });

        if (course.thumbnail) {
          setPreviewUrl(course.thumbnail);
        }
      }
    } catch (error) {
      console.error('Error fetching course data:', error);
      setAlert({
        show: true,
        type: 'error',
        message: 'Failed to load course data',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleThumbnailChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setThumbnailFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleTagInputChange = (e) => {
    setTagInput(e.target.value);
  };

  const handleTagInputKeyDown = (e) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!formData.tags.includes(tagInput.trim())) {
        setFormData((prev) => ({
          ...prev,
          tags: [...prev.tags, tagInput.trim()],
        }));
      }
      setTagInput('');
    }
  };

  const handleDeleteTag = (tagToDelete) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToDelete),
    }));
  };

  const uploadThumbnail = async () => {
    if (!thumbnailFile) return formData.thumbnail; // Return existing URL if no new file

    try {
      // Use the storageServices to upload the file
      const fileId = ID.unique();
      
      // Create a mock progress tracker since we're using storageServices
      const mockProgressTracker = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(mockProgressTracker);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      // Upload the file
      const uploadedFile = await storageServices.bucket.createFile(thumbnailFile, fileId);
      
      clearInterval(mockProgressTracker);
      setUploadProgress(100);
      
      // Get the file view URL
      const fileView = await storageServices.bucket.getFileView(fileId);
      
      // Reset progress after a short delay
      setTimeout(() => {
        setUploadProgress(0);
      }, 500);
      
      return fileView.href || fileView;
    } catch (error) {
      console.error('Error uploading thumbnail:', error);
      setUploadProgress(0);
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setAlert({ show: false, type: '', message: '' });

    try {
      // Validate required fields
      if (!formData.title || !formData.description) {
        setAlert({
          show: true,
          type: 'error',
          message: 'Title and description are required',
        });
        setLoading(false);
        return;
      }

      // Upload thumbnail if there is a new file
      let thumbnailUrl = formData.thumbnail;
      if (thumbnailFile) {
        thumbnailUrl = await uploadThumbnail();
      }

      const client = new Client();
      client
        .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
        .setProject(projectID);

      const databases = new Databases(client);

      // Prepare data for saving
      const courseData = {
        title: formData.title,
        description: formData.description,
        price: formData.price || '0',
        duration: formData.duration,
        level: formData.level,
        category: formData.category,
        tags: formData.tags.join(', '),
        status: formData.status,
        thumbnail: thumbnailUrl,
        tutorId: user.$id,
      };

      // Create or update course
      if (mode === 'create') {
        await databases.createDocument(
          databaseId,
          collections.courses,
          ID.unique(),
          courseData
        );
        setAlert({
          show: true,
          type: 'success',
          message: 'Course created successfully',
        });
        // Reset form after successful creation
        setFormData(initialFormData);
        setPreviewUrl('');
        setThumbnailFile(null);
      } else {
        await databases.updateDocument(
          databaseId,
          collections.courses,
          courseId,
          courseData
        );
        setAlert({
          show: true,
          type: 'success',
          message: 'Course updated successfully',
        });
      }

      // Redirect after a short delay
      setTimeout(() => {
        router.push('/courses');
      }, 1500);
    } catch (error) {
      console.error('Error saving course:', error);
      setAlert({
        show: true,
        type: 'error',
        message: `Failed to ${mode === 'create' ? 'create' : 'update'} course: ${error.message}`,
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading && mode === 'edit') {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate>
      {alert.show && (
        <Alert severity={alert.type} sx={{ mb: 3 }}>
          {alert.message}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom>
            Basic Information
          </Typography>
          <Divider sx={{ mb: 2 }} />
        </Grid>

        <Grid item xs={12} md={8}>
          <TextField
            required
            fullWidth
            label="Course Title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            variant="outlined"
            margin="normal"
          />
        </Grid>

        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            label="Price"
            name="price"
            type="number"
            value={formData.price}
            onChange={handleChange}
            variant="outlined"
            margin="normal"
            InputProps={{
              startAdornment: <InputAdornment position="start">$</InputAdornment>,
            }}
          />
        </Grid>

        <Grid item xs={12}>
          <TextField
            required
            fullWidth
            label="Description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            variant="outlined"
            margin="normal"
            multiline
            rows={4}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Duration (e.g., '8 weeks', '30 hours')"
            name="duration"
            value={formData.duration}
            onChange={handleChange}
            variant="outlined"
            margin="normal"
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <FormControl fullWidth margin="normal">
            <InputLabel id="level-label">Level</InputLabel>
            <Select
              labelId="level-label"
              name="level"
              value={formData.level}
              onChange={handleChange}
              label="Level"
            >
              <MenuItem value="beginner">Beginner</MenuItem>
              <MenuItem value="intermediate">Intermediate</MenuItem>
              <MenuItem value="advanced">Advanced</MenuItem>
              <MenuItem value="all-levels">All Levels</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            variant="outlined"
            margin="normal"
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <FormControl fullWidth margin="normal">
            <InputLabel id="status-label">Status</InputLabel>
            <Select
              labelId="status-label"
              name="status"
              value={formData.status}
              onChange={handleChange}
              label="Status"
            >
              <MenuItem value="Draft">Draft</MenuItem>
              <MenuItem value="Published">Published</MenuItem>
              <MenuItem value="Archived">Archived</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
            Tags
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <TextField
            fullWidth
            label="Add Tags (Press Enter to add)"
            name="tagInput"
            value={tagInput}
            onChange={handleTagInputChange}
            onKeyDown={handleTagInputKeyDown}
            variant="outlined"
            margin="normal"
            helperText="Press Enter to add a tag"
          />
          <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {formData.tags.map((tag) => (
              <Chip
                key={tag}
                label={tag}
                onDelete={() => handleDeleteTag(tag)}
                color="primary"
                variant="outlined"
                sx={{ m: 0.5 }}
              />
            ))}
          </Box>
        </Grid>

        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
            Course Thumbnail
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Box sx={{ mt: 2, mb: 2 }}>
            <Button
              variant="outlined"
              component="label"
              startIcon={<CloudUploadIcon />}
              sx={{ mb: 2 }}
            >
              Upload Thumbnail
              <input
                type="file"
                accept="image/*"
                hidden
                onChange={handleThumbnailChange}
              />
            </Button>
            {uploadProgress > 0 && uploadProgress < 100 && (
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                <CircularProgress variant="determinate" value={uploadProgress} size={24} sx={{ mr: 2 }} />
                <Typography variant="body2">{`Uploading: ${uploadProgress}%`}</Typography>
              </Box>
            )}
            {previewUrl && (
              <Box sx={{ mt: 2, border: '1px solid #ddd', borderRadius: 1, p: 1, maxWidth: 300 }}>
                <img
                  src={previewUrl}
                  alt="Thumbnail preview"
                  style={{ width: '100%', height: 'auto', borderRadius: 4 }}
                />
              </Box>
            )}
          </Box>
        </Grid>

        <Grid item xs={12}>
          <Divider sx={{ my: 3 }} />
          <Stack direction="row" spacing={2} justifyContent="flex-end">
            <Button 
              onClick={() => router.push('/courses')} 
              variant="outlined"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="contained"
              color="primary" 
              disabled={loading}
              startIcon={loading && <CircularProgress size={20} color="inherit" />}
            >
              {loading ? 'Saving...' : mode === 'create' ? 'Create Course' : 'Update Course'}
            </Button>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
};

export default CourseForm; 