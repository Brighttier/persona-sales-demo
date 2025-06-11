
'use server';
/**
 * @fileOverview AI flow to generate job posting details.
 *
 * - generateJobPostingDetails - A function that uses AI to generate job description, responsibilities, qualifications, skills, and benefits.
 * - GenerateJobPostingInput - The input type for the flow.
 * - GenerateJobPostingOutput - The return type for the flow.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateJobPostingInputSchema = z.object({
  jobTitle: z.string().describe('The job title for which to generate details.'),
  company: z.string().optional().describe('The name of the company (optional context).'),
  experienceRequired: z.string().optional().describe('The experience level required (e.g., "3+ Years", "Senior Level", optional context).'),
  location: z.string().optional().describe('The location of the job (e.g., "City, State", "Remote"). This can influence suggested benefits and job description nuances.'),
});
export type GenerateJobPostingInput = z.infer<typeof GenerateJobPostingInputSchema>;

const GenerateJobPostingOutputSchema = z.object({
  jobDescription: z.string().describe('A concise and engaging job description paragraph, strictly between 4 and 5 lines long. If company name is provided, weave in compelling details about the company.'),
  responsibilities: z.string().describe("A list of key responsibilities, formatted as newline-separated bullet points (each starting with '• '). Minimum 7, maximum 15 bullet points."),
  qualifications: z.string().describe("A list of essential qualifications and experience, formatted as newline-separated bullet points (each starting with '• '). Minimum 5, maximum 10 bullet points."),
  skills: z.array(z.string()).describe('A list of the top 5 to 10 most relevant skills for this job title. Return as an array of strings.'),
  companyBenefits: z.string().describe("A list of typical company benefits formatted as newline-separated bullet points (each starting with '• '). Suggest 3-5 common benefits, considering location if provided."),
});
export type GenerateJobPostingOutput = z.infer<typeof GenerateJobPostingOutputSchema>;

export async function generateJobPostingDetails(input: GenerateJobPostingInput): Promise<GenerateJobPostingOutput> {
  return generateJobPostingFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateJobPostingPrompt',
  input: {schema: GenerateJobPostingInputSchema},
  output: {schema: GenerateJobPostingOutputSchema},
  prompt: `You are an AI assistant helping draft the initial, core details for a new job posting.
Your task is to take initial input (job title, and optionally company, experience level, location) and generate well-structured, clear content for the job posting sections.
Focus on accurately capturing the essence of the role for either a Hiring Manager or a Recruiter to review.

Core Role Information:
Job Title: {{{jobTitle}}}
{{#if company}}Company: {{{company}}}{{/if}}
{{#if experienceRequired}}Experience Required: {{{experienceRequired}}}{{/if}}
{{#if location}}Location: {{{location}}}{{/if}}

Follow these specific constraints for each section:

1.  **Job Description**: Generate a concise and engaging job description as a single paragraph. It MUST be strictly between 4 and 5 lines long. This section should capture the essence of the role and the company. If a company name ({{{company}}}) is provided, weave in factual details about the company culture and mission. If location ({{{location}}}) is specified as 'Remote', emphasize remote work aspects if appropriate for the role.
2.  **Responsibilities**: List key responsibilities for this role. Provide a minimum of 7 and a maximum of 15 distinct responsibilities. Each responsibility MUST start with a bullet character and a space ('• ') on a new line.
3.  **Qualifications**: List essential qualifications and experience required for this role – the "must-haves". Provide a minimum of 5 and a maximum of 10 distinct qualifications. Each qualification MUST start with a bullet character and a space ('• ') on a new line.
4.  **Skills**: Identify the top 5 to 10 most relevant technical and soft skills for this job title and context. Return these as an array of skill strings.
5.  **Company Benefits**: List 3 to 5 common company benefits relevant to a professional role, formatted as newline-separated bullet points (each starting with '• '). If a location ({{{location}}}) is provided, try to suggest benefits that are commonly valued or offered in that region or for remote roles, while still keeping them generally professional. Examples: Health Insurance, Paid Time Off, 401(k) Plan, Professional Development, Flexible Work Hours, Home Office Stipend (for remote).

The generated content should be professional and clear, ready for review and then submission for approval.
`,
});

const generateJobPostingFlow = ai.defineFlow(
  {
    name: 'generateJobPostingFlow',
    inputSchema: GenerateJobPostingInputSchema,
    outputSchema: GenerateJobPostingOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output) {
        console.warn("AI failed to generate structured output for job posting. Using fallback.");
        return {
            jobDescription: "Failed to generate job description. Please write one manually.",
            responsibilities: "• Responsibility 1\n• Responsibility 2\n• Responsibility 3\n• Responsibility 4\n• Responsibility 5\n• Responsibility 6\n• Responsibility 7",
            qualifications: "• Qualification 1\n• Qualification 2\n• Qualification 3\n• Qualification 4\n• Qualification 5",
            skills: ["Skill A", "Skill B", "Skill C", "Skill D", "Skill E"],
            companyBenefits: "• Benefit A\n• Benefit B\n• Benefit C",
        };
    }
    if (!Array.isArray(output.skills)) {
        output.skills = typeof output.skills === 'string' ? [output.skills] : [];
    }
    if (!output.companyBenefits) {
        output.companyBenefits = "• Example Benefit 1\n• Example Benefit 2\n• Example Benefit 3";
    }
    return output;
  }
);
    

    