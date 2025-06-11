
"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Check, Clock, Eye, ThumbsDown, ThumbsUp, X, Search as SearchIcon, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface JobForRecruiterApproval {
  id: string;
  title: string;
  department: string;
  hiringManager: string; // Name of the HM who submitted
  dateSubmitted: string;
  status: "Pending Recruiter Approval" | "Approved by Recruiter" | "Rejected by Recruiter";
  jobDescription?: string;
  salaryRange?: string;
}

const mockJobsForRecruiterApproval: JobForRecruiterApproval[] = [
  { id: "jobAppr1", title: "Senior Backend Engineer", department: "Engineering", hiringManager: "Charles Brown (HM)", dateSubmitted: "2024-07-22", status: "Pending Recruiter Approval", jobDescription: "Lead the development of our core backend services. Design and implement robust APIs, manage database performance, and ensure system scalability. Collaborate with frontend teams and product managers to deliver high-quality software solutions. Mentor junior engineers and contribute to code reviews and architectural decisions.", salaryRange: "$120k - $150k" },
  { id: "jobAppr2", title: "Lead UX Researcher", department: "Design", hiringManager: "Diana Green (HM)", dateSubmitted: "2024-07-20", status: "Pending Recruiter Approval", jobDescription: "Drive user research initiatives to inform product strategy. Plan and conduct user studies, analyze findings, and present actionable insights. Work closely with designers, product managers, and engineers to champion user-centered design principles throughout the product lifecycle.", salaryRange: "$110k - $140k" },
  { id: "jobAppr3", title: "Junior Marketing Analyst", department: "Marketing", hiringManager: "Charles Brown (HM)", dateSubmitted: "2024-07-18", status: "Approved by Recruiter", jobDescription: "Analyze marketing campaign performance and identify trends. Prepare reports on key metrics, support market research activities, and assist in the development of marketing strategies. Familiarity with analytics tools and Excel is required.", salaryRange: "$60k - $75k" },
  { id: "jobAppr4", title: "DevOps Specialist", department: "IT/Ops", hiringManager: "Diana Green (HM)", dateSubmitted: "2024-07-15", status: "Rejected by Recruiter", jobDescription: "Maintain and improve our CI/CD pipelines and cloud infrastructure. Automate deployment processes, monitor system health, and ensure security best practices are followed. Experience with AWS, Docker, and Kubernetes is essential.", salaryRange: "$100k - $130k" },
];

