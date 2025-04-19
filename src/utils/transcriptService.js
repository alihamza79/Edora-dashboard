/**
 * Transcript Service - Utility functions for video transcript generation
 * Uses AssemblyAI for high-quality transcription (free tier available)
 */

// Get the AssemblyAI API key from environment variables
const ASSEMBLYAI_API_KEY = process.env.NEXT_PUBLIC_ASSEMBLYAI_API_KEY || '8e2e36a1c5be44d884001d96fb772df7';

/**
 * Request transcript generation for a video
 * @param {string} videoUrl - URL of the video to transcribe
 * @param {string} contentId - ID of the course content
 * @returns {Promise<Object>} - Response from the API
 */
export async function generateTranscript(videoUrl, contentId) {
  try {
    if (!videoUrl || !contentId) {
      throw new Error('Video URL and Content ID are required');
    }

    // Use AssemblyAI for transcript generation
    return generateTranscriptWithAssemblyAI(videoUrl, contentId);
  } catch (error) {
    console.error('Error generating transcript:', error);
    throw error;
  }
}

/**
 * Generate transcript using AssemblyAI service
 * @param {string} videoUrl - URL of the video to transcribe
 * @param {string} contentId - ID of the course content
 * @returns {Promise<Object>} - Response with transcript data
 */
