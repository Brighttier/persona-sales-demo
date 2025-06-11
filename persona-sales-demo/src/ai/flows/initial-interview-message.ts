
'use server';
/**
 * @fileOverview Generates the initial greeting and first question from the AI interviewer.
 * - getInitialInterviewUtterance: Function to get the AI's first message.
 * - InitialInterviewUtteranceInput: Input (optional, for context).
 * - InitialInterviewUtteranceOutput: Output containing introduction and question.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const InitialInterviewUtteranceInputSchema = z.object({
  jobTitle: z.string().optional().describe('The job title the candidate is interviewing for.'),
  // candidateName: z.string().optional().describe("The candidate's name."), // Potential future enhancement
});
export type InitialInterviewUtteranceInput = z.infer<typeof InitialInterviewUtteranceInputSchema>;

const InitialInterviewUtteranceOutputSchema = z.object({
  aiGreeting: z.string().describe("The AI interviewer's personalized greeting."),
  firstQuestion: z.string().describe("The first question the AI interviewer asks."),
});
export type InitialInterviewUtteranceOutput = z.infer<typeof InitialInterviewUtteranceOutputSchema>;

export async function getInitialInterviewUtterance(input: InitialInterviewUtteranceInput): Promise<InitialInterviewUtteranceOutput> {
  return initialInterviewUtteranceFlow(input);
}

const prompt = ai.definePrompt({
  name: 'initialInterviewUtterancePrompt',
  input: {schema: InitialInterviewUtteranceInputSchema},
  output: {schema: InitialInterviewUtteranceOutputSchema},
  prompt: `You are Mira, a friendly, professional, and engaging AI Interviewer for Persona AI.
Your primary goal is to make the candidate feel comfortable, welcome, and like they are talking to a human.
Introduce yourself warmly.
Then, ask the candidate the following first question: "To start things off, tell me a little bit about yourself."
{{#if jobTitle}}
You can briefly mention you're conducting this interview in relation to the {{jobTitle}} position. For example: "I'm here to chat with you today about the {{jobTitle}} role."
{{/if}}
Ensure your entire response is structured to fit the output schema (aiGreeting and firstQuestion). Be conversational and human-like. Avoid overly robotic phrasing.

Example Output Structure (Remember to be creative and not use this exact text):
{
  "aiGreeting": "Hi there! I'm Mira, your AI interviewer from Persona AI. It's a pleasure to e-meet you! I'm looking forward to our conversation today, especially regarding the {{jobTitle}} position.",
  "firstQuestion": "So, to kick things off, why don't you tell me a little bit about yourself?"
}
`,
});

const initialInterviewUtteranceFlow = ai.defineFlow(
  {
    name: 'initialInterviewUtteranceFlow',
    inputSchema: InitialInterviewUtteranceInputSchema,
    outputSchema: InitialInterviewUtteranceOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    if (!output) {
        // Fallback in case AI fails to generate structured output
        console.warn("AI failed to generate structured output for initial interview message. Using fallback.");
        return {
            aiGreeting: "Hello! I'm Mira, your AI Interviewer from Persona AI. It's nice to meet you.",
            firstQuestion: "To start, could you tell me a bit about yourself?"
        };
    }
    return output;
  }
);
