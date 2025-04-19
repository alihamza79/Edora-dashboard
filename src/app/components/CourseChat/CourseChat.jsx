'use client';
import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  TextField, 
  IconButton, 
  Avatar, 
  Divider,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  CircularProgress,
  InputAdornment,
  Fade,
  Badge,
  alpha,
  useTheme
} from '@mui/material';
import { Client, Databases, Query, ID } from 'appwrite';
import { projectID, databaseId } from '@/appwrite/config';
import { useAuth } from '@/app/context/AuthContext';
import { IconSend, IconMoodSmile, IconPaperclip, IconLink } from '@tabler/icons-react';

// Direct reference to the collection ID to avoid import issues
const COURSE_CHATS_COLLECTION_ID = '680367e90029802cf0ef';

const CourseChat = ({ courseId }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const [showEmptyState, setShowEmptyState] = useState(false);
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  
  // Colors based on theme mode
  const colors = {
    primary: '#6366F1',
    primaryDark: '#5254cc',
    primaryLight: '#818CF8',
    background: isDarkMode ? '#1a1e2b' : '#F8FAFC',
    paper: isDarkMode ? '#242836' : 'white',
    userBubble: isDarkMode ? '#4F46E5' : '#6366F1',
    otherBubble: isDarkMode ? '#2e3346' : 'white',
    userText: 'white',
    otherText: isDarkMode ? '#e0e0e0' : 'black',
    secondaryText: isDarkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.55)',
    border: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
    inputBg: isDarkMode ? 'rgba(255,255,255,0.05)' : '#f7f9fc',
    inputHoverBg: isDarkMode ? 'rgba(255,255,255,0.08)' : '#f0f2f5',
    dateLabel: isDarkMode ? '#374151' : '#F8FAFC',
    gridLine: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(240, 240, 240, 0.3)',
  };

  useEffect(() => {
    // Show empty state with animation after a delay if no messages
    if (!loading && messages.length === 0) {
      const timer = setTimeout(() => {
        setShowEmptyState(true);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [loading, messages.length]);

  useEffect(() => {
    if (!courseId || !user) return;
    
    // Initialize Appwrite
    const client = new Client();
    client
      .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
      .setProject(projectID);
    
    const databases = new Databases(client);
    
    // Function to fetch messages
    const fetchMessages = async () => {
      try {
        setLoading(true);
        const response = await databases.listDocuments(
          databaseId,
          COURSE_CHATS_COLLECTION_ID,
          [
            Query.equal('courseId', courseId),
            Query.orderAsc('createdAt'),
            Query.limit(100)
          ]
        );
        
        setMessages(response.documents);
        setLoading(false);
        scrollToBottom();
      } catch (error) {
        console.error('Error fetching chat messages:', error);
        setLoading(false);
      }
    };
    
    // Initial fetch
    fetchMessages();
    
    // Subscribe to realtime updates with direct collection ID
    const unsubscribe = client.subscribe(`databases.${databaseId}.collections.${COURSE_CHATS_COLLECTION_ID}.documents`, response => {
      // Only update if it's for this course
      if (response.payload.courseId === courseId) {
        if (response.events.includes('databases.*.collections.*.documents.*.create')) {
          setMessages(prevMessages => [...prevMessages, response.payload]);
          scrollToBottom();
        }
      }
    });
    
    return () => {
      unsubscribe();
    };
  }, [courseId, user]);
  
  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };
  
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user || !courseId) return;
    
    try {
      const client = new Client();
      client
        .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
        .setProject(projectID);
      
      const databases = new Databases(client);
      
      // Create new message document with direct collection ID
      await databases.createDocument(
        databaseId,
        COURSE_CHATS_COLLECTION_ID,
        ID.unique(),
        {
          courseId: courseId,
          userId: user.$id,
          userName: user.name || 'Anonymous Student',
          userAvatar: user.profilePicture || null,
          message: newMessage,
          createdAt: new Date().toISOString()
        }
      );
      
      // Clear input field after sending
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };
  
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString(undefined, { 
        month: 'short', 
        day: 'numeric'
      });
    }
  };

  // Group messages by date
  const groupMessagesByDate = () => {
    const groups = {};
    messages.forEach(msg => {
      const date = formatDate(msg.createdAt);
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(msg);
    });
    return groups;
  };

  const messageGroups = groupMessagesByDate();

  // Check if a message is the first in a sequence from the same user
  const isFirstInSequence = (msg, index, group) => {
    if (index === 0) return true;
    return group[index - 1].userId !== msg.userId;
  };

  // Check if a message is the last in a sequence from the same user
  const isLastInSequence = (msg, index, group) => {
    if (index === group.length - 1) return true;
    return group[index + 1].userId !== msg.userId;
  };

  return (
    <Paper 
      elevation={3} 
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        borderRadius: '16px',
        overflow: 'hidden',
        boxShadow: '0 6px 16px rgba(0, 0, 0, 0.08)',
        border: `1px solid ${colors.border}`,
        bgcolor: colors.paper
      }}
    >
      <Box 
        sx={{ 
          p: 2, 
          background: 'linear-gradient(90deg, #6366F1 0%, #818CF8 100%)',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: '500' }}>
          Course Chat
        </Typography>
        <Badge 
          badgeContent={messages.length} 
          color="error" 
          max={99}
          sx={{
            '& .MuiBadge-badge': {
              bgcolor: '#FE5C73',
            }
          }}
        >
          <Box 
            sx={{ 
              bgcolor: 'rgba(255,255,255,0.2)', 
              borderRadius: '50px',
              px: 1.5,
              py: 0.3
            }}
          >
            <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
              {messages.length} {messages.length === 1 ? 'message' : 'messages'}
            </Typography>
          </Box>
        </Badge>
      </Box>
      
      <Box 
        ref={chatContainerRef}
        sx={{ 
          flexGrow: 1, 
          overflowY: 'auto',
          p: 3,
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
          maxHeight: '500px',
          bgcolor: colors.background,
          backgroundImage: `linear-gradient(${colors.gridLine} 1px, transparent 1px), linear-gradient(90deg, ${colors.gridLine} 1px, transparent 1px)`,
          backgroundSize: '20px 20px'
        }}
      >
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" height="100%" flexDirection="column" gap={2}>
            <CircularProgress size={40} sx={{ color: colors.primary }} />
            <Typography variant="body2" color="text.secondary">
              Loading conversations...
            </Typography>
          </Box>
        ) : messages.length === 0 ? (
          <Fade in={showEmptyState}>
            <Box display="flex" justifyContent="center" alignItems="center" height="100%" flexDirection="column" gap={2} p={4}>
              <Box 
                sx={{
                  width: 120,
                  height: 120,
                  borderRadius: '50%',
                  background: isDarkMode ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg, #f5f7fa 0%, #e4e8eb 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mb: 2,
                  boxShadow: isDarkMode ? 'none' : '0 4px 12px rgba(0, 0, 0, 0.05)'
                }}
              >
                <IconMoodSmile size={60} stroke={1} color={colors.primary} />
              </Box>
              <Typography variant="h6" color="text.primary" textAlign="center">
                No messages yet
              </Typography>
              <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ maxWidth: 280 }}>
                Be the first to start the conversation! Ask questions or share your thoughts about the course.
              </Typography>
            </Box>
          </Fade>
        ) : (
          <Box sx={{ width: '100%', px: 1 }}>
            {Object.entries(messageGroups).map(([date, groupMessages]) => (
              <Box key={date} sx={{ mb: 3 }}>
                <Box 
                  sx={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    mb: 2,
                    position: 'relative'
                  }}
                >
                  <Box 
                    sx={{ 
                      position: 'absolute', 
                      top: '50%', 
                      left: 0, 
                      right: 0, 
                      height: '1px', 
                      bgcolor: colors.border
                    }} 
                  />
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      bgcolor: colors.background, 
                      px: 2, 
                      py: 0.5, 
                      borderRadius: 10, 
                      color: 'text.secondary',
                      position: 'relative',
                      fontWeight: 500,
                      boxShadow: isDarkMode ? 'none' : '0 1px 3px rgba(0,0,0,0.05)',
                      border: `1px solid ${colors.border}`
                    }}
                  >
                    {date}
                  </Typography>
                </Box>
                
                {groupMessages.map((msg, index) => {
                  const isCurrentUser = msg.userId === user?.$id;
                  const isFirst = isFirstInSequence(msg, index, groupMessages);
                  const isLast = isLastInSequence(msg, index, groupMessages);
                  
                  return (
                    <Box
                      key={msg.$id}
                      sx={{
                        display: 'flex',
                        flexDirection: isCurrentUser ? 'row-reverse' : 'row',
                        alignItems: 'flex-end',
                        mb: isLast ? 2 : 0.5,
                        mt: isFirst ? 2 : 0
                      }}
                    >
                      {isFirst && (
                        <Avatar 
                          src={msg.userAvatar}
                          alt={msg.userName}
                          sx={{ 
                            width: 42, 
                            height: 42, 
                            mr: isCurrentUser ? 0 : 1.5,
                            ml: isCurrentUser ? 1.5 : 0,
                            boxShadow: isDarkMode ? '0 2px 6px rgba(0,0,0,0.3)' : '0 2px 6px rgba(0,0,0,0.1)',
                            bgcolor: isCurrentUser 
                              ? alpha(colors.userBubble, 0.8) 
                              : isDarkMode 
                                ? alpha(colors.primary, 0.3) 
                                : undefined,
                            border: isDarkMode ? `2px solid ${alpha(colors.primary, 0.4)}` : 'none',
                            color: isDarkMode ? 'white' : undefined,
                            '& .MuiAvatar-img': {
                              objectFit: 'cover'
                            }
                          }}
                        >
                          {!msg.userAvatar && msg.userName && msg.userName.charAt(0).toUpperCase()}
                        </Avatar>
                      )}
                      
                      {!isFirst && (
                        <Box sx={{ width: 42, mr: isCurrentUser ? 0 : 1.5, ml: isCurrentUser ? 1.5 : 0 }} />
                      )}
                      
                      <Box 
                        sx={{
                          maxWidth: '70%',
                          bgcolor: isCurrentUser 
                            ? colors.userBubble
                            : colors.otherBubble,
                          color: isCurrentUser ? colors.userText : colors.otherText,
                          borderRadius: '18px',
                          px: 2.5,
                          py: 1.5,
                          position: 'relative',
                          boxShadow: isDarkMode ? 'none' : '0 1px 4px rgba(0,0,0,0.06)',
                          border: isCurrentUser ? 'none' : `1px solid ${colors.border}`,
                          borderTopLeftRadius: !isCurrentUser && !isFirst ? '6px' : undefined,
                          borderTopRightRadius: isCurrentUser && !isFirst ? '6px' : undefined,
                        }}
                      >
                        {isFirst && (
                          <Typography 
                            variant="subtitle2" 
                            sx={{ 
                              color: isCurrentUser ? 'rgba(255,255,255,0.95)' : isDarkMode ? 'rgba(255,255,255,0.9)' : '#000000',
                              mb: 0.5,
                              fontWeight: 600,
                              display: 'block',
                              fontSize: '0.85rem',
                              letterSpacing: 0.2
                            }}
                          >
                            {isCurrentUser ? 'You' : msg.userName}
                          </Typography>
                        )}
                        
                        <Typography 
                          variant="body1"
                          sx={{ 
                            wordBreak: 'break-word',
                            whiteSpace: 'pre-wrap',
                            lineHeight: 1.5,
                            color: isCurrentUser ? colors.userText : colors.otherText,
                            fontWeight: 400,
                            fontSize: '0.95rem',
                            mt: 0.75
                          }}
                        >
                          {msg.message}
                        </Typography>
                        
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            display: 'block', 
                            textAlign: 'right',
                            mt: 0.75,
                            fontSize: '0.7rem',
                            opacity: 0.8,
                            color: isCurrentUser ? 'rgba(255,255,255,0.9)' : colors.secondaryText
                          }}
                        >
                          {formatTime(msg.createdAt)}
                        </Typography>
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            ))}
            <div ref={messagesEndRef} />
          </Box>
        )}
      </Box>
      
      <Box 
        sx={{ 
          p: 2, 
          bgcolor: colors.paper, 
          display: 'flex',
          borderTop: `1px solid ${colors.border}`
        }}
      >
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={handleKeyPress}
          multiline
          maxRows={2}
          disabled={!user}
          sx={{
            mr: 1,
            '& .MuiOutlinedInput-root': {
              borderRadius: '9999px',
              backgroundColor: colors.inputBg,
              '&:hover': {
                backgroundColor: colors.inputHoverBg,
              },
              '&.Mui-focused': {
                backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : '#ffffff',
              },
              py: 1.2,
              px: 2,
              color: 'text.primary'
            },
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: colors.border
            },
            '& .MuiInputBase-input::placeholder': {
              color: isDarkMode ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)'
            }
          }}
        />
        <Box 
          component="div"
          sx={{
            width: 50,
            height: 50,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
            bgcolor: newMessage.trim() ? colors.primary : isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
            color: 'white',
            cursor: newMessage.trim() ? 'pointer' : 'default',
            transition: 'all 0.2s ease',
            '&:hover': {
              bgcolor: newMessage.trim() ? colors.primaryDark : isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.03)',
            }
          }}
          onClick={newMessage.trim() ? handleSendMessage : undefined}
        >
          <IconSend size={20} color={newMessage.trim() ? 'white' : isDarkMode ? 'rgba(255,255,255,0.4)' : '#666'} />
        </Box>
      </Box>
    </Paper>
  );
};

export default CourseChat; 