'use client';
import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { 
  Box, 
  IconButton, 
  Slider, 
  Typography, 
  Tooltip, 
  Stack,
  Paper,
  alpha
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import SpeedIcon from '@mui/icons-material/Speed';
import SettingsIcon from '@mui/icons-material/Settings';
import SubtitlesIcon from '@mui/icons-material/Subtitles';
import ForwardIcon from '@mui/icons-material/Forward10';
import ReplayIcon from '@mui/icons-material/Replay10';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import CheckIcon from '@mui/icons-material/Check';

/**
 * Enhanced video player component with custom controls
 * @param {Object} props - Component props
 * @param {string} props.src - URL of the video file
 * @param {string} props.title - Title of the video
 * @param {string} props.poster - URL of the poster image
 */
const VideoPlayer = forwardRef(({ src, title, poster }, ref) => {
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [buffering, setBuffering] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [seekTime, setSeekTime] = useState(null);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  
  const [speedMenuAnchor, setSpeedMenuAnchor] = useState(null);
  const speedMenuOpen = Boolean(speedMenuAnchor);
  
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const controlsTimeoutRef = useRef(null);
  
  // Expose video element methods via ref
  useImperativeHandle(ref, () => ({
    play: () => {
      videoRef.current?.play();
      setPlaying(true);
    },
    pause: () => {
      videoRef.current?.pause();
      setPlaying(false);
    },
    get currentTime() {
      return videoRef.current?.currentTime || 0;
    },
    set currentTime(time) {
      if (videoRef.current) {
        videoRef.current.currentTime = time;
        setCurrentTime(time);
      }
    },
    get paused() {
      return videoRef.current?.paused || true;
    },
    get duration() {
      return videoRef.current?.duration || 0;
    },
    // Direct access to the video element for compatibility with VideoTranscript
    get videoElement() {
      return videoRef.current;
    },
    // Allow checking if this is our custom player (not a direct video element)
    get isCustomPlayer() {
      return true;
    },
    addEventListener: (event, callback) => {
      const video = videoRef.current;
      if (video && typeof video.addEventListener === 'function') {
        video.addEventListener(event, callback);
      }
    },
    removeEventListener: (event, callback) => {
      const video = videoRef.current;
      if (video && typeof video.removeEventListener === 'function') {
        video.removeEventListener(event, callback);
      }
    }
  }));
  
  // Handle video events
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onVolumeChange = () => {
      setVolume(video.volume);
      setMuted(video.muted);
    };
    
    const onTimeUpdate = () => {
      setCurrentTime(video.currentTime);
    };
    
    const onLoadedMetadata = () => {
      setDuration(video.duration);
    };
    
    const onWaiting = () => {
      setBuffering(true);
    };
    
    const onCanPlay = () => {
      setBuffering(false);
    };
    
    const onRateChange = () => {
      setPlaybackRate(video.playbackRate);
    };
    
    // Add event listeners
    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);
    video.addEventListener('volumechange', onVolumeChange);
    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('loadedmetadata', onLoadedMetadata);
    video.addEventListener('waiting', onWaiting);
    video.addEventListener('canplay', onCanPlay);
    video.addEventListener('ratechange', onRateChange);
    
    // Clean up
    return () => {
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('volumechange', onVolumeChange);
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('loadedmetadata', onLoadedMetadata);
      video.removeEventListener('waiting', onWaiting);
      video.removeEventListener('canplay', onCanPlay);
      video.removeEventListener('ratechange', onRateChange);
    };
  }, []);
  
  // Auto-hide controls after a few seconds of inactivity
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    const showControlsOnMouseMove = () => {
      setShowControls(true);
      
      // Clear any existing timeout
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      
      // Set new timeout to hide controls after 3 seconds of inactivity
      if (playing) {
        controlsTimeoutRef.current = setTimeout(() => {
          setShowControls(false);
        }, 3000);
      }
    };
    
    container.addEventListener('mousemove', showControlsOnMouseMove);
    
    return () => {
      container.removeEventListener('mousemove', showControlsOnMouseMove);
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [playing]);
  
  // Display seek indicator temporarily
  useEffect(() => {
    if (seekTime) {
      const timeoutId = setTimeout(() => {
        setSeekTime(null);
      }, 1000);
      
      return () => clearTimeout(timeoutId);
    }
  }, [seekTime]);
  
  // Format time in MM:SS format
  const formatTime = (seconds) => {
    if (isNaN(seconds)) return '00:00';
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  // Play/pause video
  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    
    if (video.paused) {
      video.play();
    } else {
      video.pause();
    }
  };
  
  // Toggle mute
  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    
    video.muted = !video.muted;
  };
  
  // Change volume
  const handleVolumeChange = (_, newValue) => {
    const video = videoRef.current;
    if (!video) return;
    
    video.volume = newValue;
    if (newValue === 0) {
      video.muted = true;
    } else if (video.muted) {
      video.muted = false;
    }
  };
  
  // Seek to position
  const handleSeek = (_, newValue) => {
    const video = videoRef.current;
    if (!video) return;
    
    video.currentTime = newValue;
  };
  
  // Toggle fullscreen
  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;
    
    if (!document.fullscreenElement) {
      container.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
      setFullscreen(true);
    } else {
      document.exitFullscreen();
      setFullscreen(false);
    }
  };
  
  // Skip forward 10 seconds
  const skipForward = () => {
    const video = videoRef.current;
    if (!video) return;
    
    const newTime = Math.min(video.currentTime + 10, video.duration);
    video.currentTime = newTime;
    setSeekTime({ time: newTime, direction: 'forward' });
  };
  
  // Skip backward 10 seconds
  const skipBackward = () => {
    const video = videoRef.current;
    if (!video) return;
    
    const newTime = Math.max(video.currentTime - 10, 0);
    video.currentTime = newTime;
    setSeekTime({ time: newTime, direction: 'backward' });
  };
  
  // Change playback speed
  const handleSpeedChange = (speed) => {
    const video = videoRef.current;
    if (!video) return;
    
    video.playbackRate = speed;
    setSpeedMenuAnchor(null);
  };
  
  // Handle speed menu
  const handleSpeedClick = (event) => {
    setSpeedMenuAnchor(event.currentTarget);
  };
  
  const handleSpeedClose = () => {
    setSpeedMenuAnchor(null);
  };
  
  // Calculate progress for the progress bar
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  
  return (
    <Box 
      ref={containerRef}
      sx={{ 
        position: 'relative', 
        width: '100%', 
        height: '100%',
        bgcolor: 'black',
        overflow: 'hidden',
        borderRadius: 2,
        '&:hover': {
          '& .video-controls': {
            opacity: 1,
          }
        }
      }}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        playsInline
        onClick={togglePlay}
        style={{ 
          width: '100%', 
          height: '100%', 
          objectFit: 'contain',
          cursor: showControls ? 'default' : 'none'
        }}
      />
      
      {/* Seek Indicator */}
      {seekTime && (
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            bgcolor: alpha('#000', 0.7),
            color: 'white',
            borderRadius: '50%',
            width: 80,
            height: 80,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: 0.9,
            transition: 'opacity 0.3s ease'
          }}
        >
          {seekTime.direction === 'forward' ? (
            <ForwardIcon sx={{ fontSize: 28 }} />
          ) : (
            <ReplayIcon sx={{ fontSize: 28 }} />
          )}
          <Typography variant="caption" fontWeight="bold">
            {formatTime(seekTime.time)}
          </Typography>
        </Box>
      )}
      
      {/* Buffering Indicator */}
      {buffering && (
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: 'white',
            opacity: 0.8
          }}
        >
          <Typography variant="body1">Loading...</Typography>
        </Box>
      )}
      
      {/* Controls Layer */}
      <Box
        className="video-controls"
        sx={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          bgcolor: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0) 100%)',
          padding: 2,
          opacity: showControls ? 1 : 0,
          transition: 'opacity 0.3s ease',
          display: 'flex',
          flexDirection: 'column',
          pt: 5, // Extra padding to make gradient more visible
        }}
      >
        {/* Title (shown in fullscreen) */}
        {fullscreen && (
          <Typography 
            variant="body1" 
            color="white" 
            sx={{ 
              position: 'absolute',
              top: 16,
              left: 16,
              opacity: 0.9,
              textShadow: '0px 0px 4px rgba(0,0,0,0.5)'
            }}
          >
            {title}
          </Typography>
        )}
        
        {/* Progress Bar */}
        <Box sx={{ px: 1, width: '100%', mb: 1 }}>
          <Slider
            value={currentTime}
            min={0}
            max={duration}
            onChange={handleSeek}
            aria-label="Video Progress"
            sx={{
              color: 'primary.main',
              height: 4,
              '& .MuiSlider-thumb': {
                width: 8,
                height: 8,
                '&:hover, &.Mui-focusVisible': {
                  boxShadow: '0px 0px 0px 8px rgba(25, 118, 210, 0.16)'
                }
              },
              '& .MuiSlider-rail': {
                opacity: 0.5,
              }
            }}
          />
        </Box>
        
        {/* Controls Row */}
        <Stack direction="row" alignItems="center" spacing={1}>
          {/* Play/Pause Button */}
          <IconButton onClick={togglePlay} size="small" sx={{ color: 'white' }}>
            {playing ? <PauseIcon /> : <PlayArrowIcon />}
          </IconButton>
          
          {/* Skip Backward Button */}
          <IconButton onClick={skipBackward} size="small" sx={{ color: 'white' }}>
            <ReplayIcon />
          </IconButton>
          
          {/* Skip Forward Button */}
          <IconButton onClick={skipForward} size="small" sx={{ color: 'white' }}>
            <ForwardIcon />
          </IconButton>
          
          {/* Volume Controls */}
          <Box 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              width: showVolumeSlider ? 100 : 'auto',
              transition: 'width 0.2s ease'
            }}
            onMouseEnter={() => setShowVolumeSlider(true)}
            onMouseLeave={() => setShowVolumeSlider(false)}
          >
            <IconButton 
              onClick={toggleMute} 
              size="small" 
              sx={{ color: 'white' }}
            >
              {muted || volume === 0 ? <VolumeOffIcon /> : <VolumeUpIcon />}
            </IconButton>
            
            {showVolumeSlider && (
              <Slider
                size="small"
                value={muted ? 0 : volume}
                min={0}
                max={1}
                step={0.01}
                onChange={handleVolumeChange}
                aria-label="Volume"
                sx={{
                  ml: 1,
                  color: 'white',
                  width: 60,
                  '& .MuiSlider-track': {
                    border: 'none',
                  },
                  '& .MuiSlider-thumb': {
                    width: 12,
                    height: 12,
                    backgroundColor: '#fff',
                    '&:hover, &.Mui-focusVisible': {
                      boxShadow: '0px 0px 0px 8px rgba(255, 255, 255, 0.16)'
                    }
                  }
                }}
              />
            )}
          </Box>
          
          {/* Time Display */}
          <Typography variant="caption" sx={{ color: 'white', flex: 1, ml: 1 }}>
            {formatTime(currentTime)} / {formatTime(duration)}
          </Typography>
          
          {/* Playback Speed */}
          <Tooltip title="Playback Speed">
            <IconButton 
              onClick={handleSpeedClick}
              size="small" 
              sx={{ color: 'white' }}
            >
              <SpeedIcon />
            </IconButton>
          </Tooltip>
          
          {/* Speed Menu */}
          <Menu
            anchorEl={speedMenuAnchor}
            open={speedMenuOpen}
            onClose={handleSpeedClose}
            anchorOrigin={{
              vertical: 'top',
              horizontal: 'center',
            }}
            transformOrigin={{
              vertical: 'bottom',
              horizontal: 'center',
            }}
          >
            {[0.5, 0.75, 1, 1.25, 1.5, 2].map((speed) => (
              <MenuItem 
                key={speed} 
                onClick={() => handleSpeedChange(speed)}
                sx={{ 
                  minWidth: 120,
                  display: 'flex',
                  justifyContent: 'space-between'
                }}
              >
                <Typography>{speed === 1 ? 'Normal' : `${speed}x`}</Typography>
                {playbackRate === speed && <CheckIcon fontSize="small" color="primary" />}
              </MenuItem>
            ))}
          </Menu>
          
          {/* Captions Button */}
          <Tooltip title="Subtitles">
            <IconButton 
              size="small" 
              sx={{ color: 'white' }}
            >
              <SubtitlesIcon />
            </IconButton>
          </Tooltip>
          
          {/* Fullscreen Button */}
          <Tooltip title="Fullscreen">
            <IconButton 
              onClick={toggleFullscreen}
              size="small" 
              sx={{ color: 'white' }}
            >
              <FullscreenIcon />
            </IconButton>
          </Tooltip>
        </Stack>
      </Box>
      
      {/* Big Play Button */}
      {!playing && !buffering && (
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 70,
            height: 70,
            borderRadius: '50%',
            bgcolor: alpha('#000', 0.6),
            color: 'white',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            '&:hover': {
              bgcolor: alpha('#000', 0.8),
              transform: 'translate(-50%, -50%) scale(1.1)',
            }
          }}
          onClick={togglePlay}
        >
          <PlayArrowIcon sx={{ fontSize: 40 }} />
        </Box>
      )}
    </Box>
  );
});

VideoPlayer.displayName = 'VideoPlayer';

export default VideoPlayer; 