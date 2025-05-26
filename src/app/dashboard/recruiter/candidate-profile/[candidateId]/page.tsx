
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, FileUp, Loader2, ExternalLink, Mail, Phone, Linkedin, Briefcase, GraduationCap, UserCircle, BrainCircuit, Star, Award, Building, ShieldCheck, BarChart, VideoIcon } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import React, { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { enrichProfile, type EnrichProfileOutput } from "@/ai/flows/profile-enrichment";
import { aiCandidateScreening, type CandidateScreeningInput, type CandidateScreeningOutput } from "@/ai/flows/ai-candidate-screening";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";


// Data structures for profile sections
interface ExperienceItem {
  title: string;
  company: string;
  duration: string;
  description: string;
}

interface EducationItem {
  institution: string;
  degree: string;
  field: string;
  year: string;
}

interface CertificationItem {
  name: string;
  issuingOrganization: string;
  date: string; 
  credentialID?: string;
}

interface ApplicantDetail {
  id: string;
  name: string;
  avatar: string;
  email: string;
  phone?: string;
  linkedin?: string;
  portfolio?: string;
  headline?: string;
  mockResumeDataUri?: string; 
  resumeText: string; 
  mockExperience?: ExperienceItem[];
  mockEducation?: EducationItem[];
  mockCertifications?: CertificationItem[];
  introductionVideoUrl?: string; // Added for introduction video
}

const PLACEHOLDER_INTRO_VIDEO_URL = "https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4";

const MOCK_CANDIDATE_DB: Record<string, ApplicantDetail> = {
  "app1": {
    id: "app1", name: "Alice Johnson", avatar: "https://placehold.co/100x100.png?text=AJ", email: "alice@example.com", phone: "555-0101", linkedin: "https://linkedin.com/in/alicejohnson", headline: "Senior React Developer",
    mockResumeDataUri: "data:text/plain;base64,UmVzdW1lIGNvbnRlbnQgZm9yIEFsaWNlIEpvaG5zb24uIFNraWxsZWQgaW4gUmVhY3QsIE5vZGUuanMsIGFuZCBUeXBlU2NyaXB0LiA1IHllYXJzIG9mIGV4cGVyaWVuY2Uu",
    resumeText: "Alice Johnson - Senior React Developer. Skills: React, Redux, TypeScript, Node.js, GraphQL. Experience: 5 years developing scalable web applications. Led front-end team at Innovatech. Improved performance by 20%. Education: BSc Computer Science, State University.",
    mockExperience: [
      { title: "Lead Frontend Developer", company: "Innovatech Solutions", duration: "2021 - Present", description: "Led a team of 5 frontend developers in agile environment. Architected and implemented new user-facing features using React, Redux, and TypeScript. Improved application performance by 20%." },
      { title: "Software Engineer", company: "Web Wizards Inc.", duration: "2019 - 2021", description: "Developed and maintained responsive web applications. Collaborated with UX/UI designers to translate mockups into functional components." }
    ],
    mockEducation: [
      { institution: "State University", degree: "BSc Computer Science", field: "Computer Science", year: "2019" }
    ],
    mockCertifications: [
      { name: "AWS Certified Developer - Associate", issuingOrganization: "Amazon Web Services", date: "2022-03" },
      { name: "Professional Scrum Master I", issuingOrganization: "Scrum.org", date: "2021-07" }
    ],
    introductionVideoUrl: PLACEHOLDER_INTRO_VIDEO_URL,
  },
  "app2": {
    id: "app2", name: "Bob Williams", avatar: "https://placehold.co/100x100.png?text=BW", email: "bob@example.com", headline: "Full Stack Python Developer",
    mockResumeDataUri: "data:text/plain;base64,Qm9iIFdpbGxpYW1zJyBSZXN1bWUuIEV4cGVydCBQeXRob24gZGV2ZWxvcGVyLCBwcm9maWNpZW50IGluIERqYW5nbyBhbmQgU1FMLg==",
    resumeText: "Bob Williams - Full Stack Python Developer. Proficient in Django, Flask, SQL, and REST APIs. Built backend systems for Data Corp. MSc Data Science from Tech Institute.",
    mockExperience: [
      { title: "Backend Developer", company: "Data Corp", duration: "2020 - 2023", description: "Built scalable APIs with Django and Flask. Managed PostgreSQL databases and integrated third-party services." }
    ],
    mockEducation: [
      { institution: "Tech Institute", degree: "MSc Data Science", field: "Data Science", year: "2020" }
    ],
    mockCertifications: [
      { name: "Google Cloud Professional Data Engineer", issuingOrganization: "Google Cloud", date: "2023-01" }
    ],
    introductionVideoUrl: "",
  },
  "app5": { 
    id: "app5", name: "Eve Brown", avatar: "https://placehold.co/100x100.png?text=EB", email: "eve@example.com", headline: "Creative Vue.js Developer",
    mockResumeDataUri: "data:text/plain;base64,RXZlIEJyb3duJ3MgUmVzdW1lLiBWdWUuanMgYW5kIEZpcmViYXNlIGV4cGVydC4=",
    resumeText: "Eve Brown - Creative Vue.js Developer. Expertise in Vue.js, Vuex, Vuetify, and Firebase. Designed and implemented UIs at Web Creations. BA Graphic Design.",
    mockExperience: [
      { title: "UI Developer", company: "Web Creations", duration: "2022 - Present", description: "Designed and implemented user interfaces with Vue.js, Vuex, and Vuetify. Focused on accessibility and responsive design." }
    ],
    mockEducation: [
      { institution: "Design School of Fine Arts", degree: "BA Graphic Design", field: "Graphic Design", year: "2021" }
    ],
     mockCertifications: [
      { name: "Certified Vue.js Developer", issuingOrganization: "Vue School", date: "2022-08" }
    ],
    introductionVideoUrl: PLACEHOLDER_INTRO_VIDEO_URL,
  },
  "cand1": {
    id: "cand1", name: "Alice Wonderland", avatar: "https://placehold.co/100x100.png?text=AW", email: "alice.wonder@example.com", phone: "555-0102", linkedin: "https://linkedin.com/in/alicewonder", headline: "Frontend Magician",
    mockResumeDataUri: "data:text/plain;base64,QWxpY2UgV29uZGVybGFuZDogUmVhY3QsIEphdmFTY3JpcHQsIEhUTUwsIENTUy4=",
    resumeText: "Alice Wonderland - Frontend Magician. Skills: React, JavaScript, HTML, CSS. 5 years experience creating enchanting user interfaces. Led UI development at TeaParty Inc.",
    mockExperience: [{ title: "UI Enchantress", company: "TeaParty Inc.", duration: "2020 - Present", description: "Crafted delightful user experiences with React and whimsy." }],
    mockEducation: [{ institution: "Wonderland Academy", degree: "BFA Interactive Design", field: "Digital Arts", year: "2019" }],
    mockCertifications: [{ name: "Mad Hatter Certified UI Designer", issuingOrganization: "Wonderland Council", date: "2021" }],
    introductionVideoUrl: "",
  },
  "cand2": {
    id: "cand2", name: "Bob The Builder", avatar: "https://placehold.co/100x100.png?text=BB", email: "bob.builder@example.com", phone: "555-0103", linkedin: "https://linkedin.com/in/bobthebuilder", headline: "Product Construction Expert",
    mockResumeDataUri: "data:text/plain;base64,Qm9iIFRoZSBCdWlsZGVyOiBQcm9kdWN0IE1hbmFnZW1lbnQsIEFnaWxlLCBSb2FkbWFwcGluZy4=",
    resumeText: "Bob The Builder - Product Construction Expert. Skills: Product Management, Agile, Roadmapping, JIRA. 8 years experience building successful products. Yes, we can!",
    mockExperience: [{ title: "Chief Product Architect", company: "Builder's Guild", duration: "2018 - Present", description: "Led product strategy and execution for several flagship tools." }],
    mockEducation: [{ institution: "University of Construction", degree: "Master of Product Management", field: "Product Strategy", year: "2017" }],
    mockCertifications: [{ name: "Certified Scrum Product Owner (CSPO)", issuingOrganization: "Scrum Alliance", date: "2018" }],
    introductionVideoUrl: PLACEHOLDER_INTRO_VIDEO_URL,
  },
  "cand3": {
    id: "cand3", name: "Carol Danvers", avatar: "https://placehold.co/100x100.png?text=CD", email: "carol.danvers@example.com", phone: "555-0104", linkedin: "https://linkedin.com/in/caroldanvers", headline: "Captain of UX Design",
    mockResumeDataUri: "data:text/plain;base64,Q2Fyb2wgRGFudmVyczogVVggRGVzaWduLCBGaWdtYSwgUHJvdG90eXBpbmcu",
    resumeText: "Carol Danvers - Captain of UX Design. Skills: UX Design, Figma, Prototyping, User Research. 3 years experience creating stellar user experiences. Higher, further, faster.",
    mockExperience: [{ title: "Lead UX Pilot", company: "Starforce Design", duration: "2021 - Present", description: "Designed user-centric interfaces for intergalactic applications." }],
    mockEducation: [{ institution: "Air Force Academy of Design", degree: "BSc User Experience", field: "Human-Computer Interaction", year: "2020" }],
    mockCertifications: [{ name: "Certified Figma Design Expert", issuingOrganization: "Figma Academy", date: "2022" }],
    introductionVideoUrl: "",
  },
   "cand4": {
    id: "cand4", name: "David Copperfield", avatar: "https://placehold.co/100x100.png?text=DC", email: "david.copperfield@example.com", phone: "555-0105", linkedin: "https://linkedin.com/in/davidcopperfield", headline: "Data Illusionist",
    mockResumeDataUri: "data:text/plain;base64,RGF2aWQgQ29wcGVyZmllbGQ6IERhdGEgU2NpZW5jZSwgUHl0aG9uLCBNTC4=",
    resumeText: "David Copperfield - Data Illusionist. Skills: Data Science, Python, Machine Learning, TensorFlow. 6 years experience making data disappear and reappear as insights. It's all about misdirection.",
    mockExperience: [{ title: "Chief Data Sorcerer", company: "Magic & Models Inc.", duration: "2019 - Present", description: "Developed predictive models and data visualizations that amazed audiences." }],
    mockEducation: [{ institution: "Houdini University of Statistics", degree: "PhD Applied Magic (Data Science)", field: "Statistical Sorcery", year: "2018" }],
    mockCertifications: [{ name: "Certified TensorFlow Developer", issuingOrganization: "Google", date: "2020" }],
    introductionVideoUrl: PLACEHOLDER_INTRO_VIDEO_URL,
  }
};

const resumeUploadSchema = z.object({
  resumeFile: z.any().refine(fileList => fileList && fileList.length === 1, "Resume file is required."),
});
type ResumeUploadFormValues = z.infer<typeof resumeUploadSchema>;

const mockQuickScreenJobs = [
    { id: "job1", title: "Software Engineer, Frontend", description: "Develop user-facing features using React and Next.js. 5+ years experience needed." },
    { id: "job2", title: "Senior Backend Developer (Python)", description: "Lead Python backend development, design APIs, manage databases. 7+ years experience in Python, Django/Flask." },
    { id: "job3", title: "UX Lead Designer", description: "Oversee UX strategy, conduct user research, create prototypes. 6+ years experience in UX." },
    { id: "job4", title: "Junior Data Analyst", description: "Analyze data, create reports, support data-driven decisions. Entry-level, SQL and Python preferred." },
];

export default function CandidateProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const candidateId = params.candidateId as string;

  const [candidate, setCandidate] = useState<ApplicantDetail | null>(null);
  const [enrichedData, setEnrichedData] = useState<EnrichProfileOutput | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEnriching, setIsEnriching] = useState(false);
  
  const [selectedJobIdForScreening, setSelectedJobIdForScreening] = useState<string | undefined>(undefined);
  const [quickScreenResult, setQuickScreenResult] = useState<CandidateScreeningOutput | null>(null);
  const [isQuickScreeningLoading, setIsQuickScreeningLoading] = useState(false);


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
      } catch (error) {
        console.error("Initial enrichment error:", error);
        toast({ variant: "destructive", title: "AI Enrichment Failed", description: "Could not process the mock resume." });
      } finally {
        setIsEnriching(false);
      }
    } else if (foundCandidate) {
        setEnrichedData(null);
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
    setQuickScreenResult(null); 
    toast({ title: "Processing New Resume...", description: "AI is analyzing the uploaded file." });
    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = async () => {
        const resumeDataUri = reader.result as string;
        
        let newResumeText = "Uploaded resume content." 
        if (resumeDataUri.startsWith('data:application/pdf;base64,') || resumeDataUri.startsWith('data:text/plain;base64,')){
            newResumeText = atob(resumeDataUri.split(',')[1]);
        }

        const result = await enrichProfile({ resumeDataUri });
        setEnrichedData(result);
        if (candidate) setCandidate({...candidate, mockResumeDataUri: "New resume uploaded", resumeText: newResumeText }); 
        toast({ title: "New Resume Enriched!", description: "Profile updated with new resume data." });
        resumeForm.reset();
      };
      reader.onerror = () => {
        toast({ variant: "destructive", title: "File Read Error", description: "Could not read the resume file."});
      }
    } catch (error) {
      console.error("Error enriching profile with new resume:", error);
      toast({ variant: "destructive", title: "AI Enrichment Failed", description: "Could not process the new resume." });
    } finally {
      setIsEnriching(false);
    }
  };
  
  const handleQuickScreen = async () => {
    if (!candidate || !candidate.resumeText || !selectedJobIdForScreening) {
        toast({ variant: "destructive", title: "Missing Data", description: "Candidate resume or selected job is missing for screening." });
        return;
    }
    const selectedJob = mockQuickScreenJobs.find(job => job.id === selectedJobIdForScreening);
    if (!selectedJob) {
        toast({ variant: "destructive", title: "Job Not Found", description: "Selected job details could not be found." });
        return;
    }

    setIsQuickScreeningLoading(true);
    setQuickScreenResult(null);
    try {
        const screeningInput: CandidateScreeningInput = {
            jobDetails: selectedJob.description,
            resume: candidate.resumeText,
            candidateProfile: `Name: ${candidate.name}, Email: ${candidate.email}, Skills: ${(enrichedData?.skills || []).join(', ')}`,
        };
        const result = await aiCandidateScreening(screeningInput);
        setQuickScreenResult(result);
        toast({ title: "Quick Screen Complete!", description: `AI analysis for ${selectedJob.title} finished.` });
    } catch (error) {
        console.error("Quick Screening Error:", error);
        toast({ variant: "destructive", title: "Quick Screen Failed", description: "Could not process the screening request." });
    } finally {
        setIsQuickScreeningLoading(false);
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
  const currentResumeFile = resumeForm.watch("resumeFile")?.[0] as File | undefined;


  return (
    <div className="space-y-6">
      <Button variant="outline" size="sm" onClick={() => router.back()}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Back
      </Button>

      <Card className="shadow-xl">
        <div className="bg-gradient-to-br from-primary/10 via-background to-background h-16 md:h-20" />
        <div className="px-6 pb-6">
          <div className="flex flex-col sm:flex-row items-start">
            <div className="-mt-12 md:-mt-16 shrink-0">
              <Avatar className="h-32 w-32 md:h-40 md:w-40 border-4 border-background shadow-lg">
                <AvatarImage src={candidate.avatar} alt={candidate.name} data-ai-hint="person professional"/>
                <AvatarFallback>{candidate.name.split(" ").map(n=>n[0]).join("").toUpperCase()}</AvatarFallback>
              </Avatar>
            </div>
            <div className="sm:ml-6 mt-4 sm:mt-0 text-center sm:text-left w-full">
             <CardTitle className="text-2xl md:text-3xl text-foreground">{candidate.name}</CardTitle>
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
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-lg">
            <CardHeader className="flex flex-row justify-between items-center">
              <CardTitle className="text-lg flex items-center"><BrainCircuit className="mr-2 h-5 w-5 text-primary"/> AI-Generated Summary</CardTitle>
              {(isEnriching || isLoading) && <Loader2 className="h-5 w-5 animate-spin text-primary"/>}
            </CardHeader>
            <CardContent>
              <p className="text-sm text-foreground/80 whitespace-pre-line">{summaryToDisplay}</p>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader><CardTitle className="text-lg flex items-center"><Briefcase className="mr-2 h-5 w-5 text-primary"/> Work Experience</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {candidate.mockExperience?.length ? candidate.mockExperience.map((exp, index) => (
                <div key={index} className="pb-4 mb-4 border-b border-border last:border-b-0 last:pb-0 last:mb-0">
                  <h4 className="font-semibold text-md">{exp.title}</h4>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Building className="mr-1.5 h-3.5 w-3.5"/>{exp.company} 
                    <span className="mx-2">|</span> 
                    {exp.duration}
                  </div>
                  <p className="text-sm mt-1 text-foreground/80 whitespace-pre-line">{exp.description}</p>
                </div>
              )) : <p className="text-sm text-muted-foreground">No work experience provided.</p>}
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader><CardTitle className="text-lg flex items-center"><GraduationCap className="mr-2 h-5 w-5 text-primary"/> Education</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {candidate.mockEducation?.length ? candidate.mockEducation.map((edu, index) => (
                <div key={index} className="pb-4 mb-4 border-b border-border last:border-b-0 last:pb-0 last:mb-0">
                  <h4 className="font-semibold text-md">{edu.institution}</h4>
                  <p className="text-sm text-muted-foreground">{edu.degree} in {edu.field}</p>
                  <p className="text-xs mt-0.5 text-muted-foreground">Graduated: {edu.year}</p>
                </div>
              )) : <p className="text-sm text-muted-foreground">No education details provided.</p>}
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader><CardTitle className="text-lg flex items-center"><Award className="mr-2 h-5 w-5 text-primary"/> Certifications</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {candidate.mockCertifications?.length ? candidate.mockCertifications.map((cert, index) => (
                <div key={index} className="pb-4 mb-4 border-b border-border last:border-b-0 last:pb-0 last:mb-0">
                  <h4 className="font-semibold text-md">{cert.name}</h4>
                  <p className="text-sm text-muted-foreground">Issued by: {cert.issuingOrganization}</p>
                  <p className="text-xs mt-0.5 text-muted-foreground">Date: {cert.date} {cert.credentialID && `| ID: ${cert.credentialID}`}</p>
                </div>
              )) : <p className="text-sm text-muted-foreground">No certifications listed.</p>}
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <Card className="shadow-lg">
            <CardHeader><CardTitle className="text-lg flex items-center"><VideoIcon className="mr-2 h-5 w-5 text-primary"/> Introduction Video</CardTitle></CardHeader>
            <CardContent>
              {candidate.introductionVideoUrl ? (
                <video src={candidate.introductionVideoUrl} controls className="w-full rounded-md aspect-video shadow-inner bg-muted"></video>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  <VideoIcon className="mx-auto h-10 w-10 mb-2" />
                  <p className="text-sm">No introduction video provided.</p>
                </div>
              )}
            </CardContent>
          </Card>
          <Card className="shadow-lg">
            <CardHeader><CardTitle className="text-lg flex items-center"><Star className="mr-2 h-5 w-5 text-primary"/> Skills</CardTitle></CardHeader>
            <CardContent>
              {(isEnriching || isLoading) && skillsToDisplay.length === 0 && <p className="text-sm text-muted-foreground">AI is processing skills...</p>}
              {!isEnriching && !isLoading && skillsToDisplay.length === 0 && <p className="text-sm text-muted-foreground">No skills extracted. Upload resume.</p>}
              <div className="flex flex-wrap gap-2">
                {skillsToDisplay.map(skill => <Badge key={skill} variant="default" className="text-sm py-1 px-2">{skill}</Badge>)}
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-lg">
            <CardHeader><CardTitle className="text-lg">Resume</CardTitle></CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground mb-2">
                    {candidate.mockResumeDataUri === "New resume uploaded"
                      ? "New resume has been processed."
                      : candidate.mockResumeDataUri?.startsWith("data:")
                        ? "Original mock resume on file."
                        : "No resume on file or not a data URI."}
                </p>
                <Form {...resumeForm}>
                    <form onSubmit={resumeForm.handleSubmit(handleResumeEnrichment)} className="space-y-3">
                        <FormField
                            control={resumeForm.control}
                            name="resumeFile"
                            render={({ field: { onChange, value, ...rest }}) => {
                                const resumeFileInputId = `recruiter-candidate-resume-${React.useId()}`;
                                const currentFile = value?.[0] as File | undefined;
                                return (
                                <FormItem>
                                    <FormLabel htmlFor={resumeFileInputId} className="sr-only">New Resume</FormLabel>
                                    <FormControl>
                                      <div>
                                        <Input 
                                            type="file"
                                            id={resumeFileInputId}
                                            accept=".pdf,.txt" 
                                            onChange={(e) => onChange(e.target.files)}
                                            className="sr-only"
                                            disabled={isEnriching || isLoading}
                                            {...rest} 
                                        />
                                        <Label
                                            htmlFor={resumeFileInputId}
                                            className={cn(
                                                "inline-flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium cursor-pointer w-full",
                                                "bg-primary text-primary-foreground shadow-md hover:bg-primary/90 hover:shadow-lg transition-all"
                                            )}
                                        >
                                            <FileUp className="mr-2 h-4 w-4" />
                                            {currentFile?.name ? "Change Resume" : "Upload & Re-Enrich"}
                                        </Label>
                                      </div>
                                    </FormControl>
                                     {currentFile?.name && <p className="text-xs text-muted-foreground mt-1">Selected: {currentFile.name}</p>}
                                    <FormMessage className="text-xs"/>
                                </FormItem>
                                );
                            }}
                        />
                        <Button type="submit" size="sm" className="w-full" disabled={isEnriching || isLoading || !currentResumeFile}>
                            {isEnriching ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <FileUp className="mr-2 h-4 w-4"/>}
                            Process New Resume
                        </Button>
                    </form>
                </Form>
            </CardContent>
          </Card>
           <Card className="shadow-lg">
            <CardHeader><CardTitle className="text-lg flex items-center"><ShieldCheck className="mr-2 h-5 w-5 text-primary"/>Quick Screen Candidate</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                <Select onValueChange={setSelectedJobIdForScreening} value={selectedJobIdForScreening}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select a job to screen for..." />
                    </SelectTrigger>
                    <SelectContent>
                        {mockQuickScreenJobs.map(job => (
                            <SelectItem key={job.id} value={job.id}>{job.title}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Button onClick={handleQuickScreen} className="w-full" disabled={isQuickScreeningLoading || !selectedJobIdForScreening}>
                    {isQuickScreeningLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <BarChart className="mr-2 h-4 w-4" />}
                    Screen for this Job
                </Button>
                 {isQuickScreeningLoading && (
                    <div className="flex items-center justify-center text-sm text-muted-foreground">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin"/> AI is analyzing...
                    </div>
                )}
                {quickScreenResult && !isQuickScreeningLoading && (
                     <Alert variant={quickScreenResult.suitabilityScore > 70 ? "default" : "destructive"} className={cn("shadow-sm", quickScreenResult.suitabilityScore > 70 ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200")}>
                        <ShieldCheck className={`h-4 w-4 ${quickScreenResult.suitabilityScore > 70 ? "!text-green-600" : "!text-red-600"}`} />
                        <AlertTitle className={quickScreenResult.suitabilityScore > 70 ? "text-green-700" : "text-red-700"}>
                            Suitability Score: {quickScreenResult.suitabilityScore}/100
                        </AlertTitle>
                        <AlertDescription className="text-xs space-y-1 mt-1">
                            <p className="font-medium">Summary: <span className="font-normal whitespace-pre-line">{quickScreenResult.summary}</span></p>
                            <p className="font-medium">Recommendation: <span className="font-normal whitespace-pre-line">{quickScreenResult.recommendation}</span></p>
                        </AlertDescription>
                    </Alert>
                )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

