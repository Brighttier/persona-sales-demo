
'use server';

/**
 * @fileOverview AI interview simulation flow with video recording and feedback from a conversational AI agent.
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
      "A video recording of the candidate's interview response, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  interviewTranscript: z
    .string()
    .optional()
    .describe("The transcript of the candidate's answers during the interview session. This includes responses to initial and follow-up questions."),
});
export type AiInterviewSimulationInput = z.infer<typeof AiInterviewSimulationInputSchema>;

const AiInterviewSimulationOutputSchema = z.object({
  feedback: z.string().describe("AI-generated feedback on the candidate's interview performance, considering video and transcript."),
});
export type AiInterviewSimulationOutput = z.infer<typeof AiInterviewSimulationOutputSchema>;

export async function aiInterviewSimulation(input: AiInterviewSimulationInput): Promise<AiInterviewSimulationOutput> {
  return aiInterviewSimulationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiInterviewSimulationPrompt',
  input: {schema: AiInterviewSimulationInputSchema},
  output: {schema: AiInterviewSimulationOutputSchema},
  prompt: `You are an AI interview coach providing feedback to a candidate based on their video response, resume, and the transcript of their answers, in relation to a specific job description.

Job Description: {{{jobDescription}}}
Candidate Resume: {{{candidateResume}}}
{{#if videoDataUri}}Video Response (last segment): {{media url=videoDataUri}}{{/if}}
{{#if interviewTranscript}}
Transcript of Candidate's Answers:
{{{interviewTranscript}}}
{{/if}}

Provide detailed, constructive, and actionable feedback to help the candidate improve their interviewing skills.
Consider their communication style, clarity of responses, relevance to the job description, and overall presentation.
If a transcript is provided, also comment on the content and structure of their answers.
Be encouraging and professional.
`,
});

const aiInterviewSimulationFlow = ai.defineFlow(
  {
    name: 'aiInterviewSimulationFlow',
    inputSchema: AiInterviewSimulationInputSchema,
    outputSchema: AiInterviewSimulationOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
