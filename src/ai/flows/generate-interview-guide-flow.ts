
'use server';
/**
 * @fileOverview AI flow to generate an interview guide/strategy for an interviewer.
 *
 * - generateInterviewGuide - A function that uses AI to suggest how to approach an interview.
 * - GenerateInterviewGuideInput - The input type for the flow.
 * - GenerateInterviewGuideOutput - The return type for the flow.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateInterviewGuideInputSchema = z.object({
  jobDescription: z.string().describe('The full job description for the role.'),
  candidateResumeSummary: z.string().describe("A summary of the candidate's resume or key skills/experience."),
  // Optional: Could add candidateScreeningSummary: z.string().optional().describe("Summary from a previous AI screening report, if available.")
});
export type GenerateInterviewGuideInput = z.infer<typeof GenerateInterviewGuideInputSchema>;

const GenerateInterviewGuideOutputSchema = z.object({
  interviewStrategy: z.string().describe('A concise guide for the interviewer, including suggested opening questions, key areas to focus on based on the candidate profile and job, and tips for driving the interview effectively.'),
});
export type GenerateInterviewGuideOutput = z.infer<typeof GenerateInterviewGuideOutputSchema>;

export async function generateInterviewGuide(input: GenerateInterviewGuideInput): Promise<GenerateInterviewGuideOutput> {
  return generateInterviewGuideFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateInterviewGuidePrompt',
  input: {schema: GenerateInterviewGuideInputSchema},
  output: {schema: GenerateInterviewGuideOutputSchema},
  prompt: `You are an expert Interview Coach AI. Your task is to provide a concise strategy for an interviewer who is about to conduct an interview.

Based on the provided Job Description and Candidate Resume Summary, generate a helpful interview guide.

The guide should include:
1.  **Suggested Opening Approach**: How to start the conversation and make the candidate comfortable.
2.  **Key Focus Areas**: Specific skills or experiences from the candidate's resume to probe deeper into, in relation to the job requirements.
3.  **Probing Questions (Examples)**: 2-3 example questions tailored to uncover insights in the key focus areas.
4.  **General Tips**: Brief advice on driving the interview to effectively assess the candidate's suitability for this role.

Keep the entire strategy concise and actionable, suitable for quick review by a busy interviewer.

Job Description:
{{{jobDescription}}}

Candidate Resume Summary:
{{{candidateResumeSummary}}}

Provide your output as a single string for the 'interviewStrategy' field. Use markdown for light formatting (like bullet points if needed).
`,
});

const generateInterviewGuideFlow = ai.defineFlow(
  {
    name: 'generateInterviewGuideFlow',
    inputSchema: GenerateInterviewGuideInputSchema,
    outputSchema: GenerateInterviewGuideOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output || !output.interviewStrategy) {
        console.warn("AI failed to generate interview strategy. Using fallback.");
        return {
            interviewStrategy: "• Start with a warm welcome and a brief overview of the role.\n• Ask the candidate to walk you through their most relevant experience from their resume.\n• Focus on understanding their problem-solving approach and technical skills related to the job description.\n• Probe for specific examples of their accomplishments.\n• Ensure you allow time for the candidate to ask questions."
        };
    }
    return output;
  }
);

// Ensure this file is registered in src/ai/dev.ts
// Example: import '@/ai/flows/generate-interview-guide-flow.ts';
