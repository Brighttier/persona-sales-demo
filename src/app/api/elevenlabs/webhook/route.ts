import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { createHmac } from 'crypto';
import { storeInterviewWebhookData, extractInterviewContext } from '@/lib/elevenlabs-webhook';

const ELEVENLABS_WEBHOOK_SECRET = process.env.ELEVENLABS_WEBHOOK_SECRET;

interface ElevenLabsWebhookPayload {
  type: 'post_call_transcription';
  data: {
    conversation_id: string;
    agent_id: string;
    user_id?: string;
    analysis_result: {
      transcript?: string;
      summary?: string;
      evaluation_result?: {
        [key: string]: any;
      };
      conversation_analytics?: {
        [key: string]: any;
      };
    };
    status: 'completed' | 'failed';
    conversation_metadata?: {
      [key: string]: any;
    };
    created_at: string;
    updated_at: string;
  };
  event_timestamp: number;
}

function verifyWebhookSignature(
  timestamp: string,
  body: string,
  signature: string,
  secret: string
): boolean {
  const payload = `${timestamp}.${body}`;
  const expectedSignature = createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  // Extract the hash from the signature (format: "sha256=hash")
  const providedHash = signature.replace('sha256=', '');
  
  return expectedSignature === providedHash;
}

export async function POST(request: NextRequest) {
  try {
    console.log('ElevenLabs webhook received');

    // Verify webhook secret is configured
    if (!ELEVENLABS_WEBHOOK_SECRET) {
      console.error('ElevenLabs webhook secret not configured');
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      );
    }

    // Get headers
    const headersList = await headers();
    const signature = headersList.get('elevenlabs-signature');
    const timestamp = headersList.get('elevenlabs-timestamp');

    if (!signature || !timestamp) {
      console.error('Missing required webhook headers');
      return NextResponse.json(
        { error: 'Missing signature or timestamp' },
        { status: 400 }
      );
    }

    // Get raw body for signature verification
    const body = await request.text();

    // Verify webhook signature
    if (!verifyWebhookSignature(timestamp, body, signature, ELEVENLABS_WEBHOOK_SECRET)) {
      console.error('Invalid webhook signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    // Parse the webhook payload
    const payload: ElevenLabsWebhookPayload = JSON.parse(body);
    
    console.log('Processing ElevenLabs webhook:', {
      type: payload.type,
      conversation_id: payload.data.conversation_id,
      agent_id: payload.data.agent_id,
      status: payload.data.status
    });

    // Process different webhook event types
    switch (payload.type) {
      case 'post_call_transcription':
        await handlePostCallTranscription(payload.data);
        break;
      default:
        console.warn('Unknown webhook event type:', payload.type);
    }

    // Always return 200 to acknowledge receipt
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error processing ElevenLabs webhook:', error);
    // Still return 200 to prevent webhook retries for parsing errors
    return NextResponse.json({ success: false, error: 'Processing error' });
  }
}

async function handlePostCallTranscription(data: ElevenLabsWebhookPayload['data']) {
  try {
    console.log('Processing post-call transcription:', {
      conversation_id: data.conversation_id,
      agent_id: data.agent_id,
      status: data.status
    });

    // Check if this is our AI interview agent
    if (data.agent_id === 'EVQJtCNSo0L6uHQnImQu') {
      console.log('AI Interview conversation completed:', data.conversation_id);
      
      // Extract interview data
      const transcript = data.analysis_result?.transcript;
      const summary = data.analysis_result?.summary;
      const evaluation = data.analysis_result?.evaluation_result;
      const analytics = data.analysis_result?.conversation_analytics;

      // Here you can:
      // 1. Store the conversation data in Firestore
      // 2. Update candidate profiles
      // 3. Send notifications to hiring managers
      // 4. Trigger follow-up workflows
      
      console.log('Interview data available:', {
        hasTranscript: !!transcript,
        hasSummary: !!summary,
        hasEvaluation: !!evaluation,
        hasAnalytics: !!analytics
      });

      // Extract context information from metadata
      const context = extractInterviewContext(data.conversation_metadata);
      
      // Store the interview data in Firestore
      await storeInterviewWebhookData({
        conversationId: data.conversation_id,
        agentId: data.agent_id,
        transcript,
        summary,
        evaluation,
        analytics,
        status: data.status,
        timestamp: data.created_at,
        ...context
      });
      
      console.log('Interview data stored successfully for conversation:', data.conversation_id);

    } else {
      console.log('Webhook for different agent:', data.agent_id);
    }

  } catch (error) {
    console.error('Error handling post-call transcription:', error);
    throw error;
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    webhook: 'elevenlabs-post-call',
    hasSecret: !!ELEVENLABS_WEBHOOK_SECRET,
    timestamp: new Date().toISOString()
  });
}