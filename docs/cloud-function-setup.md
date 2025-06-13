# ElevenLabs Cloud Function Setup Guide

This guide explains how to deploy and configure the ElevenLabs Conversational AI Cloud Function for improved reliability and scalability.

## Overview

The Cloud Function provides a more robust and scalable solution for ElevenLabs integration by:
- Handling conversation session creation
- Managing signed URL generation
- Storing conversation metadata in Firestore
- Providing proper error handling and logging
- Supporting session lifecycle management

## Prerequisites

1. Google Cloud SDK installed and configured
2. Google Cloud Project: `replit-4f946`
3. Cloud Functions API enabled
4. Secret Manager API enabled
5. Firestore database configured

## Deployment Steps

### 1. Navigate to Function Directory
```bash
cd functions/elevenlabs-conversation
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Secrets in Google Secret Manager

Ensure these secrets exist:
- `NEXT_PUBLIC_ELEVENLABS_API_KEY` - Your ElevenLabs API key

### 4. Deploy the Function
```bash
# Make script executable
chmod +x deploy.sh

# Deploy the function
./deploy.sh
```

Or deploy manually:
```bash
gcloud functions deploy elevenlabs-conversation \
  --gen2 \
  --runtime=nodejs20 \
  --region=us-central1 \
  --source=. \
  --entry-point=elevenLabsConversation \
  --trigger=https \
  --allow-unauthenticated \
  --memory=512MB \
  --timeout=60s \
  --set-env-vars="PROJECT_ID=replit-4f946" \
  --max-instances=10 \
  --min-instances=0
```

## Function Endpoints

### Base URL
```
https://us-central1-replit-4f946.cloudfunctions.net/elevenlabs-conversation
```

### Health Check
```bash
curl -X GET "https://us-central1-replit-4f946.cloudfunctions.net/elevenlabs-conversation"
```

### Create Conversation Session
```bash
curl -X POST "https://us-central1-replit-4f946.cloudfunctions.net/elevenlabs-conversation" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "create_session",
    "userId": "user123",
    "candidateId": "candidate456",
    "jobId": "job789",
    "metadata": {
      "jobTitle": "Software Engineer",
      "source": "ai-interview-client"
    }
  }'
```

### Get Signed URL
```bash
curl -X POST "https://us-central1-replit-4f946.cloudfunctions.net/elevenlabs-conversation" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "get_signed_url",
    "conversationId": "conv_123456"
  }'
```

### End Session
```bash
curl -X POST "https://us-central1-replit-4f946.cloudfunctions.net/elevenlabs-conversation" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "end_session",
    "conversationId": "conv_123456"
  }'
```

## Response Format

### Success Response
```json
{
  "success": true,
  "conversationId": "conv_123456",
  "signedUrl": "wss://api.elevenlabs.io/v1/convai/conversations/conv_123456?token=...",
  "data": {
    "conversationId": "conv_123456"
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Failed to create conversation session"
}
```

## Data Storage

The function stores conversation metadata in Firestore:

### Collection: `conversation-sessions`
```json
{
  "conversationId": "conv_123456",
  "agentId": "EVQJtCNSo0L6uHQnImQu",
  "userId": "user123",
  "candidateId": "candidate456",
  "jobId": "job789",
  "metadata": {
    "jobTitle": "Software Engineer",
    "source": "ai-interview-client"
  },
  "status": "active",
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

## Benefits of Cloud Function Approach

### 1. **Improved Reliability**
- Dedicated Cloud Function with proper error handling
- Automatic retries and scaling
- Better logging and monitoring

### 2. **Enhanced Security**
- API keys stored securely in Secret Manager
- Server-side validation and processing
- No client-side API key exposure

### 3. **Better Performance**
- Optimized for ElevenLabs API interactions
- Connection pooling and caching
- Reduced client-side complexity

### 4. **Comprehensive Logging**
- Google Cloud Logging integration
- Request/response tracking
- Error monitoring and alerting

### 5. **Session Management**
- Proper conversation lifecycle tracking
- Metadata storage for analytics
- Integration with webhook processing

## Integration with Client

The client code automatically uses the Cloud Function:

```typescript
// Create session and get signed URL
const createConversationSession = async () => {
  const response = await fetch('https://us-central1-replit-4f946.cloudfunctions.net/elevenlabs-conversation', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'create_session',
      userId: 'current-user',
      candidateId: 'current-candidate',
      jobId: jobContext.jobTitle,
      metadata: {
        jobTitle: jobContext.jobTitle,
        source: 'ai-interview-client'
      }
    }),
  });
  
  const data = await response.json();
  return data.signedUrl;
};
```

## Monitoring and Troubleshooting

### View Logs
```bash
gcloud functions logs read elevenlabs-conversation --region=us-central1
```

### Monitor Performance
```bash
gcloud functions describe elevenlabs-conversation --region=us-central1
```

### Common Issues

1. **Secret Access Denied**
   - Verify Secret Manager permissions
   - Check secret names match exactly

2. **Function Timeout**
   - Increase timeout in deployment configuration
   - Monitor ElevenLabs API response times

3. **Connection Errors**
   - Check network connectivity
   - Verify ElevenLabs API status

### Debug Mode

Enable detailed logging by setting environment variable:
```bash
gcloud functions deploy elevenlabs-conversation \
  --set-env-vars="DEBUG=true,PROJECT_ID=replit-4f946"
```

## Cost Optimization

- **Min Instances**: 0 (cold start acceptable for interviews)
- **Max Instances**: 10 (handles concurrent interviews)
- **Memory**: 512MB (sufficient for API calls)
- **Timeout**: 60s (covers ElevenLabs API response time)

## Next Steps

1. Deploy the function using the provided scripts
2. Update client code to use Cloud Function endpoints
3. Test conversation creation and session management
4. Monitor logs and performance metrics
5. Configure alerts for error rates and latency