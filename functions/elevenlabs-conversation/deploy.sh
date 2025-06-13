#!/bin/bash

# ElevenLabs Conversation Cloud Function Deployment Script

echo "🚀 Deploying ElevenLabs Conversation Cloud Function..."

# Set project
gcloud config set project replit-4f946

# Build TypeScript
echo "📦 Building TypeScript..."
npm run build

# Deploy the function
echo "☁️ Deploying to Google Cloud Functions..."
gcloud functions deploy elevenlabs-conversation \
  --gen2 \
  --runtime=nodejs20 \
  --region=us-central1 \
  --source=. \
  --entry-point=elevenLabsConversation \
  --trigger-http \
  --allow-unauthenticated \
  --memory=512MB \
  --timeout=60s \
  --set-env-vars="PROJECT_ID=replit-4f946" \
  --max-instances=10 \
  --min-instances=0

echo "✅ Deployment complete!"
echo "🔗 Function URL: https://us-central1-replit-4f946.cloudfunctions.net/elevenlabs-conversation"

# Test the function
echo "🧪 Testing function..."
curl -X GET "https://us-central1-replit-4f946.cloudfunctions.net/elevenlabs-conversation"

echo "🎉 ElevenLabs Conversation Cloud Function is ready!"