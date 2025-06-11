
import { config } from 'dotenv';
config();

import '@/ai/flows/ai-candidate-screening.ts';
import '@/ai/flows/ai-interview-simulation.ts';
import '@/ai/flows/profile-enrichment.ts';
import '@/ai/flows/job-recommendation.ts';
import '@/ai/flows/initial-interview-message.ts';
import '@/ai/flows/follow-up-question.ts';
import '@/ai/flows/generate-job-posting-flow.ts';
import '@/ai/flows/generate-interview-guide-flow.ts'; // Added new flow
