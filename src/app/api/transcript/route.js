import { NextResponse } from 'next/server';
import { Client, Databases, ID } from 'appwrite';
import { projectID, databaseId } from '@/appwrite/config';
import { collections } from '@/appwrite/collections';
import fetch from 'node-fetch';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import { pipeline } from 'stream/promises';
import os from 'os';

// Free OpenAI-compatible Whisper API endpoint
const WHISPER_API_URL = 'https://api.openai.com/v1/audio/transcriptions';
const WHISPER_API_KEY = process.env.OPENAI_API_KEY || '';

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

    // Step 1: Download the video file to a temporary location
    const tempDir = os.tmpdir();
    const videoFilePath = path.join(tempDir, `temp_video_${Date.now()}.mp4`);
    
    console.log(`Downloading video from ${videoUrl}...`);
    try {
      const response = await fetch(videoUrl);
      if (!response.ok) {
        throw new Error(`Failed to download video: ${response.statusText}`);
      }
      
      const fileStream = fs.createWriteStream(videoFilePath);
      await pipeline(response.body, fileStream);
      console.log(`Video downloaded to ${videoFilePath}`);
    } catch (error) {
      console.error('Error downloading video:', error);
      return NextResponse.json({ error: 'Failed to download video' }, { status: 500 });
    }

    // Step 2: Extract audio from video (we'll use ffmpeg in a production scenario)
    // For this example, we'll use the video directly since most APIs can handle this
    
    // Step 3: Send the file to Whisper API for transcription
    console.log('Sending to Whisper API for transcription...');
    let transcriptData;
    try {
      const formData = new FormData();
      formData.append('file', fs.createReadStream(videoFilePath));
      formData.append('model', 'whisper-1');
      formData.append('response_format', 'verbose_json');
      formData.append('timestamp_granularities', ['segment']);
      
      const whisperResponse = await fetch(WHISPER_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${WHISPER_API_KEY}`
        },
        body: formData
      });
      
      if (!whisperResponse.ok) {
        const errorText = await whisperResponse.text();
        throw new Error(`Whisper API error: ${errorText}`);
      }
      
      const result = await whisperResponse.json();
      
      // Format the data for our transcript format
      transcriptData = result.segments.map(segment => ({
        start: segment.start,
        end: segment.end,
        text: segment.text.trim()
      }));
      
      console.log(`Transcription completed: ${transcriptData.length} segments`);
    } catch (error) {
      console.error('Error transcribing video:', error);
      return NextResponse.json({ error: 'Failed to transcribe video' }, { status: 500 });
    } finally {
      // Clean up the temporary file
      try {
        fs.unlinkSync(videoFilePath);
        console.log('Temporary video file deleted');
      } catch (err) {
        console.error('Error deleting temporary file:', err);
      }
    }

    // Step 4: Save the transcript to Appwrite
    console.log('Saving transcript to database...');
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
          transcript: JSON.stringify(transcriptData)
        }
      );
      
      console.log('Transcript saved successfully');
    } catch (error) {
      console.error('Error saving transcript to database:', error);
      return NextResponse.json({ error: 'Failed to save transcript' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      segments: transcriptData.length
    });
  } catch (error) {
    console.error('Error processing transcript request:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 