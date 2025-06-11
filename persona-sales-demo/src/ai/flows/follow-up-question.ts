
'use server';
/**
 * @fileOverview Generates a follow-up interview question based on previous interaction.
 * - getFollowUpQuestion: Function to get the AI's follow-up question.
 * - FollowUpQuestionInput: Input type for the follow-up question flow.
 * - FollowUpQuestionOutput: Output type containing the next question.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const FollowUpQuestionInputSchema = z.object({
  jobDescription: z.string().describe('The description of the job being interviewed for.'),
  candidateResume: z.string().describe("The candidate's resume (summary or key points)."),
  previousQuestion: z.string().describe("The question Mira (AI interviewer) previously asked."),
  candidateAnswer: z.string().describe("The candidate's transcribed answer to the previous question."),
});
export type FollowUpQuestionInput = z.infer<typeof FollowUpQuestionInputSchema>;

const FollowUpQuestionOutputSchema = z.object({
  nextQuestion: z.string().describe("The follow-up question Mira should ask."),
});
export type FollowUpQuestionOutput = z.infer<typeof FollowUpQuestionOutputSchema>;

export async function getFollowUpQuestion(input: FollowUpQuestionInput): Promise<FollowUpQuestionOutput> {
  return getFollowUpQuestionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'followUpInterviewQuestionPrompt',
  input: {schema: FollowUpQuestionInputSchema},
  output: {schema: FollowUpQuestionOutputSchema},
  prompt: `You are Mira, a friendly, professional, and engaging AI Interviewer for Persona AI.
Your goal is to conduct a natural, conversational interview.
You previously asked: "{{previousQuestion}}"
The candidate responded: "{{candidateAnswer}}"

Based on the job description, candidate's resume, your previous question, and their answer, ask ONE relevant and insightful follow-up question.
Job Description Context: {{{jobDescription}}}
Candidate Resume Context: {{{candidateResume}}}

Keep your follow-up question concise and conversational.
If their answer was very short or generic, you can probe further on the same topic or gently transition to a related aspect.
Avoid making the candidate feel like they are being interrogated. Maintain a positive and encouraging tone.

Example of a good follow-up: If they talked about a project, you could ask, "That project sounds interesting! Can you tell me more about a specific challenge you faced during it and how you overcame it?"

Do not repeat greetings or introductions. Just provide the next question.
Output only the question text.
`,
});

const getFollowUpQuestionFlow = ai.defineFlow(
  {
    name: 'getFollowUpQuestionFlow',
    inputSchema: FollowUpQuestionInputSchema,
    outputSchema: FollowUpQuestionOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    if (!output) {
        // Fallback in case AI fails to generate structured output
        console.warn("AI failed to generate structured output for follow-up question. Using fallback.");
        return {
            nextQuestion: "Thanks for sharing that. Could you elaborate a bit more on your experience with [mention a relevant skill from resume/job desc]?"
        };
    }
    return output;
  }
);
