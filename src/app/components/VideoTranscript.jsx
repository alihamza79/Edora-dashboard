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
    if (!videoRef || !videoRef.current) return;

    // Main time update handler
    const handleTimeUpdate = () => {
      const time = videoRef.current.currentTime;
      setCurrentTime(time);
      
      // Find the current segment based on video's current time
      const index = transcript.findIndex(
        segment => time >= segment.start && time <= segment.end
      );
      
      // If a valid segment is found, update the current segment index
      if (index !== -1) {
        setCurrentSegmentIndex(index);
        
        // Find the current word within the segment
        const currentSegment = processedTranscript.current[index];
        if (currentSegment && currentSegment.words) {
          const wordIdx = currentSegment.words.findIndex(
            word => time >= word.start && time <= word.end
          );
          
          if (wordIdx !== -1) {
            setWordHighlightPosition(wordIdx);
          }
        }
      }
    };

    // For smoother updates, create a timer
    const startTimeUpdateTimer = () => {
      // Clear any existing timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      
      // Update every 50ms for smoother word-by-word highlighting
      timerRef.current = setInterval(() => {
        if (videoRef.current && !videoRef.current.paused) {
          const time = videoRef.current.currentTime;
          setCurrentTime(time);
          
          // Find current segment
          const index = transcript.findIndex(
            segment => time >= segment.start && time <= segment.end
          );
          
          if (index !== -1) {
            if (index !== currentSegmentIndex) {
              setCurrentSegmentIndex(index);
            }
            
            // Find current word
            const currentSegment = processedTranscript.current[index];
            if (currentSegment && currentSegment.words) {
              const wordIdx = currentSegment.words.findIndex(
                word => time >= word.start && time <= word.end
              );
              
              if (wordIdx !== -1) {
                setWordHighlightPosition(wordIdx);
              }
            }
          }
        }
      }, 50);
    };

    // Add event listeners to video element
    const video = videoRef.current;
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('play', startTimeUpdateTimer);
    video.addEventListener('pause', () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    });
    
    // Start the timer
    startTimeUpdateTimer();

    // Cleanup
    return () => {
      if (video) {
        video.removeEventListener('timeupdate', handleTimeUpdate);
        video.removeEventListener('play', startTimeUpdateTimer);
        video.removeEventListener('pause', () => {
          if (timerRef.current) {
            clearInterval(timerRef.current);
          }
        });
      }
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [transcript, videoRef, currentSegmentIndex]);

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
      videoRef.current.currentTime = segmentStartTime;
      setCurrentSegmentIndex(actualIndex);
    } else {
      // Normal flow when not searching
      const segment = transcript[index];
      if (segment) {
        videoRef.current.currentTime = segment.start;
        setCurrentSegmentIndex(index);
      }
    }
    
    // Reset word position
    setWordHighlightPosition(0);
    
    videoRef.current.play();
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