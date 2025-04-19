# Course Chat Feature Setup

This document provides instructions for setting up the Course Chat feature in Appwrite.

## Appwrite Collection Setup

### 1. Create the CourseChats Collection

1. Log in to your Appwrite Console
2. Navigate to your project
3. Go to Databases > Your Database (ID: `680348c20012c0e4a6ac`)
4. Click "Create Collection"
5. Enter the following details:
   - Collection ID: Automatically generated (e.g., `courseChats`)
   - Name: `Course Chats`
   - Permissions: Set appropriate permissions (for example, users can read all messages but only create their own)

### 2. Create Required Attributes

Create the following attributes in the CourseChats collection:

#### `courseId` (String, Required)
- Type: String
- Required: Yes
- Default: None
- Array: No
- Min Length: 1
- Max Length: 255

#### `userId` (String, Required)
- Type: String
- Required: Yes
- Default: None
- Array: No
- Min Length: 1
- Max Length: 255

#### `userName` (String, Required)
- Type: String
- Required: Yes
- Default: None
- Array: No
- Min Length: 1
- Max Length: 255

#### `userAvatar` (String, Optional)
- Type: String
- Required: No
- Default: None
- Array: No
- Min Length: 0
- Max Length: 2048

#### `message` (String, Required)
- Type: String
- Required: Yes
- Default: None
- Array: No
- Min Length: 1
- Max Length: 5000

#### `createdAt` (String, Required)
- Type: String
- Required: Yes
- Default: None
- Array: No
- Min Length: 1
- Max Length: 255

### 3. Create Indexes

Create the following indexes to optimize queries:

#### `course_time_index`
- Type: Key
- Attributes: `courseId`, `createdAt` (ASC)

### 4. Update Collection ID in Config

After creating the collection, update the collection ID in `src/appwrite/collections.js`:

```javascript
// Define collection IDs
export const collections = {
    // Other collections...
    courseChats: 'your-generated-collection-id', // Replace with the actual collection ID
};
```

## 5. Set Collection Permissions

Set the following permissions for the CourseChats collection:

- Read: Allow users with role "user" or "admin" to read any document
- Create: Allow users with role "user" or "admin" to create documents only if `document.userId == user.$id`
- Update: Allow only admin or the message author to update documents
- Delete: Allow only admin or the message author to delete documents

## Testing the Chat Feature

1. Navigate to a course page
2. If you're enrolled in the course, you should see the chat component below the video player
3. Try sending messages and see if they appear in the chat
4. Open another browser/session and test if real-time updates are working properly 