export async function generateTranscriptWithAssemblyAI(videoUrl, contentId) {
  try {
    console.log('Transcript generation started for:', { videoUrl, contentId });
    const API_KEY = ASSEMBLYAI_API_KEY;
    
    console.log('Using AssemblyAI API Key:', API_KEY.slice(0, 5) + '...');
    
    // Step 1: Start a transcription job
    console.log('Sending POST request to AssemblyAI API...');
    const response = await fetch('https://api.assemblyai.com/v2/transcript', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': API_KEY,
      },
      body: JSON.stringify({
        audio_url: videoUrl,
        speaker_labels: true,
        auto_chapters: true,
        punctuate: true,
        format_text: true
      }),
    });

    console.log('AssemblyAI response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('AssemblyAI API error response:', errorText);
      throw new Error(`Failed to start transcription job: ${response.status} ${response.statusText}`);
    }

    const responseData = await response.json();
    console.log('AssemblyAI response data:', responseData);
    
    const transcriptId = responseData.id;
    if (!transcriptId) {
      throw new Error('No transcript ID received from AssemblyAI');
    }
    
    console.log(`Transcription job started with ID: ${transcriptId}`);

    // Step 2: Poll for transcription completion
    let transcript;
    let status = 'processing';
    let pollCount = 0;
    const maxPolls = 60; // Maximum number of polling attempts (3 minutes at 3s intervals)

    console.log('Waiting for transcription to complete...');
    while (status !== 'completed' && status !== 'error' && pollCount < maxPolls) {
      await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3 seconds between polls
      pollCount++;
      
      console.log(`Polling for status (attempt ${pollCount}/${maxPolls})...`);
      
      const pollingResponse = await fetch(`https://api.assemblyai.com/v2/transcript/${transcriptId}`, {
        headers: {
          'Authorization': API_KEY,
        },
      });

      if (!pollingResponse.ok) {
        const errorText = await pollingResponse.text();
        console.error('Polling error response:', errorText);
        throw new Error(`Failed to get transcription status: ${pollingResponse.status} ${pollingResponse.statusText}`);
      }

      const result = await pollingResponse.json();
      status = result.status;
      console.log(`Transcription status: ${status}`);

      if (status === 'completed') {
        transcript = result;
      } else if (status === 'error') {
        throw new Error(`Transcription error: ${result.error}`);
      }
    }
    
    if (pollCount >= maxPolls && status !== 'completed') {
      throw new Error('Transcription timed out');
    }

    if (!transcript) {
      throw new Error('No transcript data received');
    }

    console.log('Transcription completed. Processing result...');
    console.log('Transcript data:', transcript);
    
    // Step 3: Format the transcript data
    let segmented = [];
    
    if (transcript.words && transcript.words.length > 0) {
      // Format words into our transcript format
      console.log(`Processing ${transcript.words.length} words...`);
      
      const formattedWords = transcript.words.map((word, index, words) => {
        const nextWordIndex = index + 1;
        const end = nextWordIndex < words.length ? words[nextWordIndex].start : word.end;
        
        return {
          start: word.start / 1000, // Convert to seconds
          end: end / 1000,
          text: word.text,
        };
      });

      // Group words into sentences for better readability
      let currentSegment = null;

      for (const word of formattedWords) {
        if (!currentSegment) {
          currentSegment = { ...word };
        } else if (word.start - currentSegment.end < 1.5) { // Group words within 1.5 seconds
          currentSegment.end = word.end;
          currentSegment.text += ' ' + word.text;
        } else {
          segmented.push(currentSegment);
          currentSegment = { ...word };
        }
      }

      if (currentSegment) {
        segmented.push(currentSegment);
      }
    } else if (transcript.utterances && transcript.utterances.length > 0) {
      // Use utterances if available
      console.log(`Processing ${transcript.utterances.length} utterances...`);
      
      segmented = transcript.utterances.map(utterance => ({
        start: utterance.start / 1000,
        end: utterance.end / 1000,
        text: utterance.text
      }));
    } else if (transcript.text) {
      // Fallback: create segments based on paragraphs
      console.log('No word-level timings, using text paragraphs...');
      
      const text = transcript.text;
      const paragraphs = text.split('\n').filter(p => p.trim().length > 0);
      
      console.log(`Found ${paragraphs.length} paragraphs`);
      
      // Estimate durations based on word count if no time information
      const totalDuration = transcript.audio_duration / 1000 || 60; // Default to 60s if unknown
      const segmentDuration = totalDuration / paragraphs.length;
      
      segmented = paragraphs.map((text, index) => ({
        start: index * segmentDuration,
        end: (index + 1) * segmentDuration,
        text
      }));
    } else {
      throw new Error('No usable transcript content found');
    }

    console.log(`Transcript formatted into ${segmented.length} segments`);
    console.log('Final transcript data sample:', segmented.slice(0, 2));
    
    // Step 4: Update the course content with transcript data
    console.log('Saving transcript to database...');
    
    // If testing in development, log the payload
    if (process.env.NODE_ENV === 'development') {
      console.log('Transcript save payload:', {
        contentId,
        segmentCount: segmented.length
      });
    }
    
    const saveResponse = await fetch('/api/updateTranscript', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contentId,
        transcript: segmented,
      }),
    });
    
    if (!saveResponse.ok) {
      const errorText = await saveResponse.text();
      console.error('Error saving transcript:', errorText);
      throw new Error(`Failed to save transcript: ${saveResponse.status}`);
    }
    
    const saveResult = await saveResponse.json();
    console.log('Transcript save response:', saveResult);

    return {
      success: true,
      segments: segmented.length,
    };
  } catch (error) {
    console.error('Error generating transcript with AssemblyAI:', error);
    // Create an example transcript for testing purposes
    if (process.env.NODE_ENV === 'development') {
      console.log('Creating mock transcript for development...');
      try {
        const mockTranscript = [
          { start: 0, end: 5, text: "Welcome to this course video." },
          { start: 5, end: 10, text: "Today we'll be learning about important concepts." },
          { start: 10, end: 15, text: "Let's get started with the basics." }
        ];
        
        // Save the mock transcript
        await fetch('/api/updateTranscript', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contentId,
            transcript: mockTranscript,
          }),
        });
        
        console.log('Mock transcript saved for development');
        return {
          success: true,
          segments: mockTranscript.length,
          mock: true
        };
      } catch (mockError) {
        console.error('Error saving mock transcript:', mockError);
      }
    }
    
    throw error;
  }
} 