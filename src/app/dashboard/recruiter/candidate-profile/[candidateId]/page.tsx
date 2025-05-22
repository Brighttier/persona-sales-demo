
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Edit3, FileUp, Loader2, Save, VenetianMask, PlusCircle, Trash2, ExternalLink, Mail, Phone, Linkedin, Briefcase, GraduationCap, UserCircle, BrainCircuit, Star } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { enrichProfile, type EnrichProfileInput, type EnrichProfileOutput } from "@/ai/flows/profile-enrichment";

// Mock data structure for an applicant from the list, including a mock resume URI
interface ApplicantDetail {
  id: string;
  name: string;
  avatar: string;
  email: string;
  phone?: string;
  linkedin?: string;
  portfolio?: string;
  headline?: string;
  mockResumeDataUri?: string; // For auto-enrichment demo
  mockExperience?: Array<{ title: string; company: string; duration: string; description: string }>;
  mockEducation?: Array<{ institution: string; degree: string; field: string; year: string }>;
}

// Simulate fetching this from your mockApplicants list on the previous page, or a DB
const MOCK_CANDIDATE_DB: Record<string, ApplicantDetail> = {
  "app1": { id: "app1", name: "Alice Johnson", avatar: "https://placehold.co/100x100.png?text=AJ", email: "alice@example.com", phone: "555-0101", linkedin: "https://linkedin.com/in/alicejohnson", headline: "Senior React Developer", mockResumeDataUri: "data:text/plain;base64,UmVzdW1lIGNvbnRlbnQgZm9yIEFsaWNlIEpvaG5zb24uIFNraWxsZWQgaW4gUmVhY3QsIE5vZGUuanMsIGFuZCBUeXBlU2NyaXB0LiA1IHllYXJzIG9mIGV4cGVyaWVuY2Uu", mockExperience: [{ title: "Lead Frontend Developer", company: "Innovatech", duration: "2021-Present", description: "Led frontend team, developed key features using React." }], mockEducation: [{ institution: "State University", degree: "BSc Computer Science", field: "CS", year: "2019" }] },
  "app2": { id: "app2", name: "Bob Williams", avatar: "https://placehold.co/100x100.png?text=BW", email: "bob@example.com", headline: "Full Stack Python Developer", mockResumeDataUri: "data:text/plain;base64,Qm9iIFdpbGxpYW1zJyBSZXN1bWUuIEV4cGVydCBQeXRob24gZGV2ZWxvcGVyLCBwcm9maWNpZW50IGluIERqYW5nbyBhbmQgU1FMLg==", mockExperience: [{title: "Backend Developer", company: "Data Corp", duration: "2020-2023", description: "Built scalable APIs with Django."}], mockEducation: [{institution: "Tech Institute", degree: "MSc Data Science", field: "Data", year: "2020"}]},
  // Add more mock candidates if needed, matching IDs from applicants page
};


const resumeUploadSchema = z.object({
  resumeFile: z.any().refine(file => file && file.length > 0, "Resume file is required."),
});
type ResumeUploadFormValues = z.infer<typeof resumeUploadSchema>;

