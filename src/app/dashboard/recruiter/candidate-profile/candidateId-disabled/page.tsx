
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2, ExternalLink, Mail, Phone, Linkedin, Briefcase, GraduationCap, UserCircle, BrainCircuit, Star, Award, Building, ShieldCheck, BarChart, VideoIcon, FileText as FileTextIcon } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import React, { useState, useEffect, useCallback } from "react";
import { enrichProfile, type EnrichProfileOutput } from "@/ai/flows/profile-enrichment";
import { aiCandidateScreening, type CandidateScreeningInput, type CandidateScreeningOutput } from "@/ai/flows/ai-candidate-screening";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";


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
  mockResumeDataUri?: string; // Can be PDF data URI or text data URI
  resumeText: string;
  mockExperience?: ExperienceItem[];
  mockEducation?: EducationItem[];
  mockCertifications?: CertificationItem[];
  introductionVideoUrl?: string;
  skills?: string[];
}

const PLACEHOLDER_INTRO_VIDEO_URL = "https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4";
const samplePdfDataUri = "data:application/pdf;base64,JVBERi0xLjQKJSAgIAogMSAwIG9iagogIDw8IC9UeXBlIC9DYXRhbG9nCiAgICAgIC9QYWdlcyAyIDAgUgogID4+CmVuZG9iYgoyIDAgb2JqCiAgPDwgL1R5cGUgL1BhZ2VzCiAgICAgIC9LaWRzIFszIDAgUl0KICAgICAgL0NvdW50IDEKICA+PgplbmRvYmoKMyAwIG9iagogIDw8IC9UeXBlIC9QYWdlCiAgICAgIC9QYXJlbnQgMiAwIFIKICAgICAgL1Jlc291cmNlcyA8PAogICAgICAgICAgICAvRm9udCA8PAogICAgICAgICAgICAgICAgL0YxIDQgMCBSIAogICAgICAgICAgICA+PgogICAgICA+PgogICAgICAgIC9NZWRpYUJveCBbMCAwIDYxMiA3OTJdCiAgICAgIC9Db250ZW50cyA1IDAgUgogID4+CmVuZG9iago0IDAgb2JqCiAgPDwgL1R5cGUgL0ZvbnQKICAgICAgL1N1YnR5cGUgL1R5cGUxCiAgICAgIC9CYXNlRm9udCAvSGVsdmV0aWNhCiAgPj4KZW5kb2JqCjUgMCBvYmoKICA8PCAvTGVuZ3RoIDQwID4+CnN0cmVhbQogIEJUCiAgICAvRjEgMTggVGYKICAgIDEwMCA3MDAgVGQKICAgIChIZWxsbyBQREYpIFRqCiAgRUQKZW5kc3RyZWFtCmVuZG9iagp4cmVmCjAgNgowMDAwMDAwMDAwIDY1NTM1IGYgCjAwMDAwMDAwMTggMDAwMDAgbiAKMDAwMDAwMDA3NyAwMDAwMCBuIAowMDAwMDAwMTc4IDAwMDAwIG4gCjAwMDAwMDAzMDMgMDAwMDAgbiAKMDAwMDAwMDM2MSAwMDAwMCBuIAp0cmFpbGVyCiAgPDwgL1Jvb3QgMSAwIFIKICAgICAgL1NpemUgNgogID4+CnN0YXJ0eHJlZgo0NDQKJSVFT0YK";