export default function RecruiterJobApprovalsPage() {
  const { toast } = useToast();
  const [jobs, setJobs] = useState<JobForRecruiterApproval[]>(mockJobsForRecruiterApproval);
  const [selectedJob, setSelectedJob] = useState<JobForRecruiterApproval | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [recruiterOptimizedDescription, setRecruiterOptimizedDescription] = useState("");
  const [searchTerm, setSearchTerm] = useState(""); 

  const handleAction = (jobId: string, action: 'approve' | 'reject', reason?: string) => {
    setJobs(prevJobs => prevJobs.map(job =>
        job.id === jobId ? { ...job, status: action === 'approve' ? 'Approved by Recruiter' : 'Rejected by Recruiter' } : job
    ));
    toast({
      title: `Job ${action === 'approve' ? 'Approved & Posted' : 'Rejected'} by Recruiter`,
      description: `The job posting "${jobs.find(j=>j.id===jobId)?.title}" has been ${action === 'approve' ? 'approved and posted' : 'rejected'}.${reason ? ` Reason: ${reason}` : ''}`,
      variant: action === 'approve' ? 'default' : 'destructive',
    });
    setSelectedJob(null);
    setRejectionReason("");
    setRecruiterOptimizedDescription("");
  };

  const getStatusPill = (status: JobForRecruiterApproval["status"]) => {
    switch(status) {
        case "Pending Recruiter Approval": return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300 hover:bg-yellow-100 py-1"><Clock className="mr-1 h-3 w-3"/>{status}</Badge>;
        case "Approved by Recruiter": return <Badge className="bg-green-100 text-green-800 border-green-300 hover:bg-green-100 py-1"><Check className="mr-1 h-3 w-3"/>Approved & Posted</Badge>;
        case "Rejected by Recruiter": return <Badge className="bg-red-100 text-red-800 border-red-300 hover:bg-red-100 py-1"><X className="mr-1 h-3 w-3"/>Rejected</Badge>;
        default: return <Badge className="py-1">{status}</Badge>;
    }
  };

  const openDetailsDialog = (job: JobForRecruiterApproval) => {
    setSelectedJob(job);
    setRecruiterOptimizedDescription(job.jobDescription || ""); 
    if (job.status === "Pending Recruiter Approval") {
        setRejectionReason("");
    }
  };

  const filteredJobs = useMemo(() => {
    if (!searchTerm) {
      return jobs;
    }
    const lowercasedSearchTerm = searchTerm.toLowerCase();
    return jobs.filter(job => 
      job.title.toLowerCase().includes(lowercasedSearchTerm) ||
      job.department.toLowerCase().includes(lowercasedSearchTerm) ||
      job.hiringManager.toLowerCase().includes(lowercasedSearchTerm)
    );
  }, [jobs, searchTerm]);

  return (
    <Dialog onOpenChange={(open) => { if (!open) setSelectedJob(null); }}>
      <div className="space-y-6">
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center"><Users className="mr-2 h-6 w-6 text-primary" /> Job Posting Approvals</CardTitle>
            <CardDescription>As a Recruiter, review job postings submitted by Hiring Managers, optimize, and approve/reject them to go live.</CardDescription>
          </CardHeader>
        </Card>

        <Card className="shadow-lg">
          <CardHeader className="border-b py-4">
             <div className="relative max-w-xs">
                <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search by title, department, HM..." 
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
             </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Job Title</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Submitted By (HM)</TableHead>
                  <TableHead>Date Submitted</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredJobs.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell className="font-medium">{job.title}</TableCell>
                    <TableCell>{job.department}</TableCell>
                    <TableCell>{job.hiringManager}</TableCell>
                    <TableCell>{job.dateSubmitted}</TableCell>
                    <TableCell>{getStatusPill(job.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm" onClick={() => openDetailsDialog(job)}><Eye className="mr-1 h-4 w-4"/> View & Optimize</Button>
                        </DialogTrigger>
                        {job.status === "Pending Recruiter Approval" && (
                          <>
                            <DialogTrigger asChild>
                               <Button variant="outline" size="sm" className="text-red-600 border-red-400 hover:bg-red-50 hover:text-red-700 focus-visible:ring-red-400" onClick={() => openDetailsDialog(job)}>
                                  <ThumbsDown className="mr-1 h-3.5 w-3.5" /> Reject
                              </Button>
                            </DialogTrigger>
                            <Button variant="default" size="sm" className="bg-green-600 hover:bg-green-700 text-white focus-visible:ring-green-500" onClick={() => {
                                console.log("Final Optimized Description to be posted:", recruiterOptimizedDescription || job.jobDescription); 
                                handleAction(job.id, 'approve');
                            }}>
                              <ThumbsUp className="mr-1 h-3.5 w-3.5" /> Approve & Post
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredJobs.length === 0 && (
                   <TableRow><TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                     {searchTerm ? "No job postings found matching your search." : "No job postings awaiting your approval."}
                   </TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {selectedJob && (
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Review & Optimize: {selectedJob.title}</DialogTitle>
            <DialogDescription>Department: {selectedJob.department} | Submitted by: {selectedJob.hiringManager}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4 max-h-[70vh] overflow-y-auto pr-3">
            <div className="space-y-2">
                <Label htmlFor="hmJobDescription" className="font-semibold text-md">Hiring Manager's Submitted Job Description:</Label>
                <div id="hmJobDescription" className="text-sm text-foreground/80 whitespace-pre-line p-3 border rounded-md bg-muted min-h-[100px]">
                    {selectedJob.jobDescription || "No description provided by Hiring Manager."}
                </div>
            </div>
            <div className="space-y-2">
                <Label htmlFor="hmSalaryRange" className="font-semibold text-md">Hiring Manager's Submitted Salary Range:</Label>
                <p id="hmSalaryRange" className="text-sm text-foreground/80 p-3 border rounded-md bg-muted">
                    {selectedJob.salaryRange || "Not specified by Hiring Manager."}
                </p>
            </div>

            <div className="space-y-2 pt-4 border-t mt-4">
                <Label htmlFor="recruiterOptimizedDescription" className="font-semibold text-md text-primary">Recruiter's Optimized Version / Suggestions:</Label>
                <Textarea
                    id="recruiterOptimizedDescription"
                    value={recruiterOptimizedDescription}
                    onChange={(e) => setRecruiterOptimizedDescription(e.target.value)}
                    placeholder="Enter your optimized job description, or list suggested changes/improvements here..."
                    rows={8}
                    className="mt-1 border-primary/50 focus:border-primary"
                    disabled={selectedJob.status !== "Pending Recruiter Approval"}
                />
            </div>

            {selectedJob.status === "Pending Recruiter Approval" && (
                 <div className="pt-4 border-t mt-4">
                    <Label htmlFor="rejectionReason" className="font-semibold text-md">Reason for Rejection (Required if rejecting):</Label>
                    <Textarea
                        id="rejectionReason"
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        placeholder="Provide a clear reason if you are rejecting this job posting..."
                        className="mt-1"
                        rows={3}
                    />
                 </div>
            )}
          </div>
          <DialogFooter className="mt-2">
            <Button type="button" variant="outline" onClick={() => setSelectedJob(null)}>Close</Button>
            {selectedJob.status === "Pending Recruiter Approval" && (
                <>
                <Button type="button" variant="destructive" onClick={() => {
                    if (!rejectionReason.trim()) {
                        toast({title: "Reason Required", description: "Please provide a reason for rejection.", variant: "destructive"});
                        return;
                    }
                    handleAction(selectedJob.id, 'reject', rejectionReason);
                }}>
                    Confirm Rejection
                </Button>
                 <Button type="button" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => {
                    console.log("Final Optimized Description to be posted by Recruiter:", recruiterOptimizedDescription || selectedJob.jobDescription);
                    handleAction(selectedJob.id, 'approve');
                 }}>
                    Approve & Post Job
                  </Button>
                </>
            )}
          </DialogFooter>
        </DialogContent>
      )}
    </Dialog>
  );
}

    