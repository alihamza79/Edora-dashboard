'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { account, databases, databaseId } from '@/appwrite/config';
import { Client, Databases, Query } from 'appwrite';
import { collections } from '@/appwrite/collections';
import { projectID } from '@/appwrite/config';

// Create the auth context
const AuthContext = createContext();

// Custom hook to use the auth context
export const useAuth = () => {
  return useContext(AuthContext);
};

// Provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Helper function to determine user role from multiple sources
  const determineUserRole = (userData, loggedInUser) => {
    // Check userType field in user document
    let userRole = 'student'; // Default role
    
    // First check the userType from the user document
    if (userData && userData.userType) {
      userRole = userData.userType.toLowerCase();
    }
    
    // Then check localStorage as a backup
    const localUserType = localStorage.getItem('userType');
    if (!userRole || userRole === 'student') {
      if (localUserType) {
        userRole = localUserType.toLowerCase();
      }
    }
    
    // Normalize role names for consistency
    if (userRole === 'teacher') userRole = 'tutor';
    
    // Return the user object with role
    return {
      ...loggedInUser,
      role: userRole
    };
  };

  // Check if user is already logged in
  useEffect(() => {
    const checkUserStatus = async () => {
      try {
        const loggedInUser = await account.get();
        
        // Get user document for additional data (including role)
        try {
          // Query the users collection to find the user document
          const usersResponse = await databases.listDocuments(
            databaseId,
            collections.users,
            [Query.equal('userId', loggedInUser.$id)]
          );
          
          if (usersResponse.documents.length > 0) {
            const userData = usersResponse.documents[0];
            
            // Use helper function to determine role
            const userWithRole = determineUserRole(userData, loggedInUser);
            setUser(userWithRole);
          } else {
            // If user document not found, use default role
            setUser({
              ...loggedInUser,
              role: 'student' // Default role
            });
          }
        } catch (err) {
          console.error('Error fetching user data:', err);
          // If error fetching user doc, just use account info with default role
          setUser({
            ...loggedInUser,
            role: 'student' // Default role
          });
        }
      } catch (error) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkUserStatus();
  }, []);

  // Login function with similar modifications to detect role correctly
  const login = async (email, password) => {
    try {
      const session = await account.createEmailSession(email, password);
      const loggedInUser = await account.get();
      
      // Get user document for additional data (including role)
      try {
        // Query the users collection to find the user document
        const usersResponse = await databases.listDocuments(
          databaseId,
          collections.users,
          [Query.equal('userId', loggedInUser.$id)]
        );
        
        if (usersResponse.documents.length > 0) {
          const userData = usersResponse.documents[0];
          
          // Use helper function to determine role
          const userWithRole = determineUserRole(userData, loggedInUser);
          setUser(userWithRole);
          
          // Force redirect to the appropriate dashboard based on role
          if (userWithRole.role === 'student') {
            window.location.href = '/student/dashboard';
          } else if (userWithRole.role === 'tutor') {
            window.location.href = '/teacher/dashboard';
          } else {
            window.location.href = '/dashboard';
          }
        } else {
          // If user document not found, use default role
          setUser({
            ...loggedInUser,
            role: 'student' // Default role
          });
          
          // Redirect to student dashboard as fallback
          window.location.href = '/student/dashboard';
        }
      } catch (err) {
        console.error('Error fetching user data:', err);
        // If error fetching user doc, just use account info with default role
        setUser({
          ...loggedInUser,
          role: 'student' // Default role
        });
        
        // Redirect to student dashboard as fallback
        window.location.href = '/student/dashboard';
      }
      
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  };

  // Signup function
  const signup = async (email, password, name, role = 'student') => {
    try {
      // Create user account
      const newUser = await account.create('unique()', email, password, name);
      
      // Login immediately after signup
      await account.createEmailSession(email, password);
      
      // Get the full user object
      const currentUser = await account.get();
      
      // Normalize role
      let userRole = role.toLowerCase();
      if (userRole === 'teacher') userRole = 'tutor';
      
      try {
        // Create a user document in the database with the role
        await databases.createDocument(
          databaseId,
          collections.users,
          'unique()',
          {
            userId: currentUser.$id,
            name: name,
            email: email,
            userType: userRole
          }
        );
        
        // Set user in context with role
        const userWithRole = {
          ...currentUser,
          role: userRole
        };
        
        setUser(userWithRole);
        
        // Redirect to appropriate dashboard based on role
        if (userRole === 'student') {
          window.location.href = '/student/dashboard';
        } else if (userRole === 'tutor') {
          window.location.href = '/teacher/dashboard';
        } else {
          window.location.href = '/dashboard';
        }
      } catch (err) {
        console.error('Error creating user document:', err);
        // If error creating user document, just use default role
        setUser({
          ...currentUser,
          role: 'student'
        });
        
        // Redirect to student dashboard as fallback
        window.location.href = '/student/dashboard';
      }
      
      return { success: true, user: currentUser };
    } catch (error) {
      console.error('Signup error:', error);
      return { success: false, error: error.message };
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await account.deleteSession('current');
      setUser(null);
      
      // Force a complete page refresh to clear any cached UI state
      window.location.href = '/auth/login';
      
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      return { success: false, error: error.message };
    }
  };

  // Value to be provided by context
  const value = {
    user,
    loading,
    login,
    signup,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider; 