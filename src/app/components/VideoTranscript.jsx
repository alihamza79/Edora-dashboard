'use client';
import { useState, useEffect, useRef } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  List, 
  ListItem, 
  ListItemText, 
  Divider, 
  IconButton, 
  Tooltip,
  TextField,
  InputAdornment,
  alpha
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import SearchIcon from '@mui/icons-material/Search';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import TextFormatIcon from '@mui/icons-material/TextFormat';

/**
 * VideoTranscript component that displays synchronized transcript for a video
 * @param {Object} props - Component props
 * @param {Array} props.transcript - Array of transcript segments with start and end times
 * @param {HTMLVideoElement} props.videoRef - Reference to the video element
 */
const VideoTranscript = ({ transcript = [], videoRef }) => {
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredTranscript, setFilteredTranscript] = useState(transcript);
  const [currentTime, setCurrentTime] = useState(0);
  const [wordHighlightPosition, setWordHighlightPosition] = useState(0);
  const transcriptListRef = useRef(null);
  const activeItemRef = useRef(null);
  const timerRef = useRef(null);

  // Process transcript to add word timestamps
  const processedTranscript = useRef([]);
  
  useEffect(() => {
    // Process transcript to estimate word timings
    const processed = transcript.map(segment => {
      const words = segment.text.split(' ');
      const duration = segment.end - segment.start;
      const avgWordDuration = duration / words.length;
      
      // Create word objects with estimated timestamps
      const wordObjects = words.map((word, idx) => ({
        word,
        start: segment.start + (idx * avgWordDuration),
        end: segment.start + ((idx + 1) * avgWordDuration)
      }));
      
      return {
        ...segment,
        words: wordObjects
      };
    });
    
    processedTranscript.current = processed;
    
  }, [transcript]);

  // Filter transcript when search term changes
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredTranscript(transcript);
      return;
    }
    
    const filtered = transcript.filter(segment => 
      segment.text.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredTranscript(filtered);
  }, [searchTerm, transcript]);

  // Listen for video time updates
  useEffect(() => {
    const handleTimeUpdate = () => {
      // Check if current word should be highlighted
      if (!transcript) return;
      
      let video;
      // Handle both direct video elements and our custom VideoPlayer component
      if (videoRef.current) {
        if (videoRef.current.isCustomPlayer) {
          // This is our custom VideoPlayer component
          video = videoRef.current;
        } else if (videoRef.current instanceof HTMLVideoElement) {
          // This is a direct video element
          video = videoRef.current;
        } else if (videoRef.current.videoElement instanceof HTMLVideoElement) {
          // Access the video element through the videoElement getter
          video = videoRef.current.videoElement;
        }
      }
      
      if (!video) return;
      
      const currentTime = video.currentTime;
      
      // Find the word that should be highlighted based on current time
      let newCurrentWordIndex = -1;
      for (let i = 0; i < transcript.length; i++) {
        const word = transcript[i];
        if (currentTime >= word.start && currentTime <= word.end) {
          newCurrentWordIndex = i;
          break;
        }
        
        // If passed this word's end time, but haven't reached next word's start time
        if (i < transcript.length - 1 && 
            currentTime > word.end && 
            currentTime < transcript[i+1].start) {
          newCurrentWordIndex = -1;
          break;
        }
      }
      
      if (newCurrentWordIndex !== wordHighlightPosition) {
        setWordHighlightPosition(newCurrentWordIndex);
      }
    };
    
    // Add event listener for time updates
    if (videoRef.current) {
      if (typeof videoRef.current.addEventListener === 'function') {
        // Direct video element or player with addEventListener method
        videoRef.current.addEventListener('timeupdate', handleTimeUpdate);
      } else if (videoRef.current.videoElement instanceof HTMLVideoElement) {
        // Access through videoElement getter
        videoRef.current.videoElement.addEventListener('timeupdate', handleTimeUpdate);
      } else {
        // Fallback: use a timer for updates
        const intervalId = setInterval(handleTimeUpdate, 100);
        return () => clearInterval(intervalId);
      }
    }
    
    // Cleanup function
    return () => {
      if (videoRef.current) {
        if (typeof videoRef.current.removeEventListener === 'function') {
          videoRef.current.removeEventListener('timeupdate', handleTimeUpdate);
        } else if (videoRef.current.videoElement instanceof HTMLVideoElement) {
          videoRef.current.videoElement.removeEventListener('timeupdate', handleTimeUpdate);
        }
      }
    };
  }, [transcript, wordHighlightPosition, videoRef]);

  // Scroll to current segment when it changes
  useEffect(() => {
    if (activeItemRef.current && transcriptListRef.current && !searchTerm) {
      activeItemRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
    
    // Reset word position when segment changes
    setWordHighlightPosition(0);
  }, [currentSegmentIndex, searchTerm]);

  // Handle clicking on a transcript segment
  const handleSegmentClick = (index, segmentStartTime) => {
    if (!videoRef || !videoRef.current) return;
    
    if (searchTerm) {
      // If searching, we need to find the actual index in the original transcript
      const actualSegment = transcript.find(seg => seg.start === segmentStartTime);
      const actualIndex = transcript.indexOf(actualSegment);
      
      if (typeof videoRef.current.currentTime === 'number') {
        videoRef.current.currentTime = segmentStartTime;
        setCurrentSegmentIndex(actualIndex);
      } else if (videoRef.current.hasOwnProperty('currentTime')) {
        // Handle if videoRef.current is our custom component with getter/setters
        videoRef.current.currentTime = segmentStartTime;
        setCurrentSegmentIndex(actualIndex);
      }
    } else {
      // Normal flow when not searching
      const segment = transcript[index];
      if (segment) {
        if (typeof videoRef.current.currentTime === 'number') {
          videoRef.current.currentTime = segment.start;
          setCurrentSegmentIndex(index);
        } else if (videoRef.current.hasOwnProperty('currentTime')) {
          // Handle if videoRef.current is our custom component with getter/setters
          videoRef.current.currentTime = segment.start;
          setCurrentSegmentIndex(index);
        }
      }
    }
    
    // Reset word position
    setWordHighlightPosition(0);
    
    // Try to play the video
    if (typeof videoRef.current.play === 'function') {
      videoRef.current.play();
    }
  };

  // Format timestamp (seconds) to MM:SS format
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Clear search
  const handleClearSearch = () => {
    setSearchTerm('');
  };

  // Render words with highlighting for the current word
  const renderHighlightedText = (text, isCurrentSegment) => {
    if (!isCurrentSegment) return text;
    
    const words = text.split(' ');
    
    return (
      <Box component="span">
        {words.map((word, idx) => (
          <Box
            component="span"
            key={idx}
            sx={{
              color: idx <= wordHighlightPosition ? 'primary.main' : 'text.secondary',
              fontWeight: idx <= wordHighlightPosition ? 'medium' : 'normal',
              transition: 'color 0.1s ease',
              mx: '1px'
            }}
          >
            {word}{idx < words.length - 1 ? ' ' : ''}
          </Box>
        ))}
      </Box>
    );
  };

  const handleWordClick = (word, index) => {
    if (!videoRef.current) return;
    
    // Set video time to word start time
    let video;
    if (videoRef.current.isCustomPlayer) {
      // This is our custom VideoPlayer component
      video = videoRef.current;
    } else if (videoRef.current instanceof HTMLVideoElement) {
      // This is a direct video element
      video = videoRef.current;
    } else if (videoRef.current.videoElement instanceof HTMLVideoElement) {
      // Access the video element through the videoElement getter
      video = videoRef.current.videoElement;
    }
    
    if (!video) return;
    
    // Set video time to word start time
    video.currentTime = word.start;
    setWordHighlightPosition(index);
  };

  if (!transcript || transcript.length === 0) {
    return (
      <Paper elevation={1} sx={{ p: 2, mb: 2, borderRadius: 2 }}>
        <Box display="flex" alignItems="center" justifyContent="center" height="100px">
          <Typography variant="subtitle1" color="text.secondary" align="center">
            No transcript available for this video.
          </Typography>
        </Box>
      </Paper>
    );
  }

  return (
    <Paper 
      elevation={2} 
      sx={{ 
        borderRadius: 2, 
        overflow: 'hidden',
        height: '100%',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <Box 
        sx={{ 
          p: 1.5, 
          borderBottom: '1px solid', 
          borderColor: 'divider',
          display: 'flex',
          flexDirection: 'column',
          gap: 1
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <TextFormatIcon sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h6">Transcript</Typography>
          </Box>
          
          <Box>
            <Tooltip title="Current time">
              <Typography 
                variant="body2" 
                color="text.secondary" 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  fontSize: '0.85rem',
                  bgcolor: 'action.hover',
                  px: 1,
                  py: 0.5,
                  borderRadius: 1
                }}
              >
                <AccessTimeIcon sx={{ fontSize: '1rem', mr: 0.5 }} />
                {formatTime(currentTime)}
              </Typography>
            </Tooltip>
          </Box>
        </Box>
        
        <TextField
          placeholder="Search in transcript..."
          size="small"
          fullWidth
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
            sx: { borderRadius: 2 }
          }}
        />
      </Box>
      
      <List
        ref={transcriptListRef}
        sx={{ 
          overflowY: 'auto', 
          flexGrow: 1,
          p: 0,
          '& .MuiListItem-root.active': {
            bgcolor: theme => alpha(theme.palette.primary.main, 0.08),
            borderLeft: '4px solid',
            borderColor: 'primary.main'
          }
        }}
      >
        {filteredTranscript.map((segment, index) => {
          // Check if this segment is the current segment in the original transcript
          const isCurrentSegment = searchTerm 
            ? transcript[currentSegmentIndex]?.start === segment.start
            : index === currentSegmentIndex;
          
          return (
            <ListItem
              key={index}
              button
              onClick={() => handleSegmentClick(index, segment.start)}
              className={isCurrentSegment ? 'active' : ''}
              ref={isCurrentSegment ? activeItemRef : null}
              sx={{ 
                px: 2, 
                py: 1.5,
                cursor: 'pointer',
                borderLeft: isCurrentSegment ? '4px solid' : '4px solid transparent',
                borderColor: isCurrentSegment ? 'primary.main' : 'transparent',
                transition: 'all 0.2s ease',
                '&:hover': {
                  bgcolor: theme => alpha(theme.palette.action.hover, 0.8)
                }
              }}
            >
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'flex-start', 
                width: '100%' 
              }}>
                <Box sx={{ 
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  mr: 1.5,
                  minWidth: '40px'
                }}>
                  <Typography 
                    variant="caption" 
                    color={isCurrentSegment ? 'primary.main' : 'text.secondary'}
                    sx={{ 
                      fontWeight: isCurrentSegment ? 'medium' : 'normal',
                      mb: 0.5,
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    {formatTime(segment.start)}
                  </Typography>
                  
                  <IconButton 
                    size="small" 
                    color={isCurrentSegment ? "primary" : "default"}
                    sx={{ 
                      p: 0.5,
                      opacity: isCurrentSegment ? 1 : 0.4,
                      '&:hover': {
                        opacity: 1,
                        bgcolor: theme => alpha(theme.palette.primary.main, 0.1)
                      }
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSegmentClick(index, segment.start);
                    }}
                  >
                    <PlayArrowIcon fontSize="small" />
                  </IconButton>
                </Box>
                
                <Box sx={{ flex: 1 }}>
                  <Typography 
                    variant={isCurrentSegment ? 'body1' : 'body2'}
                    sx={{ 
                      lineHeight: 1.6,
                      position: 'relative',
                      display: 'inline'
                    }}
                  >
                    {searchTerm ? (
                      // Highlight matching text if searching
                      highlightText(segment.text, searchTerm)
                    ) : (
                      // Render with word-by-word highlighting
                      renderHighlightedText(segment.text, isCurrentSegment)
                    )}
                  </Typography>
                </Box>
              </Box>
            </ListItem>
          );
        })}
        
        {filteredTranscript.length === 0 && searchTerm && (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              No matches found for "{searchTerm}"
            </Typography>
          </Box>
        )}
      </List>
      
      {searchTerm && filteredTranscript.length > 0 && (
        <Box sx={{ p: 1, borderTop: '1px solid', borderColor: 'divider', bgcolor: 'action.hover' }}>
          <Typography variant="caption" color="text.secondary">
            Found {filteredTranscript.length} matches
            <Box component="span" sx={{ ml: 1, cursor: 'pointer', color: 'primary.main' }} onClick={handleClearSearch}>
              Clear search
            </Box>
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

// Helper function to highlight search term in text
const highlightText = (text, searchTerm) => {
  if (!searchTerm) return text;
  
  const parts = text.split(new RegExp(`(${searchTerm})`, 'gi'));
  
  return (
    <>
      {parts.map((part, i) => 
        part.toLowerCase() === searchTerm.toLowerCase() ? (
          <Box 
            component="span" 
            key={i} 
            sx={{ 
              bgcolor: theme => alpha(theme.palette.warning.main, 0.3),
              fontWeight: 'medium',
              px: 0.5,
              py: 0.1,
              borderRadius: 0.5
            }}
          >
            {part}
          </Box>
        ) : (
          part
        )
      )}
    </>
  );
};

export default VideoTranscript; 