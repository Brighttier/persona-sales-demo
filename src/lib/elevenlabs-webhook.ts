import { collection, doc, setDoc, updateDoc, getDoc } from 'firebase/firestore';

export interface InterviewWebhookData {
  conversationId: string;
  agentId: string;
  transcript?: string;
  summary?: string;
  evaluation?: Record<string, any>;
  analytics?: Record<string, any>;
  status: 'completed' | 'failed';
  timestamp: string;
  userId?: string;
  jobId?: string;
  candidateId?: string;
}

/**
 * Store interview webhook data in Firestore
 */
export async function storeInterviewWebhookData(data: InterviewWebhookData) {
  try {
    const { db } = await import('@/lib/firebase');
    const interviewRef = doc(db, 'interview-sessions', data.conversationId);
    
    // Store the webhook data
    await setDoc(interviewRef, {
      conversationId: data.conversationId,
      agentId: data.agentId,
      transcript: data.transcript,
      summary: data.summary,
      evaluation: data.evaluation,
      analytics: data.analytics,
      status: data.status,
      timestamp: data.timestamp,
      userId: data.userId,
      jobId: data.jobId,
      candidateId: data.candidateId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      source: 'elevenlabs-webhook'
    }, { merge: true });

    console.log('Interview webhook data stored:', data.conversationId);
    
    // If we have user/candidate information, update their profile
    if (data.userId && data.candidateId) {
      await updateCandidateInterviewHistory(data.userId, data.candidateId, data);
    }

    return { success: true };
  } catch (error) {
    console.error('Error storing interview webhook data:', error);
    throw error;
  }
}

/**
 * Update candidate's interview history
 */
async function updateCandidateInterviewHistory(
  userId: string,
  candidateId: string,
  data: InterviewWebhookData
) {
  try {
    const { db } = await import('@/lib/firebase');
    const candidateRef = doc(db, 'users', userId, 'candidates', candidateId);
    const candidateDoc = await getDoc(candidateRef);
    
    if (candidateDoc.exists()) {
      const candidateData = candidateDoc.data();
      const interviewHistory = candidateData.interviewHistory || [];
      
      // Add new interview session
      interviewHistory.push({
        conversationId: data.conversationId,
        timestamp: data.timestamp,
        status: data.status,
        hasTranscript: !!data.transcript,
        hasSummary: !!data.summary,
        hasEvaluation: !!data.evaluation,
        agentId: data.agentId
      });
      
      await updateDoc(candidateRef, {
        interviewHistory,
        lastInterviewDate: data.timestamp,
        updatedAt: new Date().toISOString()
      });
      
      console.log('Updated candidate interview history:', candidateId);
    }
  } catch (error) {
    console.error('Error updating candidate interview history:', error);
    // Don't throw here - webhook data storage is more important
  }
}

/**
 * Retrieve interview data by conversation ID
 */
export async function getInterviewData(conversationId: string) {
  try {
    const { db } = await import('@/lib/firebase');
    const interviewRef = doc(db, 'interview-sessions', conversationId);
    const interviewDoc = await getDoc(interviewRef);
    
    if (interviewDoc.exists()) {
      return interviewDoc.data();
    }
    
    return null;
  } catch (error) {
    console.error('Error retrieving interview data:', error);
    throw error;
  }
}

/**
 * Extract candidate/job information from conversation metadata
 */
export function extractInterviewContext(metadata?: Record<string, any>): {
  userId?: string;
  candidateId?: string;
  jobId?: string;
} {
  return {
    userId: metadata?.userId || metadata?.user_id,
    candidateId: metadata?.candidateId || metadata?.candidate_id,
    jobId: metadata?.jobId || metadata?.job_id
  };
}