const MOCK_CANDIDATE_DB: Record<string, ApplicantDetail> = {
  "app1": {
    id: "app1", name: "Alice Johnson", avatar: "https://placehold.co/100x100.png?text=AJ", email: "alice@example.com", phone: "555-0101", linkedin: "https://linkedin.com/in/alicejohnson", headline: "Senior React Developer",
    mockResumeDataUri: samplePdfDataUri, // Using the sample PDF Data URI
    resumeText: "Alice Johnson - Senior React Developer\n\nSummary:\nA highly skilled and motivated software engineer with 5+ years of experience in developing and implementing innovative web applications. Proven ability to lead frontend teams and deliver high-quality products. Passionate about creating intuitive user experiences and leveraging modern technologies.\n\nSkills:\n- Frontend: React, Redux, TypeScript, Next.js, JavaScript (ES6+), HTML5, CSS3, SASS\n- Backend: Node.js, Express.js, GraphQL\n- Databases: PostgreSQL, MongoDB\n- Tools: Git, Docker, Webpack, Jest, Cypress\n- Methodologies: Agile, Scrum\n\nExperience:\nLead Frontend Developer | Innovatech Solutions | 2021 - Present\n- Led a team of 5 frontend developers in an agile environment.\n- Architected and implemented new user-facing features using React, Redux, and TypeScript.\n- Improved application performance by 20% through code optimization and modern techniques.\n- Collaborated with UX/UI designers to translate mockups into functional components.\n\nSoftware Engineer | Web Wizards Inc. | 2019 - 2021\n- Developed and maintained responsive web applications using React and JavaScript.\n- Contributed to backend development with Node.js.\n- Participated in code reviews and agile ceremonies.\n\nEducation:\nBSc Computer Science | State University | 2019\n\nCertifications:\n- AWS Certified Developer - Associate | Amazon Web Services | 2022-03\n- Professional Scrum Master I | Scrum.org | 2021-07",
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
    skills: ["React", "Node.js", "AWS", "TypeScript", "GraphQL", "JavaScript", "HTML", "CSS", "PostgreSQL"]
  },
  "cand1": {
    id: "cand1", name: "Alice Wonderland", avatar: "https://placehold.co/100x100.png?text=AW", email: "alice.wonder@example.com", phone: "555-0102", linkedin: "https://linkedin.com/in/alicewonder", headline: "Frontend Magician",
    mockResumeDataUri: samplePdfDataUri, // Using the sample PDF Data URI
    resumeText: "Alice Wonderland - Frontend Magician\n\nSkills: React, JavaScript, HTML, CSS, Whimsical Animations.\nExperience: 5 years creating enchanting user interfaces at TeaParty Inc. Led UI development and sprinkled magic on every project.\nEducation: BFA Interactive Design, Wonderland Academy.",
    mockExperience: [{ title: "UI Enchantress", company: "TeaParty Inc.", duration: "2020 - Present", description: "Crafted delightful user experiences with React and whimsy." }],
    mockEducation: [{ institution: "Wonderland Academy", degree: "BFA Interactive Design", field: "Digital Arts", year: "2019" }],
    mockCertifications: [{ name: "Mad Hatter Certified UI Designer", issuingOrganization: "Wonderland Council", date: "2021" }],
    introductionVideoUrl: "",
    skills: ["React", "JavaScript", "HTML", "CSS", "Whimsical Animations"]
  },
  // Other candidates can have text-based mockResumeDataUri or null
  "app2": {
    id: "app2", name: "Bob Williams", avatar: "https://placehold.co/100x100.png?text=BW", email: "bob@example.com", phone: "555-0103", linkedin: "https://linkedin.com/in/bobwilliams", headline: "Data-Driven Python Developer",
    mockResumeDataUri: "data:text/plain;base64,Qm9iIFdpbGxpYW1zJyBSZXN1bWUuIEV4cGVydCBQeXRob24gZGV2ZWxvcGVyLCBwcm9maWNpZW50IGluIERqYW5nbyBhbmQgU1FMLg==",
    resumeText: "Bob Williams - Python Developer\nSkills: Python, Django, SQL, Data Analysis.\nExperience: 3 years building scalable web applications with Django at DataCorp.\nEducation: MSc Data Science, Tech University.",
    mockExperience: [{ title: "Python Developer", company: "DataCorp", duration: "2021 - Present", description: "Developed backend systems and data processing pipelines." }],
    mockEducation: [{ institution: "Tech University", degree: "MSc Data Science", field: "Data Science", year: "2020" }],
    introductionVideoUrl: PLACEHOLDER_INTRO_VIDEO_URL,
    skills: ["Python", "Django", "SQL", "Data Analysis"]
  },
};

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
  const [isViewResumeDialogOpen, setIsViewResumeDialogOpen] = useState(false);


  const fetchAndEnrichCandidate = useCallback(async (id: string) => {
    setIsLoading(true);
    const foundCandidate = MOCK_CANDIDATE_DB[id];
    setCandidate(foundCandidate || null);

    if (foundCandidate && foundCandidate.mockResumeDataUri && foundCandidate.mockResumeDataUri.startsWith("data:text/plain;base64,")) {
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
        setEnrichedData(null); // No enrichment if no text data URI
    }
    setIsLoading(false);
  }, [toast]);

  useEffect(() => {
    if (candidateId) {
      fetchAndEnrichCandidate(candidateId);
    }
  }, [candidateId, fetchAndEnrichCandidate]);


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
            candidateProfile: `Name: ${candidate.name}, Email: ${candidate.email}, Skills: ${(candidate.skills || enrichedData?.skills || []).join(', ')}`,
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

  const skillsToDisplay = candidate.skills || enrichedData?.skills || [];
  const summaryToDisplay = enrichedData?.experienceSummary || candidate.resumeText.split('\n\n')[1] || "No AI summary available. Candidate's resume might not have been processed by AI.";
  const isPdfResumeAvailable = candidate.mockResumeDataUri && candidate.mockResumeDataUri.startsWith("data:application/pdf;base64,");


  return (
    <div className="space-y-6">
      <Button variant="outline" size="sm" onClick={() => router.back()}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Back
      </Button>

      <Card className="shadow-xl">
        <div className="bg-gradient-to-br from-primary/10 via-background to-background h-16 md:h-20" />
        <div className="px-6 pb-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start">
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
              {(isEnriching || isLoading) && skillsToDisplay.length === 0 && <Loader2 className="h-5 w-5 animate-spin text-primary"/>}
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
            <CardHeader><CardTitle className="text-lg flex items-center"><FileTextIcon className="mr-2 h-5 w-5 text-primary"/>Resume</CardTitle></CardHeader>
            <CardContent className="space-y-2">
                <p className="text-sm text-muted-foreground">
                    {isPdfResumeAvailable
                      ? "Candidate's original resume (PDF) is available for viewing."
                      : candidate.mockResumeDataUri
                        ? "Candidate's resume text has been processed by AI."
                        : "No resume data available."
                    }
                </p>
                <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => setIsViewResumeDialogOpen(true)}
                    disabled={!candidate.mockResumeDataUri}
                >
                    {isPdfResumeAvailable ? "View Original Resume (PDF)" : "View Resume Text"}
                </Button>
            </CardContent>
          </Card>
           <Card className="shadow-lg">
            <CardHeader><CardTitle className="text-lg flex items-center"><Star className="mr-2 h-5 w-5 text-primary"/> Skills</CardTitle></CardHeader>
            <CardContent>
              {(isEnriching || isLoading) && skillsToDisplay.length === 0 && <p className="text-sm text-muted-foreground">AI is processing skills...</p>}
              {!isEnriching && !isLoading && skillsToDisplay.length === 0 && <p className="text-sm text-muted-foreground">No skills listed.</p>}
              <div className="flex flex-wrap gap-2">
                {skillsToDisplay.map(skill => <Badge key={skill} variant="default" className="text-sm py-1 px-2">{skill}</Badge>)}
              </div>
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
                        <AlertTitle className={cn("font-semibold", quickScreenResult.suitabilityScore > 70 ? "text-green-700" : "text-red-700")}>
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

      {/* View Resume Dialog */}
      <Dialog open={isViewResumeDialogOpen} onOpenChange={setIsViewResumeDialogOpen}>
        <DialogContent className="sm:max-w-2xl md:max-w-3xl lg:max-w-4xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Resume: {candidate?.name}</DialogTitle>
            <DialogDescription>
                {isPdfResumeAvailable ? "Original PDF Document" : "Text Content"}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 flex-grow overflow-hidden">
            {isPdfResumeAvailable && candidate?.mockResumeDataUri ? (
                 <iframe src={candidate.mockResumeDataUri} className="w-full h-full min-h-[60vh]" title={`Resume for ${candidate?.name}`} />
            ) : candidate?.resumeText ? (
                <pre className="whitespace-pre-wrap text-sm bg-muted p-4 rounded-md border h-full overflow-y-auto">
                    {candidate.resumeText}
                </pre>
            ) : (
              <p className="text-muted-foreground">No resume content available to display.</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewResumeDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
