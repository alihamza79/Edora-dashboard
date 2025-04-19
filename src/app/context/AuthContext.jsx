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
            
            // Add role to user object - use role or userType field from database
            setUser({
              ...loggedInUser,
              role: userData.role || userData.userType || 'student' // Try both fields with fallback
            });
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
          
          // Add role to user object
          setUser({
            ...loggedInUser,
            role: userData.role || userData.userType || 'student' // Try both fields with fallback
          });
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
  const signup = async (email, password, name) => {
    try {
      // Create user account
      const newUser = await account.create('unique()', email, password, name);
      
      // Login immediately after signup
      await account.createEmailSession(email, password);
      
      // Get the full user object
      const currentUser = await account.get();
      setUser(currentUser);
      
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