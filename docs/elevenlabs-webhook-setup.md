# ElevenLabs Webhook Setup Guide

This guide explains how to configure ElevenLabs post-call webhooks for your AI interview agent.

## Overview

The webhook endpoint receives detailed conversation data after each AI interview session, including:
- Full conversation transcript
- AI-generated summary
- Evaluation results
- Conversation analytics
- Metadata and context

## Webhook Endpoint

**URL**: `https://backend-main--replit-4f946.us-central1.hosted.app/api/elevenlabs/webhook`
**Method**: POST
**Agent ID**: `EVQJtCNSo0L6uHQnImQu`

## Setup Steps

### 1. Configure Webhook Secret in Google Secret Manager

1. Go to [Google Cloud Secret Manager](https://console.cloud.google.com/security/secret-manager)
2. Create a new secret named `ELEVENLABS_WEBHOOK_SECRET`
3. Generate a secure random string (32+ characters) as the secret value
4. Save the secret

### 2. Configure Webhook in ElevenLabs Dashboard

1. Log into your [ElevenLabs Dashboard](https://elevenlabs.io/app)
2. Navigate to **Settings** → **Webhooks**
3. Click **Create Webhook**
4. Configure the webhook:
   - **Name**: `AI Interview Post-Call Webhook`
   - **URL**: `https://backend-main--replit-4f946.us-central1.hosted.app/api/elevenlabs/webhook`
   - **Events**: Select `post_call_transcription`
   - **Authentication**: Enable HMAC with your webhook secret
5. Save the webhook configuration

### 3. Enable Webhook for Conversational AI

1. Go to **Conversational AI** → **Settings**
2. Find **Post-call webhooks** section
3. Enable webhooks for your workspace
4. Select the webhook you created in step 2
5. Save the configuration

## Webhook Payload Structure

The webhook receives data in this format:

```json
{
  "type": "post_call_transcription",
  "data": {
    "conversation_id": "conv_123456",
    "agent_id": "EVQJtCNSo0L6uHQnImQu",
    "user_id": "user_789",
    "analysis_result": {
      "transcript": "Full conversation transcript...",
      "summary": "AI-generated summary...",
      "evaluation_result": {
        "communication_score": 8.5,
        "technical_skills": 7.2
      },
      "conversation_analytics": {
        "duration": 600,
        "word_count": 1250
      }
    },
    "status": "completed",
    "conversation_metadata": {
      "userId": "user_123",
      "candidateId": "candidate_456",
      "jobId": "job_789"
    },
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:35:00Z"
  },
  "event_timestamp": 1705312500
}
```

## Data Storage

The webhook automatically stores interview data in Firestore:

- **Collection**: `interview-sessions`
- **Document ID**: `conversation_id`
- **Candidate History**: Updates candidate interview history
- **Searchable**: By conversation ID, agent ID, user ID

## Security Features

- **HMAC Signature Verification**: Validates webhook authenticity
- **IP Whitelisting**: Optional additional security layer
- **Secret Management**: Secure storage in Google Secret Manager
- **Error Handling**: Graceful error handling to prevent webhook failures

## Testing the Webhook

### Health Check
```bash
curl https://backend-main--replit-4f946.us-central1.hosted.app/api/elevenlabs/webhook
```

### Webhook Logs
Monitor webhook activity in:
- Google Cloud Logs
- ElevenLabs Dashboard → Webhooks → Activity

## Troubleshooting

### Common Issues

1. **Webhook Secret Mismatch**
   - Verify secret in Google Secret Manager matches ElevenLabs configuration
   - Check for extra whitespace or special characters

2. **404 Errors**
   - Ensure webhook URL is correct
   - Verify deployment is successful

3. **Authentication Failures**
   - Check HMAC signature verification
   - Verify timestamp and payload format

4. **Data Not Storing**
   - Check Firestore permissions
   - Review Cloud Function logs for errors

### Debug Mode

Enable debug logging by checking webhook logs in Google Cloud Console:
```
Navigation: Cloud Run → backend-main → Logs
Filter: severity="INFO" OR severity="ERROR"
```

## Usage in Application

The stored webhook data can be accessed via:

```typescript
import { getInterviewData } from '@/lib/elevenlabs-webhook';

const interviewData = await getInterviewData('conversation_id');
```

## Benefits

- **Automated Data Collection**: No manual intervention required
- **Real-time Processing**: Data available immediately after interview
- **Analytics Ready**: Structured data for reporting and analysis
- **Audit Trail**: Complete conversation history
- **Integration Ready**: Easy to integrate with CRM and HR systems