
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, MoreHorizontal, Search, Eye, ShieldCheck, Edit3, CalendarPlus, UserX, Users, Loader2 } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"; // Removed DialogTrigger, DialogClose as they are part of DialogContent/DialogFooter
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"; // Added Table imports
// AI Screening Flow
import { aiCandidateScreening, type CandidateScreeningInput } from "@/ai/flows/ai-candidate-screening";

interface Applicant {
  id: string;
  name: string;
  avatar: string;
  applicationDate: string;
  aiMatchScore?: number;
  status: "New" | "Screening" | "Interview" | "Offer" | "Hired" | "Rejected" | "Withdrawn";
  email: string;
  skills: string[];
  resumeText?: string; 
  jobTitleAppliedFor?: string; 
  mockResumeDataUri?: string;
}

const initialMockApplicants: Applicant[] = [
  { id: "app1", name: "Alice Johnson", avatar: "https://placehold.co/100x100.png?text=AJ", applicationDate: "2024-07-25", aiMatchScore: 92, status: "New", email: "alice@example.com", skills: ["React", "Node.js", "TypeScript"], resumeText: "Highly skilled React developer with 5 years of experience in Node.js and TypeScript.", jobTitleAppliedFor: "Software Engineer, Frontend", mockResumeDataUri: "data:text/plain;base64,UmVzdW1lIGNvbnRlbnQgZm9yIEFsaWNlIEpvaG5zb24uIFNraWxsZWQgaW4gUmVhY3QsIE5vZGUuanMsIGFuZCBUeXBlU2NyaXB0LiA1IHllYXJzIG9mIGV4cGVyaWVuY2Uu"},
  { id: "app2", name: "Bob Williams", avatar: "https://placehold.co/100x100.png?text=BW", applicationDate: "2024-07-24", aiMatchScore: 85, status: "Screening", email: "bob@example.com", skills: ["Python", "Django", "SQL"], resumeText: "Data-driven Python developer, proficient in Django and SQL databases.", jobTitleAppliedFor: "Software Engineer, Frontend", mockResumeDataUri: "data:text/plain;base64,Qm9iIFdpbGxpYW1zJyBSZXN1bWUuIEV4cGVydCBQeXRob24gZGV2ZWxvcGVyLCBwcm9maWNpZW50IGluIERqYW5nbyBhbmQgU1FMLg==" },
  { id: "app3", name: "Carol Davis", avatar: "https://placehold.co/100x100.png?text=CD", applicationDate: "2024-07-23", aiMatchScore: 78, status: "Interview", email: "carol@example.com", skills: ["Java", "Spring Boot", "Microservices"], resumeText: "Experienced Java engineer specializing in Spring Boot and microservice architectures.", jobTitleAppliedFor: "Software Engineer, Frontend", mockResumeDataUri: "data:text/plain;base64,Q2Fyb2wgRGF2aXMnIFJlc3VtZS4gRXhwZXJ0IGphdmEgZW5naW5lZXIgV2l0aCBKYXZhLCBTcHJpbmcgQm9vdCwgYW5kIE1pY3Jvc2VydmljZXMu" },
  { id: "app4", name: "David Miller", avatar: "https://placehold.co/100x100.png?text=DM", applicationDate: "2024-07-22", status: "Rejected", email: "david@example.com", skills: ["PHP", "Laravel"], resumeText: "Full-stack PHP developer with Laravel expertise.", jobTitleAppliedFor: "Software Engineer, Frontend" },
  { id: "app5", name: "Eve Brown", avatar: "https://placehold.co/100x100.png?text=EB", applicationDate: "2024-07-26", aiMatchScore: 95, status: "New", email: "eve@example.com", skills: ["JavaScript", "Vue.js", "Firebase"], resumeText: "Creative Vue.js developer with Firebase backend knowledge.", jobTitleAppliedFor: "Software Engineer, Frontend", mockResumeDataUri: "data:text/plain;base64,RXZlIEJyb3duJ3MgUmVzdW1lLiBWdWUuanMgYW5kIEZpcmViYXNlIGV4cGVydC4=" },
];

