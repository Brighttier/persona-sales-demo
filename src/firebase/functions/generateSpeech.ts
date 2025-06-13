import * as functions from 'firebase-functions';
import fetch from 'node-fetch'; // Assuming node-fetch is available or will be installed

const ELEVEN_LABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const ELEVEN_LABS_API_URL = 'https://api.elevenlabs.io/v1/text-to-speech/'; // Base URL for text-to-speech

// Replace with a default voice ID from Eleven Labs if not provided by the frontend
const DEFAULT_VOICE_ID = '21m00Tcm4TlvDq8ikWAM'; // Example: Rachel voice ID

export const generateSpeech = functions.https.onCall(async (data, context) => {
  // Optional: Check if the user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
  }

  const { text, voiceId = DEFAULT_VOICE_ID } = data; // Get text and optional voiceId from request data

  if (!text) {
    throw new functions.https.HttpsError('invalid-argument', 'The text parameter is required.');
  }

  if (!ELEVEN_LABS_API_KEY) {
    console.error('Eleven Labs API Key not configured.');
    throw new functions.https.HttpsError('internal', 'Server configuration error.');
  }

  try {
    const response = await fetch(`${ELEVEN_LABS_API_URL}${voiceId}`, {
      method: 'POST',
      headers: {
        'xi-api-key': ELEVEN_LABS_API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg', // Request audio in mp3 format
      },
      body: JSON.stringify({
        text: text,
        model_id: "eleven_monolingual_v1", // Or another appropriate model_id
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.5
        },
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`Eleven Labs API error: ${response.status} - ${errorBody}`);
      throw new functions.https.HttpsError('internal', 'Error generating speech from Eleven Labs.', errorBody);
    }

    // Get the audio data as a buffer
    const audioBuffer = await response.buffer();

    // Convert the buffer to a Base64 string to return in the response
    const audioBase64 = audioBuffer.toString('base64');

    return { audioContent: audioBase64, contentType: 'audio/mpeg' };

  } catch (error: any) {
    console.error('Error calling Eleven Labs API:', error);
     if (error instanceof functions.https.HttpsError) {
      throw error; // Re-throw HttpsError
    } else {
       // Wrap other errors in HttpsError
      throw new functions.https.HttpsError('internal', 'An unexpected error occurred while generating speech.', error.message);
    }
  }
});
