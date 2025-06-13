import { httpsCallable } from 'firebase/functions';
import { functions } from './firebase';

// Define the function interfaces
interface MatchCandidatesRequest {
  jobId: string;
  jobDescription: string;
  candidateIds?: string[];
}

interface MatchCandidatesResponse {
  results: Array<{
    candidateId: string;
    overallScore: number;
    skillsScore: number;
    experienceScore: number;
    educationScore: number;
    semanticScore: number;
    breakdown: {
      requiredSkillsMatched: string[];
      preferredSkillsMatched: string[];
      missingRequiredSkills: string[];
      experienceLevel: string;
      educationLevel: string;
      additionalStrengths: string[];
    };
  }>;
  jobRequirements: any;
  totalCandidates: number;
}

interface GenerateSpeechRequest {
  text: string;
  voiceId?: string;
  stability?: number;
  similarityBoost?: number;
}

interface GenerateSpeechResponse {
  audioUrl: string;
  audioId: string;
}

// Create callable functions
export const matchCandidatesToJob = httpsCallable<MatchCandidatesRequest, MatchCandidatesResponse>(
  functions, 
  'enhancedMatchCandidatesToJob'
);

export const generateSpeech = httpsCallable<GenerateSpeechRequest, GenerateSpeechResponse>(
  functions, 
  'generateSpeech'
);

// Function utilities
export const functionUtils = {
  // Match candidates to a specific job with enhanced scoring
  async matchCandidates(jobId: string, jobDescription: string, candidateIds?: string[]) {
    try {
      const result = await matchCandidatesToJob({ jobId, jobDescription, candidateIds });
      return result.data;
    } catch (error) {
      console.error('Error matching candidates:', error);
      throw error;
    }
  },

  // Generate speech from text
  async generateSpeechFromText(
    text: string, 
    options: { voiceId?: string; stability?: number; similarityBoost?: number } = {}
  ) {
    try {
      const result = await generateSpeech({ 
        text, 
        ...options 
      });
      return result.data;
    } catch (error) {
      console.error('Error generating speech:', error);
      throw error;
    }
  },

  // Handle function errors
  handleFunctionError(error: any) {
    if (error.code === 'functions/unauthenticated') {
      return 'You must be signed in to perform this action.';
    } else if (error.code === 'functions/permission-denied') {
      return 'You do not have permission to perform this action.';
    } else if (error.code === 'functions/not-found') {
      return 'The requested resource was not found.';
    } else if (error.code === 'functions/invalid-argument') {
      return 'Invalid request parameters.';
    } else if (error.code === 'functions/internal') {
      return 'An internal server error occurred. Please try again later.';
    } else {
      return error.message || 'An unexpected error occurred.';
    }
  }
};

// Export types for use in components
export type { 
  MatchCandidatesRequest, 
  MatchCandidatesResponse, 
  GenerateSpeechRequest, 
  GenerateSpeechResponse 
};