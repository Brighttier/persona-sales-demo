// Genkit AI integration service for frontend
import { httpsCallable } from 'firebase/functions';
import { functions } from './firebase';

// Import flow types
import type { 
  AiInterviewSimulationInput, 
  AiInterviewSimulationOutput 
} from '@/ai/flows/ai-interview-simulation';
import type { 
  CandidateScreeningInput, 
  CandidateScreeningOutput 
} from '@/ai/flows/ai-candidate-screening';

// Since Genkit flows can't be called directly from the frontend,
// we create callable functions that wrap them
export const genkitService = {
  // AI Interview Simulation
  async runAIInterview(input: AiInterviewSimulationInput): Promise<AiInterviewSimulationOutput> {
    try {
      // In a production setup, you'd have a Firebase Function that calls the Genkit flow
      const aiInterviewFunction = httpsCallable<AiInterviewSimulationInput, AiInterviewSimulationOutput>(
        functions, 
        'aiInterviewSimulation'
      );
      
      const result = await aiInterviewFunction(input);
      return result.data;
    } catch (error) {
      console.error('AI Interview Simulation error:', error);
      // Fallback response
      return {
        overallAssessment: "Unable to analyze interview at this time. Please try again later.",
        keyStrengths: "• Analysis unavailable",
        areasForImprovement: "• Analysis unavailable", 
        communicationClarity: "Analysis unavailable",
        bodyLanguageAnalysis: "Analysis unavailable",
        relevanceToRole: "Analysis unavailable",
        hiringRecommendationJustification: "Unable to provide recommendation due to technical issues."
      };
    }
  },

  // AI Candidate Screening
  async screenCandidate(input: CandidateScreeningInput): Promise<CandidateScreeningOutput> {
    try {
      const candidateScreeningFunction = httpsCallable<CandidateScreeningInput, CandidateScreeningOutput>(
        functions, 
        'aiCandidateScreening'
      );
      
      const result = await candidateScreeningFunction(input);
      return result.data;
    } catch (error) {
      console.error('AI Candidate Screening error:', error);
      // Fallback response
      return {
        suitabilityScore: 0,
        summary: "Unable to analyze candidate at this time.",
        strengths: "Analysis unavailable",
        areasForImprovement: "Analysis unavailable",
        recommendation: "Please try again later or contact support."
      };
    }
  },

  // Job Posting Generation (if you have that flow)
  async generateJobPosting(input: any): Promise<any> {
    try {
      const jobPostingFunction = httpsCallable(functions, 'generateJobPosting');
      const result = await jobPostingFunction(input);
      return result.data;
    } catch (error) {
      console.error('Job Posting Generation error:', error);
      throw error;
    }
  },

  // Profile Enrichment
  async enrichProfile(input: any): Promise<any> {
    try {
      const profileEnrichmentFunction = httpsCallable(functions, 'profileEnrichment');
      const result = await profileEnrichmentFunction(input);
      return result.data;
    } catch (error) {
      console.error('Profile Enrichment error:', error);
      throw error;
    }
  },

  // Job Recommendation
  async getJobRecommendations(input: any): Promise<any> {
    try {
      const jobRecommendationFunction = httpsCallable(functions, 'jobRecommendation');
      const result = await jobRecommendationFunction(input);
      return result.data;
    } catch (error) {
      console.error('Job Recommendation error:', error);
      throw error;
    }
  },

  // Interview Guide Generation
  async generateInterviewGuide(input: any): Promise<any> {
    try {
      const interviewGuideFunction = httpsCallable(functions, 'generateInterviewGuide');
      const result = await interviewGuideFunction(input);
      return result.data;
    } catch (error) {
      console.error('Interview Guide Generation error:', error);
      throw error;
    }
  },

  // Follow-up Questions
  async generateFollowUpQuestion(input: any): Promise<any> {
    try {
      const followUpFunction = httpsCallable(functions, 'generateFollowUpQuestion');
      const result = await followUpFunction(input);
      return result.data;
    } catch (error) {
      console.error('Follow-up Question Generation error:', error);
      throw error;
    }
  },

  // Initial Interview Message
  async generateInitialInterviewMessage(input: any): Promise<any> {
    try {
      const initialMessageFunction = httpsCallable(functions, 'generateInitialInterviewMessage');
      const result = await initialMessageFunction(input);
      return result.data;
    } catch (error) {
      console.error('Initial Interview Message Generation error:', error);
      throw error;
    }
  }
};

// Helper function to convert File to data URI for AI flows
export const fileToDataUri = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to convert file to data URI'));
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
};

// Utility function to validate video data URI
export const validateVideoDataUri = (dataUri: string): boolean => {
  const videoMimeTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/avi', 'video/mov'];
  const mimeTypeMatch = dataUri.match(/^data:([^;]+);base64,/);
  
  if (!mimeTypeMatch) {
    return false;
  }
  
  const mimeType = mimeTypeMatch[1];
  return videoMimeTypes.includes(mimeType);
};

// Error handling utility
export const handleGenkitError = (error: any): string => {
  if (error.code === 'functions/unauthenticated') {
    return 'You must be signed in to use AI features.';
  } else if (error.code === 'functions/permission-denied') {
    return 'You do not have permission to use this AI feature.';
  } else if (error.code === 'functions/not-found') {
    return 'AI service not available. Please contact support.';
  } else if (error.code === 'functions/invalid-argument') {
    return 'Invalid input provided to AI service.';
  } else if (error.code === 'functions/internal') {
    return 'AI service temporarily unavailable. Please try again later.';
  } else {
    return error.message || 'An unexpected error occurred with the AI service.';
  }
};