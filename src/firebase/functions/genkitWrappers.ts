// Firebase Functions to wrap Genkit AI flows
import * as functions from 'firebase-functions';

// Import Genkit flows
import { aiInterviewSimulation } from '../../ai/flows/ai-interview-simulation';
import { aiCandidateScreening } from '../../ai/flows/ai-candidate-screening';

// AI Interview Simulation wrapper
export const aiInterviewSimulationFunction = functions.https.onCall(async (data, context) => {
  // Check authentication
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated to use AI features.');
  }

  try {
    // Validate input
    const { jobDescription, candidateResume, videoDataUri, fullTranscript } = data;
    
    if (!jobDescription || !candidateResume || !videoDataUri || !fullTranscript) {
      throw new functions.https.HttpsError(
        'invalid-argument', 
        'Missing required parameters: jobDescription, candidateResume, videoDataUri, fullTranscript'
      );
    }

    // Call the Genkit flow
    const result = await aiInterviewSimulation({
      jobDescription,
      candidateResume,
      videoDataUri,
      fullTranscript
    });

    return result;
  } catch (error: any) {
    console.error('AI Interview Simulation error:', error);
    
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    
    throw new functions.https.HttpsError(
      'internal', 
      'Failed to analyze interview',
      error.message
    );
  }
});

// AI Candidate Screening wrapper
export const aiCandidateScreeningFunction = functions.https.onCall(async (data, context) => {
  // Check authentication
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated to use AI features.');
  }

  try {
    // Validate input
    const { jobDetails, resume, candidateProfile } = data;
    
    if (!jobDetails || !resume) {
      throw new functions.https.HttpsError(
        'invalid-argument', 
        'Missing required parameters: jobDetails, resume'
      );
    }

    // Call the Genkit flow
    const result = await aiCandidateScreening({
      jobDetails,
      resume,
      candidateProfile
    });

    return result;
  } catch (error: any) {
    console.error('AI Candidate Screening error:', error);
    
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    
    throw new functions.https.HttpsError(
      'internal', 
      'Failed to screen candidate',
      error.message
    );
  }
});

// You can add more wrapper functions for other Genkit flows as needed
// Example structure for other flows:

/*
export const generateJobPostingFunction = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated to use AI features.');
  }

  try {
    // Import and call your Genkit flow
    // const { generateJobPosting } = await import('../../ai/flows/generate-job-posting-flow');
    // const result = await generateJobPosting(data);
    // return result;
  } catch (error: any) {
    console.error('Job Posting Generation error:', error);
    throw new functions.https.HttpsError('internal', 'Failed to generate job posting', error.message);
  }
});
*/