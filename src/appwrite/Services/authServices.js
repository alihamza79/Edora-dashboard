import { account, databases, databaseId } from "../config";
import { ID, Query } from "appwrite";
import collections from "../collections";

// Use the Users collection ID from collections.js
const USER_COLLECTION_ID = collections.users;

export async function registerUser(username, email, password) {
  try {
    // Create the user account
    const user = await account.create(ID.unique(), email, password, username);
    
    // Get user type from localStorage (this will be set in the UI)
    const userType = localStorage.getItem('userType') || 'student';
    
    // Store additional user data in database
    await databases.createDocument(
      databaseId,
      USER_COLLECTION_ID,
      ID.unique(),
      {
        userId: user.$id,
        name: username,
        email: email,
        userType: userType,
        createdAt: new Date().toISOString(),
      }
    );
    
    localStorage.setItem("authToken", user.$id);
    return user;
  } catch (error) {
    console.error("Registration error:", error);
    throw error;
  }
}

export const signIn = async (email, password) => {
  try {
    const session = await account.createEmailPasswordSession(email, password);
    localStorage.setItem("authToken", session.$id); // Store the session ID
    
    // Get user profile from database
    const user = await account.get();
    
    // Find the user's profile with additional data
    const profiles = await databases.listDocuments(
      databaseId,
      USER_COLLECTION_ID,
      [Query.equal("userId", user.$id)]
    );
    
    if (profiles.documents.length > 0) {
      const userProfile = profiles.documents[0];
      localStorage.setItem("userType", userProfile.userType);
    }
    
    return session;
  } catch (error) {
    console.error("Login error:", error); // Log the error details
    throw error;
  }
};

export const signOutUser = async () => {
  try {
    await account.deleteSession('current');
    localStorage.removeItem("authToken");
    localStorage.removeItem("userType");
  } catch (error) {
    throw error;
  }
};

export const getCurrentUser = async () => {
  try {
    const user = await account.get();
    return user;
  } catch (error) {
    throw error;
  }
};

export const getUserProfile = async () => {
  try {
    const user = await account.get();
    
    // Find the user's profile with additional data
    const profiles = await databases.listDocuments(
      databaseId,
      USER_COLLECTION_ID,
      [Query.equal("userId", user.$id)]
    );
    
    if (profiles.documents.length > 0) {
      return profiles.documents[0];
    }
    
    return null;
  } catch (error) {
    throw error;
  }
};

export const checkAuth = async () => {
  try {
    await account.get(); // If this doesn't throw an error, the user is authenticated
    return true;
  } catch (error) {
    return false;
  }
};

export const sendPasswordRecoveryEmail = async (email) => {
  const resetPasswordUrl = `${window.location.origin}/reset-password`; // Automatically construct URL
  try {
    await account.createRecovery(email, resetPasswordUrl);
  } catch (error) {
    throw error;
  }
};