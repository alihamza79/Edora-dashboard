'use client';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useSelector } from 'react-redux';
import { IconPower } from '@tabler/icons-react';
import Link from 'next/link';
import React, { useState, useEffect } from 'react';
import { getUserProfile, signOutUser } from '@/appwrite/Services/authServices';
import { useRouter } from 'next/navigation';

export const Profile = () => {
  const customizer = useSelector((state) => state.customizer);
  const lgUp = useMediaQuery((theme) => theme.breakpoints.up('lg'));
  const hideMenu = lgUp ? customizer.isCollapse && !customizer.isSidebarHover : '';
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const profile = await getUserProfile();
        setUserProfile(profile);
      } catch (error) {
        console.error('Error fetching user profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  // Get user type for displaying role
  const userType = typeof window !== 'undefined' ? localStorage.getItem('userType') || 'student' : 'student';
  const roleName = userType === 'tutor' ? 'Tutor' : 'Student';

  const handleLogout = async () => {
    try {
      await signOutUser();
      router.push('/auth/auth1/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <Box
      display={'flex'}
      alignItems="center"
      gap={2}
      sx={{ m: 3, p: 2, bgcolor: `${'secondary.light'}` }}
    >
      {!hideMenu ? (
        <>
          <Avatar 
            alt={loading ? 'User' : (userProfile ? userProfile.name : 'Guest User')} 
            src={"/images/profile/user-1.jpg"} 
            sx={{height: 40, width: 40}} 
          />

          <Box>
            <Typography variant="h6">
              {loading ? 'Loading...' : (userProfile ? userProfile.name : 'Guest User')}
            </Typography>
            <Typography variant="caption">{roleName}</Typography>
          </Box>
          <Box sx={{ ml: 'auto' }}>
            <Tooltip title="Logout" placement="top">
              <IconButton
                color="primary"
                onClick={handleLogout}
                aria-label="logout"
                size="small"
              >
                <IconPower size="20" />
              </IconButton>
            </Tooltip>
          </Box>
        </>
      ) : (
        ''
      )}
    </Box>
  );
};
