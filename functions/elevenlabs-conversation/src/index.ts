import { Request, Response } from 'express';
import { SecretManagerServiceClient } from '@google-cloud/secret-manager';
import { Firestore } from '@google-cloud/firestore';
import * as cors from 'cors';

const corsHandler = cors({ origin: true });
const secretManager = new SecretManagerServiceClient();
const firestore = new Firestore();

const PROJECT_ID = 'replit-4f946';
const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1/';
const AGENT_ID = 'EVQJtCNSo0L6uHQnImQu';

interface ConversationRequest {
  action: 'create_session' | 'get_signed_url' | 'end_session';
  conversationId?: string;
  userId?: string;
  candidateId?: string;
  jobId?: string;
  metadata?: Record<string, any>;
}

interface ConversationResponse {
  success: boolean;
  data?: any;
  error?: string;
  signedUrl?: string;
  conversationId?: string;
}

async function getSecret(secretName: string): Promise<string> {
  try {
    const name = `projects/${PROJECT_ID}/secrets/${secretName}/versions/latest`;
    const [version] = await secretManager.accessSecretVersion({ name });
    return version.payload?.data?.toString() || '';
  } catch (error) {
    console.error(`Error accessing secret ${secretName}:`, error);
    throw new Error(`Failed to access secret: ${secretName}`);
  }
}

async function createConversationSession(
  apiKey: string,
  metadata?: Record<string, any>
): Promise<{ conversationId: string }> {
  const response = await fetch(`${ELEVENLABS_API_URL}conversational-ai/conversations`, {
    method: 'POST',
    headers: {
      'xi-api-key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      agent_id: AGENT_ID,
      ...(metadata && { metadata })
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to create conversation: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return { conversationId: data.conversation_id };
}

async function getSignedUrl(apiKey: string, conversationId: string): Promise<string> {
  const response = await fetch(
    `${ELEVENLABS_API_URL}conversational-ai/conversations/${conversationId}/get_signed_url`,
    {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to get signed URL: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data.signed_url;
}

async function storeConversationMetadata(
  conversationId: string,
  userId?: string,
  candidateId?: string,
  jobId?: string,
  metadata?: Record<string, any>
) {
  try {
    const doc = firestore.collection('conversation-sessions').doc(conversationId);
    await doc.set({
      conversationId,
      agentId: AGENT_ID,
      userId,
      candidateId,
      jobId,
      metadata,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    console.log(`Stored conversation metadata for ${conversationId}`);
  } catch (error) {
    console.error('Error storing conversation metadata:', error);
    // Don't throw - this is not critical for the conversation to work
  }
}

async function updateConversationStatus(conversationId: string, status: string) {
  try {
    const doc = firestore.collection('conversation-sessions').doc(conversationId);
    await doc.update({
      status,
      updatedAt: new Date().toISOString(),
      ...(status === 'ended' && { endedAt: new Date().toISOString() })
    });
    console.log(`Updated conversation ${conversationId} status to ${status}`);
  } catch (error) {
    console.error('Error updating conversation status:', error);
  }
}

export const elevenLabsConversation = async (req: Request, res: Response): Promise<void> => {
  return new Promise((resolve) => {
    corsHandler(req, res, async () => {
      try {
        console.log('ElevenLabs conversation request:', {
          method: req.method,
          action: req.body?.action,
          conversationId: req.body?.conversationId
        });

        if (req.method === 'GET') {
          // Health check
          res.status(200).json({
            status: 'ok',
            service: 'elevenlabs-conversation',
            agentId: AGENT_ID,
            timestamp: new Date().toISOString()
          });
          resolve();
          return;
        }

        if (req.method !== 'POST') {
          res.status(405).json({ success: false, error: 'Method not allowed' });
          resolve();
          return;
        }

        const { action, conversationId, userId, candidateId, jobId, metadata }: ConversationRequest = req.body;

        if (!action) {
          res.status(400).json({ success: false, error: 'Action is required' });
          resolve();
          return;
        }

        // Get API key from Secret Manager
        const apiKey = await getSecret('NEXT_PUBLIC_ELEVENLABS_API_KEY');
        if (!apiKey) {
          res.status(500).json({ success: false, error: 'ElevenLabs API key not configured' });
          resolve();
          return;
        }

        let result: ConversationResponse = { success: true };

        switch (action) {
          case 'create_session':
            try {
              const sessionData = await createConversationSession(apiKey, metadata);
              const signedUrl = await getSignedUrl(apiKey, sessionData.conversationId);
              
              // Store conversation metadata for webhook processing
              await storeConversationMetadata(
                sessionData.conversationId,
                userId,
                candidateId,
                jobId,
                metadata
              );

              result = {
                success: true,
                conversationId: sessionData.conversationId,
                signedUrl,
                data: sessionData
              };
            } catch (error) {
              console.error('Error creating conversation session:', error);
              result = {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to create session'
              };
            }
            break;

          case 'get_signed_url':
            if (!conversationId) {
              result = { success: false, error: 'Conversation ID is required for signed URL' };
              break;
            }
            try {
              const signedUrl = await getSignedUrl(apiKey, conversationId);
              result = { success: true, signedUrl };
            } catch (error) {
              console.error('Error getting signed URL:', error);
              result = {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to get signed URL'
              };
            }
            break;

          case 'end_session':
            if (!conversationId) {
              result = { success: false, error: 'Conversation ID is required to end session' };
              break;
            }
            try {
              await updateConversationStatus(conversationId, 'ended');
              result = { success: true, data: { conversationId, status: 'ended' } };
            } catch (error) {
              console.error('Error ending session:', error);
              result = {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to end session'
              };
            }
            break;

          default:
            result = { success: false, error: `Unknown action: ${action}` };
        }

        const statusCode = result.success ? 200 : 400;
        res.status(statusCode).json(result);
        resolve();

      } catch (error) {
        console.error('Unexpected error in ElevenLabs conversation function:', error);
        res.status(500).json({
          success: false,
          error: 'Internal server error'
        });
        resolve();
      }
    });
  });
};