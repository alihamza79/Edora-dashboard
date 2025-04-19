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
  const transcriptListRef = useRef(null);
  const activeItemRef = useRef(null);

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

  useEffect(() => {
    if (!videoRef || !videoRef.current) return;

    const handleTimeUpdate = () => {
      const currentTime = videoRef.current.currentTime;
      
      // Find the current segment based on video's current time
      const index = transcript.findIndex(
        segment => currentTime >= segment.start && currentTime <= segment.end
      );
      
      // If a valid segment is found, update the current segment index
      if (index !== -1) {
        setCurrentSegmentIndex(index);
      }
    };

    // Add event listener to video element
    const video = videoRef.current;
    video.addEventListener('timeupdate', handleTimeUpdate);

    // Cleanup
    return () => {
      if (video) {
        video.removeEventListener('timeupdate', handleTimeUpdate);
      }
    };
  }, [transcript, videoRef]);

  // Scroll to current segment when it changes
  useEffect(() => {
    if (activeItemRef.current && transcriptListRef.current && !searchTerm) {
      activeItemRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
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
    
    videoRef.current.play();
  };

  // Format timestamp (seconds) to MM:SS format
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Clear search
  const handleClearSearch = () => {
    setSearchTerm('');
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
                {videoRef && videoRef.current ? formatTime(videoRef.current.currentTime) : "00:00"}
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
                
                <Typography 
                  variant={isCurrentSegment ? 'body1' : 'body2'}
                  sx={{ 
                    fontWeight: isCurrentSegment ? 'medium' : 'normal',
                    color: isCurrentSegment ? 'text.primary' : 'text.secondary',
                    flex: 1,
                    lineHeight: 1.6
                  }}
                >
                  {searchTerm ? (
                    // Highlight matching text if searching
                    highlightText(segment.text, searchTerm)
                  ) : (
                    segment.text
                  )}
                </Typography>
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