
import { config } from 'dotenv';
config();

import '@/ai/flows/ai-candidate-screening.ts';
import '@/ai/flows/ai-interview-simulation.ts';
import '@/ai/flows/profile-enrichment.ts';
import '@/ai/flows/job-recommendation.ts';
import '@/ai/flows/initial-interview-message.ts'; // Added new flow
