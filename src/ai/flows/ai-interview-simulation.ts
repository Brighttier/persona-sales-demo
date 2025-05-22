
'use server';

/**
 * @fileOverview AI interview simulation flow. This version focuses on video analysis.
 *
 * - aiInterviewSimulation - A function that initiates the AI interview simulation process.
 * - AiInterviewSimulationInput - The input type for the aiInterviewSimulation function.
 * - AiInterviewSimulationOutput - The return type for the aiInterviewSimulation function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AiInterviewSimulationInputSchema = z.object({
  jobDescription: z.string().describe('The description of the job being interviewed for.'),
  candidateResume: z.string().describe("The candidate's resume."),
  videoDataUri: z
    .string()
    .describe(
      "A video recording of the candidate's response, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  // interviewTranscript is removed as we are reverting to video-only analysis for simplicity
});
export type AiInterviewSimulationInput = z.infer<typeof AiInterviewSimulationInputSchema>;

const AiInterviewSimulationOutputSchema = z.object({
  feedback: z.string().describe("AI-generated feedback on the candidate's interview performance, focusing on their video presentation and communication in relation to the job and resume."),
});
export type AiInterviewSimulationOutput = z.infer<typeof AiInterviewSimulationOutputSchema>;

export async function aiInterviewSimulation(input: AiInterviewSimulationInput): Promise<AiInterviewSimulationOutput> {
  return aiInterviewSimulationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiInterviewSimulationPromptSimple', // Renamed to avoid conflict if old one is cached
  input: {schema: AiInterviewSimulationInputSchema},
  output: {schema: AiInterviewSimulationOutputSchema},
  prompt: `You are an AI interview coach.
Analyze the candidate's video response, their resume, and the job description provided.
Focus your feedback on the candidate's presentation, communication clarity, body language, and the relevance of their (assumed) spoken content to the job requirements and their resume, as inferred from their video performance.

Job Description: {{{jobDescription}}}
Candidate Resume: {{{candidateResume}}}
Candidate's Video Response: {{media url=videoDataUri}}

Provide detailed, constructive, and actionable feedback to help the candidate improve their interviewing skills.
Be encouraging and professional. Structure your feedback clearly.
`,
});

const aiInterviewSimulationFlow = ai.defineFlow(
  {
    name: 'aiInterviewSimulationFlowSimple', // Renamed
    inputSchema: AiInterviewSimulationInputSchema,
    outputSchema: AiInterviewSimulationOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

    