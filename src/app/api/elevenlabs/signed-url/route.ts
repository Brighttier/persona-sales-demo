import { NextRequest, NextResponse } from 'next/server';

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1/';
const CONVERSATIONAL_AGENT_ID = 'EVQJtCNSo0L6uHQnImQu';

export async function GET() {
  try {
    if (!ELEVENLABS_API_KEY) {
      console.error('ElevenLabs API key not configured');
      return NextResponse.json(
        { error: 'ElevenLabs API key not configured' },
        { status: 500 }
      );
    }

    // Create a conversation session
    const createSessionResponse = await fetch(`${ELEVENLABS_API_URL}conversational-ai/conversations`, {
      method: 'POST',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        agent_id: CONVERSATIONAL_AGENT_ID,
      }),
    });

    if (!createSessionResponse.ok) {
      const errorText = await createSessionResponse.text();
      console.error(`Failed to create conversation session: ${createSessionResponse.status} - ${errorText}`);
      return NextResponse.json(
        { error: 'Failed to create conversation session', details: errorText },
        { status: createSessionResponse.status }
      );
    }

    const sessionData = await createSessionResponse.json();
    const conversationId = sessionData.conversation_id;

    // Get signed URL for the conversation
    const signedUrlResponse = await fetch(`${ELEVENLABS_API_URL}conversational-ai/conversations/${conversationId}/get_signed_url`, {
      method: 'POST',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
        'Content-Type': 'application/json',
      },
    });

    if (!signedUrlResponse.ok) {
      const errorText = await signedUrlResponse.text();
      console.error(`Failed to get signed URL: ${signedUrlResponse.status} - ${errorText}`);
      return NextResponse.json(
        { error: 'Failed to get signed URL', details: errorText },
        { status: signedUrlResponse.status }
      );
    }

    const signedUrlData = await signedUrlResponse.json();
    
    return NextResponse.json({
      signed_url: signedUrlData.signed_url,
      conversation_id: conversationId,
    });

  } catch (error) {
    console.error('Error creating signed URL:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function POST() {
  return NextResponse.json({
    status: 'ok',
    hasApiKey: !!ELEVENLABS_API_KEY,
    agentId: CONVERSATIONAL_AGENT_ID,
    timestamp: new Date().toISOString()
  });
}