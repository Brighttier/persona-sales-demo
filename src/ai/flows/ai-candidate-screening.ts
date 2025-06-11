
// src/ai/flows/ai-candidate-screening.ts
'use server';
/**
 * @fileOverview Candidate screening AI flow.
 *
 * This file defines a Genkit flow that uses AI to screen candidates based on
 * their resumes and profiles, helping recruiters quickly identify the most
 * qualified applicants for a job.
 *
 * @fileOverview Defines the `aiCandidateScreening` function and its associated types.
 * - `aiCandidateScreening`: The main function to perform candidate screening.
 * - `CandidateScreeningInput`: The input type for the `aiCandidateScreening` function.
 * - `CandidateScreeningOutput`: The output type for the `aiCandidateScreening` function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

/**
 * Input schema for candidate screening.
 */
const CandidateScreeningInputSchema = z.object({
  jobDetails: z
    .string()
    .describe('Details about the job, including responsibilities and requirements.'),
  resume: z
    .string()
    .describe(
      'The candidate resume as text. Extracted information of work experience, skills and education.'
    ),
  candidateProfile: z
    .string()
    .optional()
    .describe('Additional information about the candidate (e.g., from LinkedIn).'),
});

export type CandidateScreeningInput = z.infer<typeof CandidateScreeningInputSchema>;

/**
 * Output schema for candidate screening.
 */
const CandidateScreeningOutputSchema = z.object({
  suitabilityScore: z
    .number()
    .describe('A score (0-100) indicating how well the candidate matches the job requirements.'),
  summary: z
    .string()
    .describe('A brief summary of the candidate qualifications and experience.'),
  strengths: z
    .string()
    .describe('Key strengths of the candidate based on the provided information.'),
  areasForImprovement: z
    .string()
    .describe('Areas where the candidate may need improvement or further development.'),
  recommendation: z
    .string()
    .describe('A recommendation whether to proceed with the candidate application.'),
});

export type CandidateScreeningOutput = z.infer<typeof CandidateScreeningOutputSchema>;

/**
 * Main function to perform candidate screening.
 *
 * @param {CandidateScreeningInput} input - The input data for candidate screening.
 * @returns {Promise<CandidateScreeningOutput>} - A promise that resolves to the screening results.
 */
export async function aiCandidateScreening(input: CandidateScreeningInput): Promise<CandidateScreeningOutput> {
  return aiCandidateScreeningFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiCandidateScreeningPrompt',
  input: {schema: CandidateScreeningInputSchema},
  output: {schema: CandidateScreeningOutputSchema},
  prompt: `You are an AI-powered candidate screening tool.
  Analyze the job details, resume, and candidate profile (if available) to determine the candidate suitability for the job.

  Job Details: {{{jobDetails}}}
  Resume: {{{resume}}}
  Candidate Profile: {{{candidateProfile}}}

  Provide a suitability score (0-100), a summary of the candidate qualifications, key strengths, areas for improvement, and a recommendation.
  Ensure that the output is well-formatted, easy to read and actionable.

  Suitability Score: {{suitabilityScore}}
  Summary: {{summary}}
  Strengths: {{strengths}}
  Areas for Improvement: {{areasForImprovement}}
  Recommendation: {{recommendation}}`,
});

/**
 * Genkit flow for candidate screening.
 */
const aiCandidateScreeningFlow = ai.defineFlow(
  {
    name: 'aiCandidateScreeningFlow',
    inputSchema: CandidateScreeningInputSchema,
    outputSchema: CandidateScreeningOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
