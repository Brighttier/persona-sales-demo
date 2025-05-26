
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Search, Eye, ShieldCheck, Edit3, CalendarPlus, UserX, Users, Loader2, FileText } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { aiCandidateScreening, type CandidateScreeningInput, type CandidateScreeningOutput } from "@/ai/flows/ai-candidate-screening";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { ScheduleInterviewModal } from "./ScheduleInterviewModal";

interface Applicant {
  id: string;
  name: string;
  avatar: string;
  applicationDate: string;
  aiMatchScore?: number;
  status: "New" | "Screening" | "Shortlisted" | "Interview" | "Offer" | "Hired" | "Not Selected" | "Withdrawn";
  email: string;
  skills: string[];
  resumeText?: string;
  jobTitleAppliedFor?: string;
  mockResumeDataUri?: string;
}

const initialMockApplicants: Applicant[] = [
  { id: "app1", name: "Alice Johnson", avatar: "https://placehold.co/100x100.png?text=AJ", applicationDate: "2024-07-25", aiMatchScore: 92, status: "New", email: "alice@example.com", skills: ["React", "Node.js", "TypeScript"], resumeText: "Highly skilled React developer with 5 years of experience in Node.js and TypeScript.", jobTitleAppliedFor: "Software Engineer, Frontend", mockResumeDataUri: "data:text/plain;base64,UmVzdW1lIGNvbnRlbnQgZm9yIEFsaWNlIEpvaG5zb24uIFNraWxsZWQgaW4gUmVhY3QsIE5vZGUuanMsIGFuZCBUeXBlU2NyaXB0LiA1IHllYXJzIG9mIGV4cGVyaWVuY2Uu"},
  { id: "app2", name: "Bob Williams", avatar: "https://placehold.co/100x100.png?text=BW", applicationDate: "2024-07-24", aiMatchScore: 85, status: "Screening", email: "bob@example.com", skills: ["Python", "Django", "SQL"], resumeText: "Data-driven Python developer, proficient in Django and SQL databases.", jobTitleAppliedFor: "Software Engineer, Frontend", mockResumeDataUri: "data:text/plain;base64,Qm9iIFdpbGxpYW1zJyBSZXN1bWUuIEV4cGVydCBQeXRob24gZGV2ZWxvcGVyLCBwcm9maWNpZW50IGluIERqYW5nbyBhbmQgU1FMLg==" },
  { id: "app3", name: "Carol Davis", avatar: "https://placehold.co/100x100.png?text=CD", applicationDate: "2024-07-23", aiMatchScore: 78, status: "Shortlisted", email: "carol@example.com", skills: ["Java", "Spring Boot", "Microservices"], resumeText: "Experienced Java engineer specializing in Spring Boot and microservice architectures.", jobTitleAppliedFor: "Software Engineer, Frontend", mockResumeDataUri: "data:text/plain;base64,Q2Fyb2wgRGF2aXMnIFJlc3VtZS4gRXhwZXJ0IGphdmEgZW5naW5lZXIgV2l0aCBKYXZhLCBTcHJpbmcgQm9vdCwgYW5kIE1pY3Jvc2VydmljZXMu" },
  { id: "app4", name: "David Miller", avatar: "https://placehold.co/100x100.png?text=DM", applicationDate: "2024-07-22", status: "Not Selected", email: "david@example.com", skills: ["PHP", "Laravel"], resumeText: "Full-stack PHP developer with Laravel expertise.", jobTitleAppliedFor: "Software Engineer, Frontend" },
  { id: "app5", name: "Eve Brown", avatar: "https://placehold.co/100x100.png?text=EB", applicationDate: "2024-07-26", aiMatchScore: 95, status: "Interview", email: "eve@example.com", skills: ["JavaScript", "Vue.js", "Firebase"], resumeText: "Creative Vue.js developer with Firebase backend knowledge.", jobTitleAppliedFor: "Software Engineer, Frontend", mockResumeDataUri: "data:text/plain;base64,RXZlIEJyb3duJ3MgUmVzdW1lLiBWdWUuanMgYW5kIEZpcmViYXNlIGV4cGVydC4=" },
];

const mockJobTitles: { [key: string]: { title: string, description: string } } = {
  "hmjob1": { title: "Lead Software Architect", description: "Lead the architectural design and implementation of complex software systems."},
  "hmjob2": { title: "Senior Product Designer", description: "Craft exceptional user experiences for our flagship products."},
  "job1": { title: "Software Engineer, Frontend", description: "Develop user-facing features for our web applications using React and Next.js."},
};

