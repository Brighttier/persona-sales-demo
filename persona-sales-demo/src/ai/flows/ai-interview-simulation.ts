
'use server';

/**
 * @fileOverview AI interview simulation flow. This version analyzes a full interview session (video + transcript)
 * and provides comprehensive feedback including hiring-related factors.
 *
 * - aiInterviewSimulation - A function that initiates the AI interview analysis.
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
      "A video recording of the candidate's entire interview session, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  fullTranscript: z.string().describe("The full accumulated transcript of the candidate's responses during the interview session."),
});
export type AiInterviewSimulationInput = z.infer<typeof AiInterviewSimulationInputSchema>;

const AiInterviewSimulationOutputSchema = z.object({
  overallAssessment: z.string().describe("A comprehensive overall assessment of the candidate's performance and suitability for a typical professional role based on the interview."),
  keyStrengths: z.string().describe("Specific key strengths demonstrated by the candidate during the interview, formatted as bullet points if multiple."),
  areasForImprovement: z.string().describe("Specific areas where the candidate could improve their interviewing skills or responses, formatted as bullet points if multiple."),
  communicationClarity: z.string().describe("Feedback on the clarity and effectiveness of the candidate's communication during the session."),
  bodyLanguageAnalysis: z.string().describe("Observations on the candidate's body language and presentation (e.g., eye contact, posture)."),
  relevanceToRole: z.string().describe("Analysis of how well the candidate's responses (as inferred from video and transcript) align with typical job requirements, using the provided job description and resume as context."),
  hiringRecommendationJustification: z.string().describe("A brief justification for a hypothetical hiring recommendation (e.g., 'Proceed', 'Hold', 'Do Not Proceed'), considering factors like professionalism, communication, and alignment with typical role expectations. Focus on justifying the 'why'."),
});
export type AiInterviewSimulationOutput = z.infer<typeof AiInterviewSimulationOutputSchema>;

export async function aiInterviewSimulation(input: AiInterviewSimulationInput): Promise<AiInterviewSimulationOutput> {
  return aiInterviewSimulationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiFullInterviewAnalysisPrompt',
  input: {schema: AiInterviewSimulationInputSchema},
  output: {schema: AiInterviewSimulationOutputSchema},
  prompt: `You are an expert Talent Acquisition Manager and Interview Coach.
You have received a full video recording of an interview session with a candidate, along with their resume, the job description they applied for, and a full transcript of their responses.

Your task is to provide a comprehensive analysis of the candidate's performance.

Context:
Job Description: {{{jobDescription}}}
Candidate Resume: {{{candidateResume}}}
Candidate's Full Interview Video: {{media url=videoDataUri}}
Full Transcript of Candidate's Responses: {{{fullTranscript}}}

Instructions for Analysis (address each point in your output):
1.  **Overall Assessment**: Provide a holistic view of the candidate's performance. What was your general impression?
2.  **Key Strengths**: Identify specific strengths the candidate demonstrated. Use bullet points if listing multiple strengths.
3.  **Areas for Improvement**: Pinpoint specific areas where the candidate could improve their interviewing skills or the content of their responses. Use bullet points if listing multiple areas.
4.  **Communication Clarity**: Evaluate how clearly and effectively the candidate communicated their thoughts and ideas. Consider articulation, conciseness, and structure.
5.  **Body Language and Presentation**: Analyze the candidate's non-verbal cues. Comment on eye contact, posture, professionalism, and any distracting mannerisms observed in the video.
6.  **Relevance to Role**: Based on their responses in the transcript and their presentation in the video, assess how well their skills and experience (as presented in the interview) align with the provided job description and resume.
7.  **Hiring Recommendation Justification**: Based on all the above, provide a brief justification for a hypothetical hiring recommendation (e.g., 'Proceed with next steps because...', 'Consider for other roles due to...', 'Do not proceed because...'). Focus on justifying the 'why' based on observed factors and potential fit.

Structure your output clearly according to the defined output schema. Be constructive, professional, and provide actionable insights.
`,
});

const aiInterviewSimulationFlow = ai.defineFlow(
  {
    name: 'aiFullInterviewAnalysisFlow',
    inputSchema: AiInterviewSimulationInputSchema,
    outputSchema: AiInterviewSimulationOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output) {
        // Fallback in case AI fails to generate structured output
        console.warn("AI failed to generate structured output for interview analysis. Using fallback.");
        return {
            overallAssessment: "AI analysis failed. Unable to provide an overall assessment.",
            keyStrengths: "• N/A",
            areasForImprovement: "• N/A",
            communicationClarity: "N/A",
            bodyLanguageAnalysis: "N/A",
            relevanceToRole: "N/A",
            hiringRecommendationJustification: "Unable to provide a recommendation due to analysis failure."
        };
    }
    return output;
  }
);
