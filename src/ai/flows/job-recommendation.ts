
'use server';
/**
 * @fileOverview Implements AI-powered job recommendations for candidates based on their profile and resume.
 *
 * - recommendJobs - A function that takes candidate information and returns job recommendations.
 * - RecommendJobsInput - The input type for the recommendJobs function.
 * - RecommendJobsOutput - The return type for the recommendJobs function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const RecommendJobsInputSchema = z.object({
  candidateProfile: z.string().describe('The profile information of the candidate.'),
  resumeText: z.string().describe('The text content of the candidate\'s resume.'),
  jobDetailsEmbeddings: z.string().describe('Job details embeddings from the database.'),
});
export type RecommendJobsInput = z.infer<typeof RecommendJobsInputSchema>;

const RecommendJobsOutputSchema = z.object({
  recommendedJobs: z.array(z.string()).describe('A list of recommended job titles.'),
});
export type RecommendJobsOutput = z.infer<typeof RecommendJobsOutputSchema>;

export async function recommendJobs(input: RecommendJobsInput): Promise<RecommendJobsOutput> {
  return recommendJobsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'recommendJobsPrompt',
  input: {schema: RecommendJobsInputSchema},
  output: {schema: RecommendJobsOutputSchema},
  prompt: `You are an AI job recommendation system. Based on the candidate's profile and resume, you will recommend relevant job opportunities.

Candidate Profile: {{{candidateProfile}}}

Resume Text: {{{resumeText}}}

Job Details Embeddings: {{{jobDetailsEmbeddings}}}

Recommend a list of job titles that are most relevant to the candidate.`,
});

const recommendJobsFlow = ai.defineFlow(
  {
    name: 'recommendJobsFlow',
    inputSchema: RecommendJobsInputSchema,
    outputSchema: RecommendJobsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
