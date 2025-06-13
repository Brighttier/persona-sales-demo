"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.elevenLabsConversation = void 0;
const secret_manager_1 = require("@google-cloud/secret-manager");
const firestore_1 = require("@google-cloud/firestore");
const cors_1 = __importDefault(require("cors"));
const corsHandler = (0, cors_1.default)({ origin: true });
const secretManager = new secret_manager_1.SecretManagerServiceClient();
const firestore = new firestore_1.Firestore();
const PROJECT_ID = 'replit-4f946';
const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1/';
const AGENT_ID = 'EVQJtCNSo0L6uHQnImQu';
async function getSecret(secretName) {
    try {
        const name = `projects/${PROJECT_ID}/secrets/${secretName}/versions/latest`;
        const [version] = await secretManager.accessSecretVersion({ name });
        return version.payload?.data?.toString() || '';
    }
    catch (error) {
        console.error(`Error accessing secret ${secretName}:`, error);
        throw new Error(`Failed to access secret: ${secretName}`);
    }
}
async function createSignedUrl(apiKey) {
    const response = await fetch(`${ELEVENLABS_API_URL}convai/conversation/get_signed_url?agent_id=${AGENT_ID}`, {
        method: 'GET',
        headers: {
            'xi-api-key': apiKey,
        },
    });
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to get signed URL: ${response.status} - ${errorText}`);
    }
    const data = await response.json();
    return data.signed_url;
}
async function storeConversationMetadata(sessionId, userId, candidateId, jobId, metadata) {
    try {
        const doc = firestore.collection('conversation-sessions').doc(sessionId);
        await doc.set({
            sessionId,
            agentId: AGENT_ID,
            userId,
            candidateId,
            jobId,
            metadata,
            status: 'active',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        });
        console.log(`Stored conversation metadata for ${sessionId}`);
    }
    catch (error) {
        console.error('Error storing conversation metadata:', error);
        // Don't throw - this is not critical for the conversation to work
    }
}
const elevenLabsConversation = async (req, res) => {
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
                const { action, userId, candidateId, jobId, metadata } = req.body;
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
                let result = { success: true };
                switch (action) {
                    case 'create_session':
                        try {
                            const signedUrl = await createSignedUrl(apiKey);
                            const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                            // Store conversation metadata for webhook processing
                            await storeConversationMetadata(sessionId, userId, candidateId, jobId, metadata);
                            result = {
                                success: true,
                                signedUrl,
                                data: { sessionId }
                            };
                        }
                        catch (error) {
                            console.error('Error creating conversation session:', error);
                            result = {
                                success: false,
                                error: error instanceof Error ? error.message : 'Failed to create session'
                            };
                        }
                        break;
                    case 'get_signed_url':
                        try {
                            const signedUrl = await createSignedUrl(apiKey);
                            result = { success: true, signedUrl };
                        }
                        catch (error) {
                            console.error('Error getting signed URL:', error);
                            result = {
                                success: false,
                                error: error instanceof Error ? error.message : 'Failed to get signed URL'
                            };
                        }
                        break;
                    default:
                        result = { success: false, error: `Unknown action: ${action}` };
                }
                const statusCode = result.success ? 200 : 400;
                res.status(statusCode).json(result);
                resolve();
            }
            catch (error) {
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
exports.elevenLabsConversation = elevenLabsConversation;
