
'use server';
/**
 * @fileOverview AI-powered candidate profile enrichment flow.
 *
 * - enrichProfile - A function that enriches a candidate's profile using AI.
 * - EnrichProfileInput - The input type for the enrichProfile function.
 * - EnrichProfileOutput - The return type for the enrichProfile function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const EnrichProfileInputSchema = z.object({
  resumeDataUri: z
    .string()
    .describe(
      "The candidate's resume as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'"
    ),
});
export type EnrichProfileInput = z.infer<typeof EnrichProfileInputSchema>;

const EnrichProfileOutputSchema = z.object({
  skills: z
    .array(z.string())
    .describe('A list of key skills extracted from the resume.'),
  experienceSummary: z
    .string()
    .describe('A summary of the candidate’s work experience.'),
});
export type EnrichProfileOutput = z.infer<typeof EnrichProfileOutputSchema>;

export async function enrichProfile(input: EnrichProfileInput): Promise<EnrichProfileOutput> {
  return enrichProfileFlow(input);
}

const prompt = ai.definePrompt({
  name: 'enrichProfilePrompt',
  input: {schema: EnrichProfileInputSchema},
  output: {schema: EnrichProfileOutputSchema},
  prompt: `You are an AI assistant specializing in extracting key skills and summarizing work experience from resumes.

  Analyze the resume provided and extract a list of key skills and a summary of the candidate's work experience.

  Resume: {{media url=resumeDataUri}}
  Skills: 
  Experience Summary:`,
});

const enrichProfileFlow = ai.defineFlow(
  {
    name: 'enrichProfileFlow',
    inputSchema: EnrichProfileInputSchema,
    outputSchema: EnrichProfileOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
