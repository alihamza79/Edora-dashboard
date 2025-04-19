import { NextResponse } from 'next/server';
import { Client, Databases } from 'appwrite';
import { projectID, databaseId } from '@/appwrite/config';
import { collections } from '@/appwrite/collections';

export async function POST(req) {
  try {
    const data = await req.json();
    const { contentId, transcript } = data;

    if (!contentId) {
      return NextResponse.json({ error: 'No content ID provided' }, { status: 400 });
    }

    if (!transcript || !Array.isArray(transcript)) {
      return NextResponse.json({ error: 'Invalid transcript data' }, { status: 400 });
    }

    // Initialize Appwrite client
    const client = new Client()
      .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
      .setProject(projectID);

    const databases = new Databases(client);
    
    // Update the course content document with the transcript
    await databases.updateDocument(
      databaseId,
      collections.courseContents,
      contentId,
      {
        transcript: JSON.stringify(transcript)
      }
    );
    
    return NextResponse.json({ 
      success: true,
      message: 'Transcript updated successfully'
    });
  } catch (error) {
    console.error('Error updating transcript:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message 
    }, { status: 500 });
  }
} 