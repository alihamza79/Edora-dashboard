'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Divider,
  Alert,
  Card,
  CardContent,
  Grid,
  IconButton,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  CloudUpload as CloudUploadIcon,
  VideoLibrary as VideoLibraryIcon,
  Article as ArticleIcon,
  DragIndicator as DragIndicatorIcon,
  ExpandMore as ExpandMoreIcon,
  PlayArrow as PlayArrowIcon,
  Link as LinkIcon,
  Description as DescriptionIcon,
  Save as SaveIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
} from '@mui/icons-material';
import { Client, Databases, ID, Query, Storage } from 'appwrite';
import { collections } from '@/appwrite/collections';
import { projectID, databaseId } from '@/appwrite/config';
import { useAuth } from '@/app/context/AuthContext';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import storageServices from '@/appwrite/Services/storageServices';

const CourseContentManager = ({ courseId }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState(null);
  const [contentItems, setContentItems] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [contentToDelete, setContentToDelete] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'video',
    fileUrl: '',
    duration: '',
    sequence: 0,
  });
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [editingContentId, setEditingContentId] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [expandedItems, setExpandedItems] = useState({});

  // Fetch course details and content items on component mount
  useEffect(() => {
    const fetchCourseAndContent = async () => {
      try {
        setLoading(true);
        setError(null);

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

        setCourse(courseData);

        // Fetch course content items
        // Note: You'll need to create a 'courseContents' collection in Appwrite
        try {
          const contentData = await databases.listDocuments(
            databaseId,
            collections.courseContents,
            [
              Query.equal('courseId', courseId),
              Query.orderAsc('sequence')
            ]
          );
          setContentItems(contentData.documents);
        } catch (contentError) {
          console.error('Content might not exist yet:', contentError);
          setContentItems([]);
        }

      } catch (error) {
        console.error('Error fetching course data:', error);
        setError('Failed to load course data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (courseId) {
      fetchCourseAndContent();
    }
  }, [courseId]);

  // Open the add/edit content dialog
  const handleOpenDialog = (contentItem = null) => {
    if (contentItem) {
      // Edit mode
      setFormData({
        title: contentItem.title || '',
        description: contentItem.description || '',
        type: 'video',
        fileUrl: contentItem.fileUrl || '',
        duration: contentItem.duration || '',
      });
      setEditingContentId(contentItem.$id);
      if (contentItem.fileUrl) {
        setPreviewUrl(contentItem.fileUrl);
      }
    } else {
      // Add mode
      setFormData({
        title: '',
        description: '',
        type: 'video',
        fileUrl: '',
        duration: '',
      });
      setEditingContentId(null);
      setPreviewUrl('');
    }
    setOpenDialog(true);
  };

  // Close the dialog
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedFile(null);
    setUploadProgress(0);
  };

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle file selection
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  // Upload file to Appwrite Storage
  const uploadFile = async () => {
    if (!selectedFile) return formData.fileUrl; // Return existing URL if no new file

    try {
      // Create a mock progress tracker
      const mockProgressTracker = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(mockProgressTracker);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      // Upload file using the existing bucket
      const fileId = ID.unique();
      const uploadedFile = await storageServices.bucket.createFile(selectedFile, fileId);

      clearInterval(mockProgressTracker);
      setUploadProgress(100);

      // Get file URL
      const fileView = await storageServices.bucket.getFileView(fileId);

      setTimeout(() => {
        setUploadProgress(0);
      }, 500);

      return fileView.href || fileView;
    } catch (error) {
      console.error('Error uploading file:', error);
      setUploadProgress(0);
      throw error;
    }
  };

  // Submit form to add or update content
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Upload file if selected
      let fileUrl = formData.fileUrl;
      if (selectedFile) {
        fileUrl = await uploadFile();
      }

      const client = new Client();
      client
        .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
        .setProject(projectID);

      const databases = new Databases(client);

      // Prepare data
      const contentData = {
        courseId: courseId,
        title: formData.title,
        description: formData.description,
        type: 'video',
        fileUrl: fileUrl,
        duration: formData.duration,
        createdBy: user.$id,
      };

      // Create or update the content
      if (editingContentId) {
        // Update existing content
        await databases.updateDocument(
          databaseId,
          collections.courseContents,
          editingContentId,
          contentData
        );
        setSuccess('Content updated successfully!');

        // Update the content items list
        setContentItems(prev => 
          prev.map(item => 
            item.$id === editingContentId 
              ? { ...item, ...contentData, $id: editingContentId } 
              : item
          )
        );
      } else {
        // Automatically assign the next sequence number for new content
        const nextSequence = contentItems.length > 0 
          ? Math.max(...contentItems.map(item => item.sequence || 0)) + 1 
          : 1;
        
        contentData.sequence = nextSequence;
        
        // Create new content
        const newContent = await databases.createDocument(
          databaseId,
          collections.courseContents,
          ID.unique(),
          contentData
        );
        setSuccess('Content added successfully!');

        // Add to the content items list
        setContentItems(prev => [...prev, newContent]);
      }

      // Close dialog and reset form
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving content:', error);
      setError(`Failed to save content: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Open delete confirmation dialog
  const handleOpenDeleteDialog = (contentId) => {
    setContentToDelete(contentId);
    setOpenDeleteDialog(true);
  };

  // Close delete confirmation dialog
  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
    setContentToDelete(null);
  };

  // Delete content item
  const handleDeleteContent = async () => {
    try {
      setLoading(true);
      
      const client = new Client();
      client
        .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
        .setProject(projectID);

      const databases = new Databases(client);
      
      await databases.deleteDocument(
        databaseId,
        collections.courseContents,
        contentToDelete
      );
      
      // Remove from the content items list
      setContentItems(prev => prev.filter(item => item.$id !== contentToDelete));
      setSuccess('Content deleted successfully!');
      handleCloseDeleteDialog();
    } catch (error) {
      console.error('Error deleting content:', error);
      setError(`Failed to delete content: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Move content item up in sequence
  const handleMoveUp = async (index) => {
    if (index <= 0) return;
    
    try {
      setLoading(true);
      
      const items = [...contentItems];
      const prevItem = items[index - 1];
      const currentItem = items[index];
      
      // Swap sequence numbers
      const tempSequence = prevItem.sequence;
      prevItem.sequence = currentItem.sequence;
      currentItem.sequence = tempSequence;
      
      // Swap positions in array
      items[index - 1] = currentItem;
      items[index] = prevItem;
      
      // Update in database
      const client = new Client();
      client
        .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
        .setProject(projectID);

      const databases = new Databases(client);
      
      await databases.updateDocument(
        databaseId,
        collections.courseContents,
        prevItem.$id,
        { sequence: prevItem.sequence }
      );
      
      await databases.updateDocument(
        databaseId,
        collections.courseContents,
        currentItem.$id,
        { sequence: currentItem.sequence }
      );
      
      // Update state
      setContentItems(items);
    } catch (error) {
      console.error('Error reordering content:', error);
      setError(`Failed to reorder content: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Move content item down in sequence
  const handleMoveDown = async (index) => {
    if (index >= contentItems.length - 1) return;
    
    try {
      setLoading(true);
      
      const items = [...contentItems];
      const nextItem = items[index + 1];
      const currentItem = items[index];
      
      // Swap sequence numbers
      const tempSequence = nextItem.sequence;
      nextItem.sequence = currentItem.sequence;
      currentItem.sequence = tempSequence;
      
      // Swap positions in array
      items[index + 1] = currentItem;
      items[index] = nextItem;
      
      // Update in database
      const client = new Client();
      client
        .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
        .setProject(projectID);

      const databases = new Databases(client);
      
      await databases.updateDocument(
        databaseId,
        collections.courseContents,
        nextItem.$id,
        { sequence: nextItem.sequence }
      );
      
      await databases.updateDocument(
        databaseId,
        collections.courseContents,
        currentItem.$id,
        { sequence: currentItem.sequence }
      );
      
      // Update state
      setContentItems(items);
    } catch (error) {
      console.error('Error reordering content:', error);
      setError(`Failed to reorder content: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle drag and drop to reorder content
  const handleDragEnd = async (result) => {
    if (!result.destination) return;
    
    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;
    
    if (sourceIndex === destinationIndex) return;
    
    try {
      setLoading(true);
      
      const items = [...contentItems];
      const [removed] = items.splice(sourceIndex, 1);
      items.splice(destinationIndex, 0, removed);
      
      // Update sequences to match new order
      const updatedItems = items.map((item, index) => ({
        ...item,
        sequence: index + 1
      }));
      
      // Update in database
      const client = new Client();
      client
        .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
        .setProject(projectID);

      const databases = new Databases(client);
      
      // Create update promises
      const updatePromises = updatedItems.map(item => 
        databases.updateDocument(
          databaseId,
          collections.courseContents,
          item.$id,
          { sequence: item.sequence }
        )
      );
      
      // Execute all updates
      await Promise.all(updatePromises);
      
      // Update state
      setContentItems(updatedItems);
      setSuccess('Content order updated successfully!');
      
    } catch (error) {
      console.error('Error reordering content:', error);
      setError(`Failed to reorder content: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Toggle card expansion
  const handleExpandCard = (itemId) => {
    setExpandedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  if (loading && !course) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}

      <Box mb={4} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4">
          {course?.title}
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add New Video
        </Button>
      </Box>

      <Box sx={{ width: '100%' }}>
        {contentItems.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 5 }}>
            <Typography variant="h6" color="textSecondary" gutterBottom>
              No content items found
            </Typography>
            <Typography variant="body1" color="textSecondary">
              Click the "Add New Video" button to get started
            </Typography>
          </Box>
        ) : (
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="content-items">
              {(provided) => (
                <List 
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  sx={{ bgcolor: 'background.paper' }}
                >
                  {contentItems.map((item, index) => (
                    <Draggable key={item.$id} draggableId={item.$id} index={index}>
                      {(provided, snapshot) => (
                        <Card 
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          sx={{ 
                            mb: 3, 
                            transition: 'all 0.2s',
                            borderRadius: '8px',
                            boxShadow: snapshot.isDragging ? 4 : 1,
                            bgcolor: snapshot.isDragging ? 'rgba(63, 81, 181, 0.08)' : 'background.paper',
                            overflow: 'hidden'
                          }}
                        >
                          <Box sx={{ display: 'flex', p: 2, alignItems: 'center' }}>
                            <Box 
                              {...provided.dragHandleProps}
                              sx={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                cursor: 'grab', 
                                p: 1, 
                                color: 'text.secondary' 
                              }}
                            >
                              <DragIndicatorIcon />
                            </Box>
                            
                            <Box sx={{ display: 'flex', alignItems: 'center', ml: 1 }}>
                              <VideoLibraryIcon color="primary" />
                            </Box>
                            
                            <Box 
                              sx={{ flex: 1, ml: 2, cursor: 'pointer' }}
                              onClick={() => handleExpandCard(item.$id)}
                            >
                              <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                                {index + 1}. {item.title}
                              </Typography>
                              <Typography variant="body2" color="text.secondary" noWrap>
                                {item.description}
                              </Typography>
                            </Box>
                            
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => handleOpenDialog(item)}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleOpenDeleteDialog(item.$id)}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                              <IconButton
                                size="small"
                                onClick={() => handleExpandCard(item.$id)}
                              >
                                {expandedItems[item.$id] ? 
                                  <ExpandMoreIcon /> : 
                                  <ExpandMoreIcon sx={{ transform: 'rotate(-90deg)' }} />
                                }
                              </IconButton>
                            </Box>
                          </Box>
                          
                          {expandedItems[item.$id] && (
                            <>
                              <Divider />
                              <Box sx={{ p: 2 }}>
                                {item.fileUrl && item.type === 'video' && (
                                  <Box sx={{ width: '100%' }}>
                                    <video
                                      controls
                                      width="100%"
                                      src={item.fileUrl}
                                      style={{ borderRadius: '8px', maxHeight: '400px', objectFit: 'contain' }}
                                    />
                                  </Box>
                                )}
                                
                                {item.fileUrl && item.type === 'document' && (
                                  <Button
                                    variant="outlined"
                                    startIcon={<DescriptionIcon />}
                                    href={item.fileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    View Document
                                  </Button>
                                )}
                                
                                {item.fileUrl && item.type === 'link' && (
                                  <Button
                                    variant="outlined"
                                    startIcon={<LinkIcon />}
                                    href={item.fileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    Open Link
                                  </Button>
                                )}
                              </Box>
                            </>
                          )}
                        </Card>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </List>
              )}
            </Droppable>
          </DragDropContext>
        )}
      </Box>

      {/* Add/Edit Content Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{editingContentId ? 'Edit Video' : 'Add New Video'}</DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  label="Title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  margin="normal"
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  multiline
                  rows={3}
                  margin="normal"
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Duration (e.g., '10:30', '1 hour')"
                  name="duration"
                  value={formData.duration}
                  onChange={handleChange}
                  margin="normal"
                />
              </Grid>

              <Grid item xs={12}>
                <Box sx={{ mt: 2, mb: 2 }}>
                  <Button
                    variant="outlined"
                    component="label"
                    startIcon={<CloudUploadIcon />}
                    sx={{ mb: 2 }}
                  >
                    Upload Video
                    <input
                      type="file"
                      accept="video/*"
                      hidden
                      onChange={handleFileChange}
                    />
                  </Button>

                  {uploadProgress > 0 && uploadProgress < 100 && (
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                      <CircularProgress variant="determinate" value={uploadProgress} size={24} sx={{ mr: 2 }} />
                      <Typography variant="body2">{`Uploading: ${uploadProgress}%`}</Typography>
                    </Box>
                  )}

                  {previewUrl && (
                    <Box sx={{ mt: 2, maxWidth: '100%' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="body2" color="text.secondary">Preview:</Typography>
                        <Button
                          variant="outlined"
                          color="error"
                          size="small"
                          startIcon={<DeleteIcon />}
                          onClick={() => {
                            setPreviewUrl('');
                            setFormData(prev => ({ ...prev, fileUrl: '' }));
                            setSelectedFile(null);
                          }}
                        >
                          Remove Video
                        </Button>
                      </Box>
                      <video
                        controls
                        width="100%"
                        src={previewUrl}
                        style={{ maxHeight: '200px', objectFit: 'contain' }}
                      />
                    </Box>
                  )}
                </Box>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            color="primary"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
          >
            {loading ? 'Saving...' : 'Save Content'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={openDeleteDialog}
        onClose={handleCloseDeleteDialog}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <DialogTitle id="delete-dialog-title">
          Confirm Delete
        </DialogTitle>
        <DialogContent>
          <Typography id="delete-dialog-description">
            Are you sure you want to delete this video? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog} color="primary">
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteContent} 
            color="error" 
            variant="contained"
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <DeleteIcon />}
            disabled={loading}
          >
            {loading ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CourseContentManager; 