export default function CandidateProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const candidateId = params.candidateId as string;

  const [candidate, setCandidate] = useState<ApplicantDetail | null>(null);
  const [enrichedData, setEnrichedData] = useState<EnrichProfileOutput | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEnriching, setIsEnriching] = useState(false);

  const resumeForm = useForm<ResumeUploadFormValues>({
    resolver: zodResolver(resumeUploadSchema),
  });

  const fetchAndEnrichCandidate = useCallback(async (id: string) => {
    setIsLoading(true);
    const foundCandidate = MOCK_CANDIDATE_DB[id];
    setCandidate(foundCandidate || null);

    if (foundCandidate && foundCandidate.mockResumeDataUri) {
      setIsEnriching(true);
      try {
        const result = await enrichProfile({ resumeDataUri: foundCandidate.mockResumeDataUri });
        setEnrichedData(result);
        toast({ title: "Profile Enriched", description: "AI has analyzed the resume." });
      } catch (error) {
        console.error("Initial enrichment error:", error);
        toast({ variant: "destructive", title: "AI Enrichment Failed", description: "Could not process the mock resume." });
      } finally {
        setIsEnriching(false);
      }
    }
    setIsLoading(false);
  }, [toast]);

  useEffect(() => {
    if (candidateId) {
      fetchAndEnrichCandidate(candidateId);
    }
  }, [candidateId, fetchAndEnrichCandidate]);

  const handleResumeEnrichment = async (data: ResumeUploadFormValues) => {
    const file = data.resumeFile[0];
    if (!file) return;

    setIsEnriching(true);
    toast({ title: "Processing New Resume...", description: "AI is analyzing the uploaded file." });
    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = async () => {
        const resumeDataUri = reader.result as string;
        const result = await enrichProfile({ resumeDataUri });
        setEnrichedData(result);
        // Optionally update candidate's mockResumeDataUri or file name display
        if (candidate) setCandidate({...candidate, mockResumeDataUri: "New resume uploaded"}); 
        toast({ title: "New Resume Enriched!", description: "Profile updated with new resume data." });
        resumeForm.reset();
      };
      reader.onerror = () => {
        toast({ variant: "destructive", title: "File Read Error", description: "Could not read the resume file."});
        setIsEnriching(false);
      }
    } catch (error) {
      console.error("Error enriching profile with new resume:", error);
      toast({ variant: "destructive", title: "AI Enrichment Failed", description: "Could not process the new resume." });
      setIsEnriching(false);
    }
  };

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /> <p className="ml-2">Loading profile...</p></div>;
  }

  if (!candidate) {
    return (
      <div className="text-center py-10">
        <UserCircle className="mx-auto h-12 w-12 text-muted-foreground" />
        <p className="mt-4 text-lg">Candidate not found.</p>
        <Button variant="link" asChild><Link href="/dashboard/recruiter/candidate-pool">Back to Candidate Pool</Link></Button>
      </div>
    );
  }

  const skillsToDisplay = enrichedData?.skills || [];
  const summaryToDisplay = enrichedData?.experienceSummary || "No AI summary available. Upload a resume to generate one.";

  return (
    <div className="space-y-6">
      <Button variant="outline" size="sm" onClick={() => router.back()}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Back
      </Button>

      <Card className="shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-primary/80 to-primary/60 h-32 md:h-40" />
        <div className="px-6 pb-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-end -mt-16 md:-mt-20">
            <Avatar className="h-32 w-32 md:h-40 md:w-40 border-4 border-background shadow-lg">
              <AvatarImage src={candidate.avatar} alt={candidate.name} data-ai-hint="person professional"/>
              <AvatarFallback>{candidate.name.split(" ").map(n=>n[0]).join("").toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="sm:ml-6 mt-4 sm:mt-0 text-center sm:text-left">
             <CardTitle className="text-2xl md:text-3xl">{candidate.name}</CardTitle>
             <CardDescription className="text-base mt-1 text-primary">{candidate.headline || "Headline not provided"}</CardDescription>
             <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                {candidate.email && <div className="flex items-center justify-center sm:justify-start"><Mail className="mr-2 h-4 w-4"/> {candidate.email}</div>}
                {candidate.phone && <div className="flex items-center justify-center sm:justify-start"><Phone className="mr-2 h-4 w-4"/> {candidate.phone}</div>}
             </div>
             <div className="flex gap-2 mt-3 justify-center sm:justify-start">
                {candidate.linkedin && <Button variant="ghost" size="sm" asChild><Link href={candidate.linkedin} target="_blank"><Linkedin className="h-4 w-4 mr-1"/> LinkedIn</Link></Button>}
                {candidate.portfolio && <Button variant="ghost" size="sm" asChild><Link href={candidate.portfolio} target="_blank"><ExternalLink className="h-4 w-4 mr-1"/> Portfolio</Link></Button>}
             </div>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-lg">
            <CardHeader className="flex flex-row justify-between items-center">
              <CardTitle className="text-lg flex items-center"><BrainCircuit className="mr-2 h-5 w-5 text-primary"/> AI-Generated Summary</CardTitle>
              {isEnriching && <Loader2 className="h-5 w-5 animate-spin text-primary"/>}
            </CardHeader>
            <CardContent>
              <p className="text-sm text-foreground/80 whitespace-pre-line">{summaryToDisplay}</p>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader><CardTitle className="text-lg flex items-center"><Star className="mr-2 h-5 w-5 text-primary"/> Skills</CardTitle></CardHeader>
            <CardContent>
              {isEnriching && skillsToDisplay.length === 0 && <p className="text-sm text-muted-foreground">AI is processing skills...</p>}
              {!isEnriching && skillsToDisplay.length === 0 && <p className="text-sm text-muted-foreground">No skills extracted by AI. Upload resume.</p>}
              <div className="flex flex-wrap gap-2">
                {skillsToDisplay.map(skill => <Badge key={skill} variant="default">{skill}</Badge>)}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="shadow-lg">
            <CardHeader><CardTitle className="text-lg">Resume</CardTitle></CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground mb-2">
                    {candidate.mockResumeDataUri === "data:text/plain;base64,UmVzdW1lIGNvbnRlbnQgZm9yIEFsaWNlIEpvaG5zb24uIFNraWxsZWQgaW4gUmVhY3QsIE5vZGUuanMsIGFuZCBUeXBlU2NyaXB0LiA1IHllYXJzIG9mIGV4cGVyaWVuY2Uu" 
                    ? "Original Mock Resume on file." 
                    : candidate.mockResumeDataUri === "data:text/plain;base64,Qm9iIFdpbGxpYW1zJyBSZXN1bWUuIEV4cGVydCBQeXRob24gZGV2ZWxvcGVyLCBwcm9maWNpZW50IGluIERqYW5nbyBhbmQgU1FMLg=="
                    ? "Original Mock Resume on file."
                    : candidate.mockResumeDataUri ? "New resume processed." : "No resume on file."}
                </p>
                <Form {...resumeForm}>
                    <form onSubmit={resumeForm.handleSubmit(handleResumeEnrichment)} className="space-y-3">
                        <FormField
                            control={resumeForm.control}
                            name="resumeFile"
                            render={({ field: { onChange, value, ...rest }}) => (
                                <FormItem>
                                    <FormLabel className="sr-only">New Resume</FormLabel>
                                    <FormControl>
                                        <Input type="file" accept=".pdf,.doc,.docx" onChange={(e) => onChange(e.target.files)} {...rest} className="text-xs"/>
                                    </FormControl>
                                    <FormMessage className="text-xs"/>
                                </FormItem>
                            )}
                        />
                        <Button type="submit" size="sm" className="w-full" disabled={isEnriching}>
                            {isEnriching ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <FileUp className="mr-2 h-4 w-4"/>}
                            Upload & Re-Enrich
                        </Button>
                    </form>
                </Form>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader><CardTitle className="text-lg flex items-center"><Briefcase className="mr-2 h-5 w-5 text-primary"/> Work Experience (Mock)</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {candidate.mockExperience?.map((exp, index) => (
                <div key={index} className="text-sm">
                  <h4 className="font-semibold">{exp.title}</h4>
                  <p className="text-muted-foreground">{exp.company} ({exp.duration})</p>
                  <p className="text-xs mt-1">{exp.description}</p>
                </div>
              ))}
              {!candidate.mockExperience?.length && <p className="text-sm text-muted-foreground">No work experience provided.</p>}
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader><CardTitle className="text-lg flex items-center"><GraduationCap className="mr-2 h-5 w-5 text-primary"/> Education (Mock)</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {candidate.mockEducation?.map((edu, index) => (
                <div key={index} className="text-sm">
                  <h4 className="font-semibold">{edu.institution}</h4>
                  <p className="text-muted-foreground">{edu.degree} in {edu.field}</p>
                  <p className="text-xs mt-0.5">Graduated: {edu.year}</p>
                </div>
              ))}
              {!candidate.mockEducation?.length && <p className="text-sm text-muted-foreground">No education details provided.</p>}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

    