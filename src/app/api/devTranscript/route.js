import { NextResponse } from 'next/server';
import { Client, Databases } from 'appwrite';
import { projectID, databaseId } from '@/appwrite/config';
import { collections } from '@/appwrite/collections';

// This is a simplified development-only transcript generation API
// It returns a mock transcript that can be used for testing
export async function POST(req) {
  try {
    const data = await req.json();
    const { videoUrl, contentId } = data;

    if (!videoUrl) {
      return NextResponse.json({ error: 'No video URL provided' }, { status: 400 });
    }

    if (!contentId) {
      return NextResponse.json({ error: 'No content ID provided' }, { status: 400 });
    }

    // Create a mock transcript with approximately 1 segment per 10 seconds
    // In a real implementation, this would be generated from the video audio
    const mockTranscript = generateMockTranscript();
    
    // Save the mock transcript to the database
    try {
      const client = new Client()
        .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
        .setProject(projectID);

      const databases = new Databases(client);
      
      // Update the course content document to include the transcript
      await databases.updateDocument(
        databaseId,
        collections.courseContents,
        contentId,
        {
          transcript: JSON.stringify(mockTranscript)
        }
      );
      
      console.log('Mock transcript saved successfully');
    } catch (error) {
      console.error('Error saving transcript to database:', error);
      return NextResponse.json({ error: 'Failed to save transcript' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      segments: mockTranscript.length,
      message: 'Mock transcript generated and saved successfully'
    });
  } catch (error) {
    console.error('Error processing transcript request:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Function to generate a mock transcript for development purposes
function generateMockTranscript() {
  const sentences = [
    "Welcome to this course video.",
    "In this lesson, we will learn about important concepts.",
    "Let's start by understanding the fundamentals.",
    "This is a critical topic that you need to master.",
    "There are several key points to remember.",
    "First, always practice what you learn.",
    "Second, review your notes regularly.",
    "Third, don't hesitate to ask questions.",
    "Let's now look at some practical examples.",
    "This example demonstrates how the concept works in real life.",
    "Notice how we apply the principles we discussed earlier.",
    "You can also try this approach in your own projects.",
    "Let's summarize what we've learned today.",
    "We covered the fundamental concepts and practical applications.",
    "In the next video, we'll explore more advanced topics.",
    "Thank you for watching, and see you in the next lesson."
  ];

  // Create segments with approximately 10 seconds each
  return sentences.map((text, index) => ({
    start: index * 10,
    end: (index + 1) * 10 - 0.5,
    text: text
  }));
} 