const ALL_APPLICANT_STATUSES_HM: Applicant["status"][] = ["New", "Screening", "Shortlisted", "Interview", "Offer", "Hired", "Not Selected", "Withdrawn"];

export default function HMViewApplicantsPage() {
  const params = useParams();
  const jobId = params.jobId as string;
  const { toast } = useToast();
  const router = useRouter();

  const [applicants, setApplicants] = useState<Applicant[]>(initialMockApplicants);
  const [selectedApplicantForStatus, setSelectedApplicantForStatus] = useState<Applicant | null>(null);
  const [newStatus, setNewStatus] = useState<Applicant["status"] | "">("");

  const [isScreeningLoading, setIsScreeningLoading] = useState(false);
  const [selectedApplicantForScreening, setSelectedApplicantForScreening] = useState<Applicant | null>(null);
  const [screeningReports, setScreeningReports] = useState<Record<string, CandidateScreeningOutput | null>>({});
  const [selectedApplicantForReportView, setSelectedApplicantForReportView] = useState<Applicant | null>(null);
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);

  const [isRejectConfirmOpen, setIsRejectConfirmOpen] = useState(false);
  const [applicantToUpdate, setApplicantToUpdate] = useState<Applicant | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<Applicant["status"] | "all">("all");

  const [isScheduleInterviewDialogOpen, setIsScheduleInterviewDialogOpen] = useState(false);
  const [selectedApplicantForInterview, setSelectedApplicantForInterview] = useState<Applicant | null>(null);

  const [isViewProfileDialogOpen, setIsViewProfileDialogOpen] = useState(false);
  const [selectedApplicantForProfileView, setSelectedApplicantForProfileView] = useState<Applicant | null>(null);

  const [isFeedbackDialogOpen, setIsFeedbackDialogOpen] = useState(false);
  const [selectedApplicantForFeedback, setSelectedApplicantForFeedback] = useState<Applicant | null>(null);
  const [feedbackText, setFeedbackText] = useState("");

  const jobData = mockJobTitles[jobId] || { title: `Job ID: ${jobId}`, description: "Details for this job are not available."};

  const handleUpdateStatus = () => {
    if (applicantToUpdate && newStatus) {
      setApplicants(prev => prev.map(app => app.id === applicantToUpdate.id ? {...app, status: newStatus as Applicant["status"]} : app));
      toast({
        title: "Status Updated",
        description: `${applicantToUpdate.name}'s status changed to ${newStatus}.`,
      });
      setApplicantToUpdate(null);
      setSelectedApplicantForStatus(null);
      setIsRejectConfirmOpen(false);
      setNewStatus("");
    }
  };

  const openStatusUpdateDialog = (applicant: Applicant, targetStatus?: Applicant["status"]) => {
    setApplicantToUpdate(applicant);
    if (targetStatus === "Not Selected") {
        setNewStatus("Not Selected");
        setIsRejectConfirmOpen(true);
    } else {
        setSelectedApplicantForStatus(applicant);
        setNewStatus(targetStatus || applicant.status);
    }
  };

  const confirmStatusUpdateToAction = (status: Applicant["status"]) => {
     if (!applicantToUpdate) return;
     setNewStatus(status);
     setApplicants(prev => prev.map(app => app.id === applicantToUpdate!.id ? {...app, status: status} : app));
     toast({
        title: `Candidate Status Updated`,
        description: `${applicantToUpdate.name} has been marked as ${status}.`,
        variant: status === "Not Selected" ? "destructive" : "default"
      });
      setIsRejectConfirmOpen(false);
      setApplicantToUpdate(null);
  };

  const handleAIScreen = async (applicant: Applicant) => {
    if (!applicant.resumeText || !jobData.description) {
        toast({ variant: "destructive", title: "Missing Data", description: "Cannot perform AI screening without resume text and job description." });
        return;
    }
    setSelectedApplicantForScreening(applicant);
    setIsScreeningLoading(true);
    setScreeningReports(prev => ({ ...prev, [applicant.id]: null }));
    try {
        const screeningInput: CandidateScreeningInput = {
            jobDetails: jobData.description,
            resume: applicant.resumeText,
            candidateProfile: `Name: ${applicant.name}, Email: ${applicant.email}, Skills: ${applicant.skills.join(', ')}`,
        };
        const result = await aiCandidateScreening(screeningInput);
        setScreeningReports(prev => ({ ...prev, [applicant.id]: result }));
        toast({
            title: `AI Screening for ${applicant.name} Complete!`,
            description: `Suitability Score: ${result.suitabilityScore}/100. View full report for details.`,
            duration: 7000,
        });
    } catch (error) {
        console.error("AI Screening Error:", error);
        toast({ variant: "destructive", title: "AI Screening Failed", description: "Could not screen candidate." });
    } finally {
        setIsScreeningLoading(false);
        setSelectedApplicantForScreening(null);
    }
  };

  const openReportDialog = (applicant: Applicant) => {
    setSelectedApplicantForReportView(applicant);
    setIsReportDialogOpen(true);
  }

  const openScheduleInterviewDialog = (applicant: Applicant) => {
    setSelectedApplicantForInterview(applicant);
    setIsScheduleInterviewDialogOpen(true);
  };

  const openViewProfileDialog = (applicant: Applicant) => {
    setSelectedApplicantForProfileView(applicant);
    setIsViewProfileDialogOpen(true);
  };

  const openFeedbackDialog = (applicant: Applicant) => {
    setSelectedApplicantForFeedback(applicant);
    setFeedbackText(""); 
    setIsFeedbackDialogOpen(true);
  };

  const handleFeedbackSubmit = () => {
    if (!selectedApplicantForFeedback || !feedbackText.trim()) {
      toast({ variant: "destructive", title: "Feedback Required", description: "Please enter your feedback." });
      return;
    }
    console.log(`Feedback for ${selectedApplicantForFeedback.name}: ${feedbackText}`);
    toast({ title: "Feedback Submitted (Placeholder)", description: `Your feedback for ${selectedApplicantForFeedback.name} has been recorded.` });
    setIsFeedbackDialogOpen(false);
  };

  const getStatusPill = (status: Applicant["status"]) => {
    switch (status) {
      case "New": return <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-300">{status}</Badge>;
      case "Screening": return <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 border-yellow-300">{status}</Badge>;
      case "Shortlisted": return <Badge variant="secondary" className="bg-cyan-100 text-cyan-700 border-cyan-300">{status}</Badge>;
      case "Interview": return <Badge variant="secondary" className="bg-purple-100 text-purple-700 border-purple-300">{status}</Badge>;
      case "Offer": return <Badge variant="default" className="bg-green-500 text-white border-green-700">Offer</Badge>;
      case "Hired": return <Badge variant="default" className="bg-green-700 text-white border-green-900">Hired</Badge>;
      case "Not Selected": return <Badge variant="destructive" className="bg-red-100 text-red-700 border-red-300">{status}</Badge>;
      case "Withdrawn": return <Badge variant="outline">{status}</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  const filteredApplicants = useMemo(() => {
    return applicants.filter(applicant => {
      const searchLower = searchTerm.toLowerCase();
      const nameMatch = applicant.name.toLowerCase().includes(searchLower);
      const skillsMatch = applicant.skills.some(skill => skill.toLowerCase().includes(searchLower));
      const statusMatch = statusFilter === "all" || applicant.status === statusFilter;
      return (nameMatch || skillsMatch) && statusMatch;
    });
  }, [applicants, searchTerm, statusFilter]);

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div className="flex items-center justify-start">
          <Button variant="outline" size="sm" onClick={() => router.push('/dashboard/hiring-manager/job-listings')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to My Job Postings
          </Button>
        </div>

        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center"><Users className="mr-2 h-6 w-6 text-primary" /> Applicants for: {jobData.title}</CardTitle>
            <CardDescription>Review and manage candidates. (Hiring Manager View)</CardDescription>
          </CardHeader>
        </Card>

        <Card className="shadow-lg">
          <CardHeader className="border-b">
            <div className="flex flex-col md:flex-row gap-2 justify-between items-center">
              <div className="relative flex-grow w-full md:w-auto">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search applicants by name or skills..."
                  className="pl-8 w-full"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex gap-2 w-full md:w-auto">
                <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as Applicant["status"] | "all")}>
                  <SelectTrigger className="w-full md:w-[180px]">
                    <SelectValue placeholder="Filter by Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    {ALL_APPLICANT_STATUSES_HM.map(s => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Candidate</TableHead>
                  <TableHead>Applied On</TableHead>
                  <TableHead>AI Match</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredApplicants.map((applicant) => (
                  <TableRow key={applicant.id}>
                    <TableCell>
                      <div className="flex items-center gap-3 group">
                        <Avatar className="h-9 w-9 group-hover:ring-2 group-hover:ring-primary/50 transition-all">
                          <AvatarImage src={applicant.avatar} alt={applicant.name} data-ai-hint="person professional" />
                          <AvatarFallback>{applicant.name.split(" ").map(n => n[0]).join("").toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium text-primary group-hover:text-primary/80 transition-colors">{applicant.name}</div>
                          <div className="text-xs text-muted-foreground">{applicant.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{applicant.applicationDate}</TableCell>
                    <TableCell className="space-y-1">
                      {applicant.aiMatchScore && (
                        <Badge variant={applicant.aiMatchScore > 80 ? "default" : "secondary"} className={cn(applicant.aiMatchScore > 80 ? "bg-green-100 text-green-700 border-green-300" : applicant.aiMatchScore > 60 ? "bg-yellow-100 text-yellow-700 border-yellow-300" : "bg-red-100 text-red-700 border-red-300", "block w-fit")}>
                          {applicant.aiMatchScore}%
                        </Badge>
                      )}
                      {screeningReports[applicant.id] && (
                          <Button variant="link" size="xs" className="p-0 h-auto text-xs" onClick={() => openReportDialog(applicant)}>View Report</Button>
                      )}
                      {(!applicant.aiMatchScore && !screeningReports[applicant.id]) && <span className="text-xs text-muted-foreground">N/A</span>}
                    </TableCell>
                    <TableCell>{getStatusPill(applicant.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 p-0" onClick={() => openViewProfileDialog(applicant)}>
                              <Eye className="h-4 w-4" />
                              <span className="sr-only">View Simplified Profile</span>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent><p>View Simplified Profile</p></TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 p-0" onClick={() => openFeedbackDialog(applicant)}>
                              <Edit3 className="h-4 w-4" />
                              <span className="sr-only">Provide Feedback</span>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent><p>Provide Feedback</p></TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 p-0" onClick={() => openScheduleInterviewDialog(applicant)}>
                              <CalendarPlus className="h-4 w-4" />
                              <span className="sr-only">Request/Schedule Interview</span>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent><p>Request/Schedule Interview</p></TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 p-0 text-destructive hover:text-destructive/80" onClick={() => openStatusUpdateDialog(applicant, "Not Selected")}>
                              <UserX className="h-4 w-4" />
                              <span className="sr-only">Recommend: Not Selected</span>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent><p>Recommend: Not Selected</p></TooltipContent>
                        </Tooltip>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredApplicants.length === 0 && (
                  <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                          No applicants found matching your criteria.
                      </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Dialog open={!!selectedApplicantForStatus && !isRejectConfirmOpen} onOpenChange={(open) => !open && setSelectedApplicantForStatus(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Update Status for {selectedApplicantForStatus?.name}</DialogTitle>
              <DialogDescription>Select the new status for this applicant.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="newStatus-hm">New Status</Label>
                <Select value={newStatus} onValueChange={(value) => setNewStatus(value as Applicant["status"])}>
                  <SelectTrigger id="newStatus-hm">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {ALL_APPLICANT_STATUSES_HM.map(s => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedApplicantForStatus(null)}>Cancel</Button>
              <Button onClick={() => {if (applicantToUpdate) handleUpdateStatus()}}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isRejectConfirmOpen} onOpenChange={setIsRejectConfirmOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Confirm Status: Not Selected</DialogTitle>
                    <DialogDescription>
                        Are you sure you want to recommend {applicantToUpdate?.name} as "Not Selected"?
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant="outline" onClick={() => { setIsRejectConfirmOpen(false); setApplicantToUpdate(null); }}>Cancel</Button>
                    <Button variant="destructive" onClick={() => confirmStatusUpdateToAction("Not Selected")}>Confirm: Not Selected</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

        <Dialog open={isReportDialogOpen} onOpenChange={setIsReportDialogOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>AI Screening Report for {selectedApplicantForReportView?.name}</DialogTitle>
              <DialogDescription>Job: {jobData.title}</DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-3 max-h-[60vh] overflow-y-auto pr-2">
              {screeningReports[selectedApplicantForReportView?.id || ""] ? (
                <>
                  <Alert variant="default" className={cn("shadow-sm", (screeningReports[selectedApplicantForReportView!.id]!.suitabilityScore > 70 ? "bg-green-50 border-green-200 text-green-700" : screeningReports[selectedApplicantForReportView!.id]!.suitabilityScore > 50 ? "bg-yellow-50 border-yellow-200 text-yellow-700" : "bg-red-50 border-red-200 text-red-700"))}>
                      <ShieldCheck className={`h-4 w-4 ${screeningReports[selectedApplicantForReportView!.id]!.suitabilityScore > 70 ? "!text-green-600" : "!text-red-600"}`} />
                      <AlertTitle className="font-semibold">Suitability Score: {screeningReports[selectedApplicantForReportView!.id]!.suitabilityScore}/100</AlertTitle>
                  </Alert>
                  <Card className="shadow-sm">
                      <CardHeader className="p-3"><CardTitle className="text-sm">Summary</CardTitle></CardHeader>
                      <CardContent className="p-3 text-xs">{screeningReports[selectedApplicantForReportView!.id]!.summary}</CardContent>
                  </Card>
                  <Card className="shadow-sm">
                      <CardHeader className="p-3"><CardTitle className="text-sm">Strengths</CardTitle></CardHeader>
                      <CardContent className="p-3 text-xs whitespace-pre-line">{screeningReports[selectedApplicantForReportView!.id]!.strengths}</CardContent>
                  </Card>
                  <Card className="shadow-sm">
                      <CardHeader className="p-3"><CardTitle className="text-sm">Areas for Improvement</CardTitle></CardHeader>
                      <CardContent className="p-3 text-xs whitespace-pre-line">{screeningReports[selectedApplicantForReportView!.id]!.areasForImprovement}</CardContent>
                  </Card>
                  <Card className="shadow-sm">
                      <CardHeader className="p-3"><CardTitle className="text-sm">Recommendation</CardTitle></CardHeader>
                      <CardContent className="p-3 text-xs whitespace-pre-line">{screeningReports[selectedApplicantForReportView!.id]!.recommendation}</CardContent>
                  </Card>
                </>
              ) : <p className="text-muted-foreground">No screening report available for this candidate.</p>}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsReportDialogOpen(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      {selectedApplicantForInterview && (
          <ScheduleInterviewModal
            isOpen={isScheduleInterviewDialogOpen}
            onClose={() => {
              setIsScheduleInterviewDialogOpen(false);
              setSelectedApplicantForInterview(null);
            }}
            candidateId={selectedApplicantForInterview.id}
            candidateName={selectedApplicantForInterview.name}
            candidateEmail={selectedApplicantForInterview.email}
            jobTitle={jobData.title}
          />
        )}

      <Dialog open={isViewProfileDialogOpen} onOpenChange={setIsViewProfileDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedApplicantForProfileView?.name}'s Profile Overview</DialogTitle>
            <DialogDescription>A quick summary of the candidate's details.</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-3">
            {selectedApplicantForProfileView ? (
              <>
                <div><span className="font-semibold">Email:</span> {selectedApplicantForProfileView.email}</div>
                <div><span className="font-semibold">Status:</span> {getStatusPill(selectedApplicantForProfileView.status)}</div>
                <div><span className="font-semibold">AI Match:</span> {selectedApplicantForProfileView.aiMatchScore ? `${selectedApplicantForProfileView.aiMatchScore}%` : "N/A"}</div>
                <div>
                  <p className="font-semibold mb-1">Skills:</p>
                  <div className="flex flex-wrap gap-1">
                    {selectedApplicantForProfileView.skills.map(skill => <Badge key={skill} variant="secondary">{skill}</Badge>)}
                    {selectedApplicantForProfileView.skills.length === 0 && <span className="text-xs text-muted-foreground">No skills listed.</span>}
                  </div>
                </div>
              </>
            ) : (
              <p>Loading candidate details...</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewProfileDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isFeedbackDialogOpen} onOpenChange={setIsFeedbackDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Provide Feedback for {selectedApplicantForFeedback?.name}</DialogTitle>
            <DialogDescription>Enter your evaluation and comments for this candidate.</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-3">
            <Label htmlFor="feedback-text-hm">Your Feedback</Label>
            <Textarea
              id="feedback-text-hm"
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              placeholder="Strengths, weaknesses, overall impression, recommendation (e.g., Proceed, Hold, Do Not Recommend)..."
              rows={5}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFeedbackDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleFeedbackSubmit}>Submit Feedback</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      </div>
    </TooltipProvider>
  );
}

    
