'use client';

import { useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import CustomTextField from '@/app/components/forms/theme-elements/CustomTextField';
import CustomFormLabel from '@/app/components/forms/theme-elements/CustomFormLabel';
import Stack from '@mui/material/Stack';
import Paper from '@mui/material/Paper';
import SchoolIcon from '@mui/icons-material/School';
import PersonIcon from '@mui/icons-material/Person';
import Alert from '@mui/material/Alert';
import AuthSocialButtons from './AuthSocialButtons';
import { registerUser, signIn } from '@/appwrite/Services/authServices';

const AuthRegister = ({ title, subtitle, subtext }) => {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [userType, setUserType] = useState('student');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  const validateInputs = () => {
    const errors = {};
    
    if (!name.trim()) {
      errors.name = 'Name is required';
    }
    
    if (!email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = 'Email is invalid';
    }
    
    if (!password) {
      errors.password = 'Password is required';
    } else if (password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    }
    
    if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validate inputs
    if (!validateInputs()) {
      return;
    }
    
    setLoading(true);

    try {
      // Register the user with Appwrite
      const user = await registerUser(name, email, password, userType);
      
      // Store user type in localStorage
      localStorage.setItem('userType', userType);
      
      // Automatically login after registration
      await signIn(email, password);
      
      // Redirect based on user type
      if (userType === 'tutor') {
        router.push('/dashboard/tutor');
      } else {
        router.push('/dashboard/student');
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.message || 'Failed to register. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {title ? (
        <Typography fontWeight="700" variant="h3" mb={1}>
          {title}
        </Typography>
      ) : null}

      {subtext}
      
      {error && (
        <Alert severity="error" sx={{ mt: 1, mb: 1 }}>
          {error}
        </Alert>
      )}
      
      <AuthSocialButtons title="Sign up with" />

      <Box mt={3}>
        <Divider>
          <Typography
            component="span"
            color="textSecondary"
            variant="h6"
            fontWeight="400"
            position="relative"
            px={2}
          >
            or sign up with
          </Typography>
        </Divider>
      </Box>

      <Box>
        <form onSubmit={handleSubmit}>
          <Stack mb={3}>
            <CustomFormLabel htmlFor="name">Name</CustomFormLabel>
            <CustomTextField 
              id="name" 
              variant="outlined" 
              fullWidth 
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              error={!!validationErrors.name}
              helperText={validationErrors.name}
            />
            <CustomFormLabel htmlFor="email">Email Address</CustomFormLabel>
            <CustomTextField 
              id="email" 
              variant="outlined" 
              fullWidth 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              type="email"
              error={!!validationErrors.email}
              helperText={validationErrors.email}
            />
            <CustomFormLabel htmlFor="password">Password</CustomFormLabel>
            <CustomTextField 
              id="password" 
              variant="outlined" 
              fullWidth 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              type="password"
              error={!!validationErrors.password}
              helperText={validationErrors.password}
            />
            
            <CustomFormLabel htmlFor="confirmPassword">Confirm Password</CustomFormLabel>
            <CustomTextField 
              id="confirmPassword" 
              variant="outlined" 
              fullWidth 
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              type="password"
              error={!!validationErrors.confirmPassword}
              helperText={validationErrors.confirmPassword}
            />
            
            <Box mt={3}>
              <CustomFormLabel>Register as</CustomFormLabel>
              <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
                <Paper 
                  elevation={userType === 'student' ? 6 : 1}
                  sx={{ 
                    p: 2, 
                    flex: 1, 
                    cursor: 'pointer',
                    bgcolor: userType === 'student' ? 'primary.main' : 'background.paper',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      bgcolor: userType === 'student' ? 'primary.main' : 'grey.100'
                    }
                  }}
                  onClick={() => setUserType('student')}
                >
                  <Stack direction="row" spacing={1} alignItems="center">
                    <SchoolIcon sx={{ color: userType === 'student' ? '#fff' : 'inherit' }} />
                    <Typography 
                      variant="subtitle1" 
                      sx={{ 
                        color: userType === 'student' ? '#fff' : 'text.primary',
                        fontWeight: userType === 'student' ? 600 : 400
                      }}
                    >
                      Student
                    </Typography>
                  </Stack>
                </Paper>
                
                <Paper 
                  elevation={userType === 'tutor' ? 6 : 1}
                  sx={{ 
                    p: 2, 
                    flex: 1, 
                    cursor: 'pointer',
                    bgcolor: userType === 'tutor' ? 'primary.main' : 'background.paper',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      bgcolor: userType === 'tutor' ? 'primary.main' : 'grey.100'
                    }
                  }}
                  onClick={() => setUserType('tutor')}
                >
                  <Stack direction="row" spacing={1} alignItems="center">
                    <PersonIcon sx={{ color: userType === 'tutor' ? '#fff' : 'inherit' }} />
                    <Typography 
                      variant="subtitle1" 
                      sx={{ 
                        color: userType === 'tutor' ? '#fff' : 'text.primary',
                        fontWeight: userType === 'tutor' ? 600 : 400
                      }}
                    >
                      Tutor
                    </Typography>
                  </Stack>
                </Paper>
              </Stack>
            </Box>
          </Stack>
          <Button
            color="primary"
            variant="contained"
            size="large"
            fullWidth
            type="submit"
            disabled={loading}
          >
            {loading ? 'Signing up...' : 'Sign Up'}
          </Button>
        </form>
      </Box>
      {subtitle}
    </>
  );
};

export default AuthRegister;
