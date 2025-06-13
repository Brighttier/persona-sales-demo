import { NextRequest, NextResponse } from 'next/server';

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1/';

// Your conversational agent ID
const CONVERSATIONAL_AGENT_ID = 'EVQJtCNSo0L6uHQnImQuThe';

export async function POST(request: NextRequest) {
  try {
    if (!ELEVENLABS_API_KEY) {
      console.error('ElevenLabs API key not configured');
      return NextResponse.json(
        { error: 'ElevenLabs API key not configured' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { action, ...params } = body;

    let endpoint = '';
    let payload = {};

    switch (action) {
      case 'create_session':
        endpoint = `conversational-ai/conversations`;
        payload = {
          agent_id: CONVERSATIONAL_AGENT_ID,
          ...params
        };
        break;
      
      case 'get_signed_url':
        endpoint = `conversational-ai/conversations/${params.conversation_id}/get_signed_url`;
        payload = {};
        break;
      
      case 'send_message':
        endpoint = `conversational-ai/conversations/${params.conversation_id}/send_message`;
        payload = {
          text: params.text,
          ...params
        };
        break;
      
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    // Call ElevenLabs Conversational AI API
    const response = await fetch(`${ELEVENLABS_API_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`ElevenLabs API error: ${response.status} - ${errorText}`);
      return NextResponse.json(
        { error: 'Failed to process conversational AI request', details: errorText },
        { status: response.status }
      );
    }

    const responseData = await response.json();
    return NextResponse.json(responseData);

  } catch (error) {
    console.error('Error in ElevenLabs Conversational AI API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    hasApiKey: !!ELEVENLABS_API_KEY,
    agentId: CONVERSATIONAL_AGENT_ID,
    timestamp: new Date().toISOString()
  });
}