
"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { CalendarDays, CheckCircle, Clock, Edit3, MessageSquare, Video, UserCircle as UserIcon, Check, Send, Briefcase, ShieldCheck, WandSparkles, Lightbulb, Loader2, TrendingUp, ListChecks, Hourglass, PieChart } from "lucide-react";
import Link from "next/link";
import { useState, useMemo } from "react";
import { format, parseISO, isValid } from "date-fns";
import { Alert, AlertTitle, AlertDescription as ShadcnAlertDescription } from "@/components/ui/alert"; // Renamed to avoid conflict
import type { CandidateScreeningOutput } from "@/ai/flows/ai-candidate-screening";
import { generateInterviewGuide, type GenerateInterviewGuideOutput } from "@/ai/flows/generate-interview-guide-flow";
import { cn } from "@/lib/utils";

interface AssignedInterview {
  id: string;
  candidateName: string;
  jobTitle: string;
  jobId?: string;
  jobDescription?: string;
  candidateResumeSummary?: string;
  date: string;
  time: string;
  status: "Upcoming" | "Completed";
  feedbackProvided?: boolean;
  platformLink?: string;
  verdict?: "Recommend for Next Round" | "Hold" | "Do Not Recommend";
  screeningSuitabilityScore?: number;
  screeningSummary?: string;
  screeningStrengths?: string;
  screeningAreasForImprovement?: string;
  screeningRecommendation?: string;
}

const mockAssignedInterviews: AssignedInterview[] = [
  {
    id: "intAssign1", candidateName: "Charlie Candidate", jobTitle: "Software Engineer", jobId: "job1",
    jobDescription: "Seeking a skilled Software Engineer with expertise in Java and Spring Boot to develop and maintain backend services. Candidate should have 5+ years of experience and a strong understanding of microservice architecture.",
    candidateResumeSummary: "Experienced Java Developer (6 years) proficient in Spring Boot, REST APIs, and microservices. Proven ability in leading small teams and delivering scalable solutions. BSc in Computer Science.",
    date: "2024-08-20", time: "10:00 AM", status: "Upcoming", platformLink: "#",
    screeningSuitabilityScore: 88,
    screeningSummary: "Charlie shows strong alignment with the core Java and Spring Boot requirements. Experience in microservices is a plus. Good communication skills evident from resume.",
    screeningStrengths: "• Deep Java knowledge\n• Microservice architecture understanding\n• Project leadership examples mentioned in resume",
    screeningAreasForImprovement: "• Explore cloud platform experience (AWS/Azure)\n• Assess communication style for team collaboration during the interview",
    screeningRecommendation: "Strongly recommend for technical interview. Focus on system design capabilities and cloud deployment familiarity."
  },
  {
    id: "intAssign2", candidateName: "Dana Developer", jobTitle: "Product Manager", jobId: "job2",
    jobDescription: "We need an innovative Product Manager to define product vision, strategy, and roadmap for our new mobile application. Must have experience with agile methodologies and user-centric design.",
    candidateResumeSummary: "Agile Product Manager with 4 years of experience in mobile app development. Skilled in market research, user story mapping, and backlog prioritization. MBA.",
    date: "2024-08-22", time: "02:30 PM", status: "Upcoming", platformLink: "#",
    screeningSuitabilityScore: 75,
    screeningSummary: "Dana has relevant product management experience for mobile apps and agile methodologies. Needs more experience in B2B products.",
    screeningStrengths: "• User story mapping\n• Agile practices",
    screeningAreasForImprovement: "• B2B product experience\n• Go-to-market strategy for enterprise clients",
    screeningRecommendation: "Proceed with interview, focus on adaptability to B2B and strategic thinking."
  },
  {
    id: "intAssign3", candidateName: "Eddie Eng", jobTitle: "UX Designer", jobId: "job3",
    jobDescription: "Creative UX Designer wanted for crafting intuitive user interfaces for web platforms. Portfolio showcasing user-centered design projects is required.",
    candidateResumeSummary: "UX Designer with 3 years of experience. Proficient in Figma, Adobe XD, and user research. Passionate about creating accessible and engaging digital experiences.",
    date: "2024-08-10", time: "11:00 AM", status: "Completed", feedbackProvided: true, verdict: "Recommend for Next Round",
    screeningSuitabilityScore: 82,
    screeningSummary: "Eddie has a decent portfolio demonstrating good design thinking. Lacks some specific domain experience but shows strong potential.",
    screeningStrengths: "• Strong visual design skills (Figma, Adobe XD)\n• Good understanding of user research principles and application",
    screeningAreasForImprovement: "• Domain specific knowledge for our industry (FinTech)\n• Experience with complex enterprise applications and data visualization",
    screeningRecommendation: "Good candidate for further consideration. Assess adaptability and specific FinTech UI/UX interest."
  },
  {
    id: "intAssign4", candidateName: "Fiona Future", jobTitle: "Data Scientist", jobId: "job4",
    jobDescription: "Join our data science team to build predictive models and extract insights from large datasets. Requires strong Python, SQL, and machine learning skills.",
    candidateResumeSummary: "Data Scientist with 5 years of experience in ML model development, statistical analysis, and data visualization. MSc in Statistics.",
    date: "2024-08-20", time: "09:00 AM", status: "Upcoming"
  },
  {
    id: "intAssign5", candidateName: "Gary Goodfit", jobTitle: "Software Engineer", jobId: "job1",
    jobDescription: "Seeking a skilled Software Engineer with expertise in Java and Spring Boot to develop and maintain backend services. Candidate should have 5+ years of experience and a strong understanding of microservice architecture.",
    candidateResumeSummary: "Full-stack developer with 3 years in JavaScript (React, Node) and 2 years in Python (Flask). Looking to transition more into backend Java roles. Quick learner.",
    date: "2024-08-10", time: "03:00 PM", status: "Completed", feedbackProvided: false
  },
];