const mockJobTitles: { [key: string]: { title: string, description: string } } = {
  "job1": { title: "Software Engineer, Frontend", description: "Develop user-facing features for our web applications using React and Next.js."},
  "job2": { title: "Product Manager", description: "Lead product strategy and development for innovative new features."},
  "job3": { title: "UX Designer", description: "Create intuitive and engaging user experiences for our platform."},
  "job4": { title: "Data Scientist", description: "Analyze large datasets to extract valuable insights and build predictive models."},
  "job5": { title: "DevOps Engineer", description: "Manage and improve our CI/CD pipelines and cloud infrastructure."},
};

export default function ViewApplicantsPage() {
  const params = useParams();
  const jobId = params.jobId as string;
  const { toast } = useToast();
  const router = useRouter();

  const [applicants, setApplicants] = useState<Applicant[]>(initialMockApplicants);
  const [selectedApplicantForStatus, setSelectedApplicantForStatus] = useState<Applicant | null>(null);
  const [newStatus, setNewStatus] = useState<Applicant["status"] | "">("");
  const [isScreeningLoading, setIsScreeningLoading] = useState(false);
  const [selectedApplicantForScreening, setSelectedApplicantForScreening] = useState<Applicant | null>(null);
  const [isRejectConfirmOpen, setIsRejectConfirmOpen] = useState(false);
  const [applicantToReject, setApplicantToReject] = useState<Applicant | null>(null);

  const jobData = mockJobTitles[jobId] || { title: `Job ID: ${jobId}`, description: "Details for this job are not available."};

  const handleUpdateStatus = () => {
    if (selectedApplicantForStatus && newStatus) {
      setApplicants(prev => prev.map(app => app.id === selectedApplicantForStatus.id ? {...app, status: newStatus as Applicant["status"]} : app));
      toast({
        title: "Status Updated",
        description: `${selectedApplicantForStatus.name}'s status changed to ${newStatus}.`,
      });
      setSelectedApplicantForStatus(null);
      setNewStatus("");
    }
  };
  
  const openRejectDialog = (applicant: Applicant) => {
    setApplicantToReject(applicant);
    setIsRejectConfirmOpen(true);
  };

  const confirmRejectCandidate = () => {
     if (!applicantToReject) return;
     setApplicants(prev => prev.map(app => app.id === applicantToReject.id ? {...app, status: "Rejected"} : app));
     toast({
        title: "Candidate Rejected",
        description: `${applicantToReject.name} has been marked as rejected.`,
        variant: "destructive"
      });
      setIsRejectConfirmOpen(false);
      setApplicantToReject(null);
  };

  const handleAIScreen = async (applicant: Applicant) => {
    if (!applicant.resumeText || !jobData.description) {
        toast({ variant: "destructive", title: "Missing Data", description: "Cannot perform AI screening without resume text and job description." });
        return;
    }
    setSelectedApplicantForScreening(applicant);
    setIsScreeningLoading(true);
    try {
        const screeningInput: CandidateScreeningInput = {
            jobDetails: jobData.description,
            resume: applicant.resumeText,
            candidateProfile: `Name: ${applicant.name}, Email: ${applicant.email}, Skills: ${applicant.skills.join(', ')}`,
        };
        const result = await aiCandidateScreening(screeningInput);
        toast({
            title: `AI Screening for ${applicant.name}`,
            description: (
                <div className="text-xs">
                    <p className="font-semibold">Score: {result.suitabilityScore}/100</p>
                    <p>Summary: {result.summary.substring(0,100)}...</p>
                    <p>Recommendation: {result.recommendation}</p>
                </div>
            ),
            duration: 10000,
        });
    } catch (error) {
        console.error("AI Screening Error:", error);
        toast({ variant: "destructive", title: "AI Screening Failed", description: "Could not screen candidate." });
    } finally {
        setIsScreeningLoading(false);
        setSelectedApplicantForScreening(null);
    }
  };

  const getStatusPill = (status: Applicant["status"]) => {
    switch (status) {
      case "New": return <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-300">{status}</Badge>;
      case "Screening": return <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 border-yellow-300">{status}</Badge>;
      case "Interview": return <Badge variant="secondary" className="bg-purple-100 text-purple-700 border-purple-300">{status}</Badge>;
      case "Offer": return <Badge variant="default" className="bg-green-500 text-white border-green-700">Offer</Badge>;
      case "Hired": return <Badge variant="default" className="bg-green-700 text-white border-green-900">Hired</Badge>;
      case "Rejected": return <Badge variant="destructive" className="bg-red-100 text-red-700 border-red-300">{status}</Badge>;
      case "Withdrawn": return <Badge variant="outline">{status}</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-start">
        <Button variant="outline" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Job Listings
        </Button>
      </div>

      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center"><Users className="mr-2 h-6 w-6 text-primary" /> Applicants for: {jobData.title}</CardTitle>
          <CardDescription>Review and manage candidates who applied for this position.</CardDescription>
        </CardHeader>
      </Card>

      <Card className="shadow-lg">
        <CardHeader className="border-b">
          <div className="flex flex-col md:flex-row gap-2 justify-between items-center">
            <div className="relative flex-grow w-full md:w-auto">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search applicants by name or skills..." className="pl-8 w-full" />
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <Select>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Filter by Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {["New", "Screening", "Interview", "Offer", "Hired", "Rejected", "Withdrawn"].map(s => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline">Apply Filters</Button>
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
              {applicants.map((applicant) => (
                <TableRow key={applicant.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={applicant.avatar} alt={applicant.name} data-ai-hint="person professional" />
                        <AvatarFallback>{applicant.name.split(" ").map(n => n[0]).join("").toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{applicant.name}</div>
                        <div className="text-xs text-muted-foreground">{applicant.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{applicant.applicationDate}</TableCell>
                  <TableCell>
                    {applicant.aiMatchScore ? (
                      <Badge variant={applicant.aiMatchScore > 80 ? "default" : "secondary"} className={applicant.aiMatchScore > 80 ? "bg-green-100 text-green-700 border-green-300" : ""}>
                        {applicant.aiMatchScore}%
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">N/A</span>
                    )}
                  </TableCell>
                  <TableCell>{getStatusPill(applicant.status)}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard/recruiter/candidate-profile/${applicant.id}`}>
                            <Eye className="mr-2 h-4 w-4" />View Profile
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleAIScreen(applicant)} disabled={isScreeningLoading && selectedApplicantForScreening?.id === applicant.id}>
                          {isScreeningLoading && selectedApplicantForScreening?.id === applicant.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <ShieldCheck className="mr-2 h-4 w-4" />}
                          AI Screen
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => { setSelectedApplicantForStatus(applicant); setNewStatus(applicant.status); }}>
                          <Edit3 className="mr-2 h-4 w-4" />Update Status
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => toast({title: "Schedule Interview (Placeholder)", description: `Scheduling interview for ${applicant.name}.`})}>
                          <CalendarPlus className="mr-2 h-4 w-4" />Schedule Interview
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10" onClick={() => openRejectDialog(applicant)}>
                          <UserX className="mr-2 h-4 w-4" />Reject Candidate
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {applicants.length === 0 && (
                 <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                        No applicants found for this job.
                    </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog for Update Status */}
      <Dialog open={!!selectedApplicantForStatus} onOpenChange={(open) => !open && setSelectedApplicantForStatus(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Status for {selectedApplicantForStatus?.name}</DialogTitle>
            <DialogDescription>Select the new status for this applicant.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="newStatus">New Status</Label>
              <Select value={newStatus} onValueChange={(value) => setNewStatus(value as Applicant["status"])}>
                <SelectTrigger id="newStatus">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {["New", "Screening", "Interview", "Offer", "Hired", "Rejected", "Withdrawn"].map(s => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedApplicantForStatus(null)}>Cancel</Button>
            <Button onClick={handleUpdateStatus}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog for Reject Confirmation */}
        <Dialog open={isRejectConfirmOpen} onOpenChange={setIsRejectConfirmOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Confirm Rejection</DialogTitle>
                    <DialogDescription>
                        Are you sure you want to reject {applicantToReject?.name}? This action cannot be undone.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant="outline" onClick={() => { setIsRejectConfirmOpen(false); setApplicantToReject(null); }}>Cancel</Button>
                    <Button variant="destructive" onClick={confirmRejectCandidate}>Confirm Rejection</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </div>
  );
}

    