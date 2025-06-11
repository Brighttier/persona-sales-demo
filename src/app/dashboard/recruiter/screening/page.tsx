
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { BarChart, Check, Loader2, ShieldCheck, FileText, Users } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
// Placeholder for AI flow import
import { aiCandidateScreening, type CandidateScreeningInput, type CandidateScreeningOutput } from "@/ai/flows/ai-candidate-screening";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const screeningFormSchema = z.object({
  jobDetails: z.string().min(50, "Job details must be at least 50 characters."),
  resume: z.string().min(50, "Resume text must be at least 50 characters."),
  candidateProfile: z.string().optional(),
});

type ScreeningFormValues = z.infer<typeof screeningFormSchema>;

export default function CandidateScreeningPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [screeningResult, setScreeningResult] = useState<CandidateScreeningOutput | null>(null);

  const form = useForm<ScreeningFormValues>({
    resolver: zodResolver(screeningFormSchema),
    defaultValues: {
      jobDetails: "Job Title: Senior Software Engineer\nResponsibilities: Lead development of new features, mentor junior engineers, collaborate with product team on requirements.\nRequirements: 5+ years experience with React, Node.js, TypeScript. Strong understanding of microservices architecture. Excellent communication skills.",
      resume: "Summary: Highly motivated software engineer with 6 years of experience in full-stack development. Proficient in JavaScript, Python, and cloud platforms. Proven track record of delivering high-quality software solutions.\nExperience: \n- Lead Developer at Tech Solutions (2020-Present): Led a team of 5 engineers, developed key product features using React and Node.js.\n- Software Engineer at Innovate Hub (2018-2020): Contributed to frontend and backend development projects.\nSkills: React, Node.js, Python, AWS, Docker, Kubernetes, Agile methodologies.",
    },
  });

  const onSubmit = async (data: ScreeningFormValues) => {
    setIsLoading(true);
    setScreeningResult(null);
    try {
      const result = await aiCandidateScreening(data);
      setScreeningResult(result);
      toast({ title: "Screening Complete!", description: "AI analysis finished." });
    } catch (error) {
      console.error("Error during AI screening:", error);
      toast({ variant: "destructive", title: "Screening Failed", description: "Could not process the screening request." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center"><ShieldCheck className="mr-2 h-6 w-6 text-primary" /> AI Candidate Screening</CardTitle>
          <CardDescription>Paste job details and candidate resume/profile to get an AI-powered screening analysis.</CardDescription>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-lg">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <CardHeader>
                <CardTitle className="text-lg">Input Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="jobDetails"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center"><FileText className="mr-2 h-4 w-4"/> Job Details</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Paste job description, responsibilities, requirements..." {...field} rows={8} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="resume"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center"><Users className="mr-2 h-4 w-4"/> Candidate Resume (Text)</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Paste candidate's resume text..." {...field} rows={8} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="candidateProfile"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Candidate Profile (Optional)</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Additional info, e.g., LinkedIn profile summary..." {...field} rows={4} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
              <CardFooter>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
                  Screen Candidate with AI
                </Button>
              </CardFooter>
            </form>
          </Form>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg flex items-center"><BarChart className="mr-2 h-5 w-5 text-primary" /> Screening Results</CardTitle>
            <CardDescription>AI analysis will appear here.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading && (
              <div className="flex flex-col items-center justify-center h-64">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground">AI is analyzing... Please wait.</p>
              </div>
            )}
            {screeningResult && !isLoading && (
              <>
                <Alert variant="default" className="bg-primary/10 border-primary/20 shadow-sm">
                  <Check className="h-4 w-4 !text-primary" />
                  <AlertTitle className="text-primary font-semibold">Suitability Score: {screeningResult.suitabilityScore}/100</AlertTitle>
                </Alert>
                <div>
                  <h4 className="font-semibold">Summary:</h4>
                  <p className="text-sm text-foreground/80 whitespace-pre-line">{screeningResult.summary}</p>
                </div>
                <div>
                  <h4 className="font-semibold">Strengths:</h4>
                  <p className="text-sm text-foreground/80 whitespace-pre-line">{screeningResult.strengths}</p>
                </div>
                <div>
                  <h4 className="font-semibold">Areas for Improvement:</h4>
                  <p className="text-sm text-foreground/80 whitespace-pre-line">{screeningResult.areasForImprovement}</p>
                </div>
                <div>
                  <h4 className="font-semibold">Recommendation:</h4>
                   <p className="text-sm text-foreground/80 whitespace-pre-line">{screeningResult.recommendation}</p>
                </div>
              </>
            )}
            {!screeningResult && !isLoading && (
              <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-lg">
                <ShieldCheck className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Results will be displayed here after analysis.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