type VerdictOption = "Recommend for Next Round" | "Hold" | "Do Not Recommend";

export default function InterviewerDashboardPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [interviews, setInterviews] = useState<AssignedInterview[]>(mockAssignedInterviews);

  const [selectedInterviewForFeedback, setSelectedInterviewForFeedback] = useState<AssignedInterview | null>(null);
  const [feedbackText, setFeedbackText] = useState("");
  const [verdict, setVerdict] = useState<VerdictOption | undefined>(undefined);

  const [isScreeningReportDialogOpen, setIsScreeningReportDialogOpen] = useState(false);
  const [selectedInterviewForReport, setSelectedInterviewForReport] = useState<AssignedInterview | null>(null);

  const [isStrategyDialogOpen, setIsStrategyDialogOpen] = useState(false);
  const [selectedInterviewForStrategy, setSelectedInterviewForStrategy] = useState<AssignedInterview | null>(null);
  const [generatedStrategy, setGeneratedStrategy] = useState<string | null>(null);
  const [isGeneratingStrategy, setIsGeneratingStrategy] = useState(false);


  const upcomingInterviews = interviews.filter(i => i.status === "Upcoming");
  const pastInterviews = interviews.filter(i => i.status === "Completed");
  const feedbackDueCount = pastInterviews.filter(i => !i.feedbackProvided).length;

  const interviewerKpis = {
    upcoming: upcomingInterviews.length,
    feedbackDue: feedbackDueCount,
    avgFeedbackTime: "24h",
    completionRate: "95%",
  };

  const groupedUpcomingInterviews = useMemo(() => {
    return upcomingInterviews.reduce((acc, interview) => {
      const dateKey = interview.date;
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(interview);
      acc[dateKey].sort((a, b) => a.time.localeCompare(b.time));
      return acc;
    }, {} as Record<string, AssignedInterview[]>);
  }, [upcomingInterviews]);

  const sortedUpcomingDates = useMemo(() => {
    return Object.keys(groupedUpcomingInterviews).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
  }, [groupedUpcomingInterviews]);

  const handleOpenFeedbackDialog = (interview: AssignedInterview) => {
    setSelectedInterviewForFeedback(interview);
    setFeedbackText("");
    setVerdict(undefined);
  };

  const handleSubmitFeedback = () => {
    if (!selectedInterviewForFeedback) return;
    if (!feedbackText.trim()) {
      toast({ variant: "destructive", title: "Feedback Required", description: "Please provide your feedback notes." });
      return;
    }
    if (!verdict) {
      toast({ variant: "destructive", title: "Verdict Required", description: "Please select a verdict." });
      return;
    }

    console.log("Feedback Submitted (Placeholder):", {
      interviewId: selectedInterviewForFeedback.id,
      candidateName: selectedInterviewForFeedback.candidateName,
      feedback: feedbackText,
      verdict: verdict,
    });

    setInterviews(prev =>
      prev.map(i =>
        i.id === selectedInterviewForFeedback.id ? { ...i, feedbackProvided: true, verdict: verdict, status: "Completed" } : i
      )
    );

    toast({ title: "Feedback Submitted", description: `Your feedback for ${selectedInterviewForFeedback.candidateName} has been saved.` });
    setSelectedInterviewForFeedback(null);
  };

  const openScreeningReportDialog = (interview: AssignedInterview) => {
    setSelectedInterviewForReport(interview);
    setIsScreeningReportDialogOpen(true);
  };

  const openStrategyDialog = (interview: AssignedInterview) => {
    setSelectedInterviewForStrategy(interview);
    setGeneratedStrategy(null);
    setIsStrategyDialogOpen(true);
  };

  const handleGenerateStrategy = async () => {
    if (!selectedInterviewForStrategy || !selectedInterviewForStrategy.jobDescription || !selectedInterviewForStrategy.candidateResumeSummary) {
      toast({ variant: "destructive", title: "Missing Data", description: "Job description or candidate summary is missing for strategy generation."});
      return;
    }
    setIsGeneratingStrategy(true);
    try {
      const result = await generateInterviewGuide({
        jobDescription: selectedInterviewForStrategy.jobDescription,
        candidateResumeSummary: selectedInterviewForStrategy.candidateResumeSummary,
      });
      setGeneratedStrategy(result.interviewStrategy);
      toast({ title: "AI Interview Strategy Generated!", description: "Review the suggested interview approach."});
    } catch (error) {
      console.error("Error generating interview strategy:", error);
      toast({ variant: "destructive", title: "Strategy Generation Failed", description: "Could not generate interview strategy."});
    } finally {
      setIsGeneratingStrategy(false);
    }
  };


  return (
    <Dialog
      onOpenChange={(open) => {
        if (!open) {
          setSelectedInterviewForFeedback(null);
          setSelectedInterviewForReport(null);
          setSelectedInterviewForStrategy(null);
        }
      }}
    >
      <div className="space-y-8">
        <Card className="shadow-xl bg-gradient-to-br from-primary/10 via-background to-background">
          <CardHeader>
            <CardTitle className="text-2xl">Interviewer Dashboard</CardTitle>
            <CardDescription>Welcome, {user?.name?.split(" ")[0]}! View your scheduled interviews, submit feedback, and prepare with AI tools.</CardDescription>
          </CardHeader>
        </Card>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Upcoming Interviews</CardTitle>
              <CalendarDays className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{interviewerKpis.upcoming}</div>
              <p className="text-xs text-muted-foreground">Scheduled sessions</p>
            </CardContent>
          </Card>
          <Card className="shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Feedback Due</CardTitle>
              <ListChecks className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{interviewerKpis.feedbackDue}</div>
              <p className="text-xs text-muted-foreground">Interviews awaiting your feedback</p>
            </CardContent>
          </Card>
          <Card className="shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Feedback Time</CardTitle>
              <Hourglass className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{interviewerKpis.avgFeedbackTime}</div>
              <p className="text-xs text-muted-foreground">From interview completion (mock)</p>
            </CardContent>
          </Card>
          <Card className="shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Interview Completion Rate</CardTitle>
              <PieChart className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{interviewerKpis.completionRate}</div>
              <p className="text-xs text-muted-foreground">Of assigned interviews (mock)</p>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle className="text-xl flex items-center"><Briefcase className="mr-2 h-5 w-5 text-primary"/> My Interview Schedule</CardTitle>
                <CardDescription>Your upcoming interviews are listed below, grouped by date.</CardDescription>
            </CardHeader>
            <CardContent>
                {sortedUpcomingDates.length > 0 ? (
                    <div className="space-y-6">
                    {sortedUpcomingDates.map(dateStr => {
                        const dateObj = parseISO(dateStr);
                        return (
                        <div key={dateStr}>
                            <h3 className="text-lg font-semibold mb-3 border-b pb-2 text-primary">
                            {isValid(dateObj) ? format(dateObj, "EEEE, MMMM dd, yyyy") : "Invalid Date"}
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {groupedUpcomingInterviews[dateStr].map(interview => (
                                <Card key={interview.id} className="shadow-md hover:shadow-lg transition-shadow flex flex-col">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-base">{interview.candidateName}</CardTitle>
                                    <CardDescription className="text-xs">{interview.jobTitle}</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-1 text-sm flex-grow">
                                    <div className="flex items-center"><Clock className="mr-2 h-4 w-4 text-muted-foreground" /> {interview.time}</div>
                                    {interview.platformLink && <div className="flex items-center"><Video className="mr-2 h-4 w-4 text-muted-foreground" /> Platform: <Link href={interview.platformLink} target="_blank" className="text-primary hover:underline ml-1">Meeting Link</Link></div>}
                                </CardContent>
                                <CardFooter className="pt-3 border-t mt-auto space-y-2 flex-col items-stretch">
                                    <div className="flex gap-2 w-full">
                                        <Button size="sm" variant="outline" className="flex-1" asChild><Link href={interview.platformLink || "#"} target="_blank">Join Interview</Link></Button>
                                        <DialogTrigger asChild>
                                            <Button size="sm" variant="default" className="flex-1" onClick={() => handleOpenFeedbackDialog(interview)}>
                                                <Edit3 className="mr-1 h-3 w-3"/> Feedback
                                            </Button>
                                        </DialogTrigger>
                                    </div>
                                     <div className="flex gap-2 w-full">
                                        {interview.screeningSuitabilityScore !== undefined && (
                                            <DialogTrigger asChild>
                                                <Button size="sm" variant="outline" className="flex-1 border-blue-500 text-blue-600 hover:bg-blue-50" onClick={() => openScreeningReportDialog(interview)}>
                                                    <ShieldCheck className="mr-1 h-3 w-3"/> Screening Report
                                                </Button>
                                            </DialogTrigger>
                                        )}
                                        {(interview.jobDescription && interview.candidateResumeSummary) && (
                                            <DialogTrigger asChild>
                                                <Button size="sm" variant="outline" className="flex-1 border-purple-500 text-purple-600 hover:bg-purple-50" onClick={() => openStrategyDialog(interview)}>
                                                    <WandSparkles className="mr-1 h-3 w-3"/> AI Interview Strategy
                                                </Button>
                                            </DialogTrigger>
                                        )}
                                    </div>
                                </CardFooter>
                                </Card>
                            ))}
                            </div>
                        </div>
                        );
                    })}
                    </div>
                ) : (
                    <div className="text-center py-10">
                        <CalendarDays className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">No upcoming interviews scheduled for you.</p>
                    </div>
                )}
            </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl">Past Interviews ({pastInterviews.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {pastInterviews.length > 0 ? (
                <div className="space-y-4">
                {pastInterviews.map(interview => (
                    <Card key={interview.id} className="shadow-md">
                        <CardHeader className="pb-3 flex flex-row justify-between items-start">
                            <div>
                                <CardTitle className="text-base">{interview.candidateName}</CardTitle>
                                <CardDescription className="text-xs">{interview.jobTitle}</CardDescription>
                            </div>
                             <Badge className="bg-green-100 text-green-700 border-green-300"><CheckCircle className="mr-1 h-3 w-3"/>Completed</Badge>
                        </CardHeader>
                        <CardContent className="space-y-1 text-sm">
                            <div className="flex items-center"><CalendarDays className="mr-2 h-4 w-4 text-muted-foreground" /> {interview.date} at {interview.time}</div>
                             {interview.feedbackProvided && interview.verdict && (
                                <div className="pt-1">
                                    <Badge variant={interview.verdict === "Recommend for Next Round" ? "default" : interview.verdict === "Do Not Recommend" ? "destructive" : "secondary"}
                                        className={
                                            interview.verdict === "Recommend for Next Round" ? "bg-green-100 text-green-700 border-green-300" :
                                            interview.verdict === "Do Not Recommend" ? "bg-red-100 text-red-700 border-red-300" : ""
                                        }>
                                    Verdict: {interview.verdict}
                                    </Badge>
                                </div>
                            )}
                            {!interview.feedbackProvided && (
                                 <Badge variant="outline" className="border-yellow-400 text-yellow-600">Feedback Pending</Badge>
                            )}
                        </CardContent>
                         {interview.status === "Completed" && !interview.feedbackProvided && (
                            <CardFooter className="pt-3">
                                <DialogTrigger asChild>
                                    <Button size="sm" variant="outline" className="w-full border-primary text-primary hover:bg-primary/10" onClick={() => handleOpenFeedbackDialog(interview)}>
                                    <Edit3 className="mr-2 h-4 w-4"/> Provide Feedback
                                    </Button>
                                </DialogTrigger>
                            </CardFooter>
                        )}
                    </Card>
                ))}
                </div>
            ) : (
                <div className="text-center py-10">
                    <CheckCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No past interviews recorded yet.</p>
                </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Feedback Dialog */}
      {selectedInterviewForFeedback && (
        <Dialog open={!!selectedInterviewForFeedback} onOpenChange={(open) => !open && setSelectedInterviewForFeedback(null)}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Submit Feedback: {selectedInterviewForFeedback.candidateName}</DialogTitle>
                    <DialogDescription>For job: {selectedInterviewForFeedback.jobTitle}</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="feedbackText" className="font-medium">Feedback Notes</Label>
                        <Textarea
                            id="feedbackText"
                            value={feedbackText}
                            onChange={(e) => setFeedbackText(e.target.value)}
                            placeholder="Strengths, weaknesses, technical ability, communication skills, overall impression..."
                            rows={6}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="font-medium">Overall Verdict *</Label>
                        <RadioGroup value={verdict} onValueChange={(value: VerdictOption) => setVerdict(value)}>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="Recommend for Next Round" id="verdict-recommend" />
                                <Label htmlFor="verdict-recommend">Recommend for Next Round</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="Hold" id="verdict-hold" />
                                <Label htmlFor="verdict-hold">Hold / Needs Further Discussion</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="Do Not Recommend" id="verdict-reject" />
                                <Label htmlFor="verdict-reject">Do Not Recommend</Label>
                            </div>
                        </RadioGroup>
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                    <Button type="button" onClick={handleSubmitFeedback} disabled={!feedbackText.trim() || !verdict}>
                        <Send className="mr-2 h-4 w-4" /> Submit Feedback & Verdict
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      )}

      {/* Screening Report Dialog */}
      <Dialog open={isScreeningReportDialogOpen} onOpenChange={setIsScreeningReportDialogOpen}>
        <DialogContent className="sm:max-w-lg">
            <DialogHeader>
                <DialogTitle>AI Screening Report: {selectedInterviewForReport?.candidateName}</DialogTitle>
                <DialogDescription>Job: {selectedInterviewForReport?.jobTitle}</DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                {selectedInterviewForReport && selectedInterviewForReport.screeningSuitabilityScore !== undefined ? (
                    <>
                        <Alert variant="default" className={cn("shadow-sm", selectedInterviewForReport.screeningSuitabilityScore > 70 ? "bg-green-50 border-green-200 text-green-700" : selectedInterviewForReport.screeningSuitabilityScore > 50 ? "bg-yellow-50 border-yellow-200 text-yellow-700" : "bg-red-50 border-red-200 text-red-700")}>
                            <ShieldCheck className={`h-4 w-4 ${selectedInterviewForReport.screeningSuitabilityScore > 70 ? "!text-green-600" : "!text-red-600"}`} />
                            <AlertTitle className="font-semibold">Suitability Score: {selectedInterviewForReport.screeningSuitabilityScore}/100</AlertTitle>
                        </Alert>
                        <Card className="shadow-sm"><CardHeader className="p-3"><CardTitle className="text-sm">Summary</CardTitle></CardHeader><CardContent className="p-3 text-xs">{selectedInterviewForReport.screeningSummary || "N/A"}</CardContent></Card>
                        <Card className="shadow-sm"><CardHeader className="p-3"><CardTitle className="text-sm">Strengths</CardTitle></CardHeader><CardContent className="p-3 text-xs whitespace-pre-line">{selectedInterviewForReport.screeningStrengths || "N/A"}</CardContent></Card>
                        <Card className="shadow-sm"><CardHeader className="p-3"><CardTitle className="text-sm">Areas for Improvement</CardTitle></CardHeader><CardContent className="p-3 text-xs whitespace-pre-line">{selectedInterviewForReport.screeningAreasForImprovement || "N/A"}</CardContent></Card>
                        <Card className="shadow-sm"><CardHeader className="p-3"><CardTitle className="text-sm">Recommendation</CardTitle></CardHeader><CardContent className="p-3 text-xs whitespace-pre-line">{selectedInterviewForReport.screeningRecommendation || "N/A"}</CardContent></Card>
                    </>
                ) : <p className="text-muted-foreground">No screening report details available for this interview.</p>}
            </div>
            <DialogFooter>
                <DialogClose asChild><Button type="button" variant="outline">Close</Button></DialogClose>
            </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AI Interview Strategy Dialog */}
      <Dialog open={isStrategyDialogOpen} onOpenChange={setIsStrategyDialogOpen}>
        <DialogContent className="sm:max-w-lg">
            <DialogHeader>
                <DialogTitle>AI Interview Strategy: {selectedInterviewForStrategy?.candidateName}</DialogTitle>
                <DialogDescription>For Job: {selectedInterviewForStrategy?.jobTitle}</DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                {isGeneratingStrategy && (
                    <div className="flex items-center justify-center p-6">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="ml-2 text-muted-foreground">Generating AI Interview Strategy...</p>
                    </div>
                )}
                {generatedStrategy && !isGeneratingStrategy && (
                    <div className="p-4 border rounded-md bg-secondary/50">
                        <h4 className="font-semibold mb-2 text-primary">Suggested Interview Approach:</h4>
                        <div className="text-sm whitespace-pre-line">{generatedStrategy}</div>
                    </div>
                )}
                {!generatedStrategy && !isGeneratingStrategy && (
                     <Button onClick={handleGenerateStrategy} className="w-full" disabled={!selectedInterviewForStrategy?.jobDescription || !selectedInterviewForStrategy?.candidateResumeSummary}>
                        <Lightbulb className="mr-2 h-4 w-4"/> Generate Interview Strategy with AI
                    </Button>
                )}
                 {(!selectedInterviewForStrategy?.jobDescription || !selectedInterviewForStrategy?.candidateResumeSummary) && !generatedStrategy && !isGeneratingStrategy && (
                    <p className="text-xs text-destructive text-center">Job description or candidate summary missing, cannot generate strategy.</p>
                 )}
            </div>
            <DialogFooter>
                <DialogClose asChild><Button type="button" variant="outline">Close</Button></DialogClose>
                 {generatedStrategy && !isGeneratingStrategy && (
                    <Button onClick={handleGenerateStrategy} variant="secondary">
                        <WandSparkles className="mr-2 h-4 w-4"/> Regenerate
                    </Button>
                )}
            </DialogFooter>
        </DialogContent>
      </Dialog>

    </Dialog>
  );
}
