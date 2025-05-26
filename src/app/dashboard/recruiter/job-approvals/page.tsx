
"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Check, Clock, Eye, ThumbsDown, ThumbsUp, X, Search as SearchIcon, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface JobForRecruiterApproval {
  id: string;
  title: string;
  department: string;
  hiringManager: string; // Changed from recruiter
  dateSubmitted: string;
  status: "Pending Recruiter Approval" | "Approved by Recruiter" | "Rejected by Recruiter";
  jobDescription?: string;
  salaryRange?: string;
}

const mockJobsForRecruiterApproval: JobForRecruiterApproval[] = [
  { id: "jobAppr1", title: "Senior Backend Engineer", department: "Engineering", hiringManager: "Charles Brown", dateSubmitted: "2024-07-22", status: "Pending Recruiter Approval", jobDescription: "Lead the development of our core backend services...", salaryRange: "$120k - $150k" },
  { id: "jobAppr2", title: "Lead UX Researcher", department: "Design", hiringManager: "Diana Green (Admin as HM)", dateSubmitted: "2024-07-20", status: "Pending Recruiter Approval", jobDescription: "Drive user research initiatives to inform product strategy...", salaryRange: "$110k - $140k" },
  { id: "jobAppr3", title: "Junior Marketing Analyst", department: "Marketing", hiringManager: "Charles Brown", dateSubmitted: "2024-07-18", status: "Approved by Recruiter", jobDescription: "Analyze marketing campaign performance and identify trends...", salaryRange: "$60k - $75k" },
  { id: "jobAppr4", title: "DevOps Specialist", department: "IT/Ops", hiringManager: "Diana Green (Admin as HM)", dateSubmitted: "2024-07-15", status: "Rejected by Recruiter", jobDescription: "Maintain and improve our CI/CD pipelines and cloud infrastructure...", salaryRange: "$100k - $130k" },
];

export default function RecruiterJobApprovalsPage() {
  const { toast } = useToast();
  const [jobs, setJobs] = useState<JobForRecruiterApproval[]>(mockJobsForRecruiterApproval);
  const [selectedJob, setSelectedJob] = useState<JobForRecruiterApproval | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const handleAction = (jobId: string, action: 'approve' | 'reject', reason?: string) => {
    setJobs(prevJobs => prevJobs.map(job =>
        job.id === jobId ? { ...job, status: action === 'approve' ? 'Approved by Recruiter' : 'Rejected by Recruiter' } : job
    ));
    toast({
      title: `Job ${action === 'approve' ? 'Approved' : 'Rejected'} by Recruiter`,
      description: `The job posting "${jobs.find(j=>j.id===jobId)?.title}" has been ${action === 'approve' ? 'approved' : 'rejected'}.${reason ? ` Reason: ${reason}` : ''}`,
      variant: action === 'approve' ? 'default' : 'destructive',
    });
    setSelectedJob(null);
    setRejectionReason("");
  };

  const getStatusPill = (status: JobForRecruiterApproval["status"]) => {
    switch(status) {
        case "Pending Recruiter Approval": return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300 hover:bg-yellow-100 py-1"><Clock className="mr-1 h-3 w-3"/>{status}</Badge>;
        case "Approved by Recruiter": return <Badge className="bg-green-100 text-green-800 border-green-300 hover:bg-green-100 py-1"><Check className="mr-1 h-3 w-3"/>Approved</Badge>;
        case "Rejected by Recruiter": return <Badge className="bg-red-100 text-red-800 border-red-300 hover:bg-red-100 py-1"><X className="mr-1 h-3 w-3"/>Rejected</Badge>;
        default: return <Badge className="py-1">{status}</Badge>;
    }
  };

  const openDetailsDialog = (job: JobForRecruiterApproval) => {
    setSelectedJob(job);
    // If rejecting, ensure rejectionReason is cleared for the new dialog instance
    if (job.status === "Pending Recruiter Approval") {
        setRejectionReason("");
    }
  };

  return (
    <Dialog onOpenChange={(open) => { if (!open) setSelectedJob(null); }}>
      <div className="space-y-6">
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center"><Users className="mr-2 h-6 w-6 text-primary" /> Job Posting Approvals</CardTitle>
            <CardDescription>As a Recruiter, review job postings submitted by Hiring Managers, optimize, and approve or reject them.</CardDescription>
          </CardHeader>
        </Card>

        <Card className="shadow-lg">
          <CardHeader className="border-b py-4">
             <div className="relative max-w-xs">
                <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search job titles or departments..." className="pl-8"/>
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
                {jobs.map((job) => (
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
                            <Button variant="default" size="sm" className="bg-green-600 hover:bg-green-700 text-white focus-visible:ring-green-500" onClick={() => handleAction(job.id, 'approve')}>
                              <ThumbsUp className="mr-1 h-3.5 w-3.5" /> Approve & Post
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {jobs.length === 0 && (
                   <TableRow><TableCell colSpan={6} className="h-24 text-center text-muted-foreground">No job postings awaiting your approval.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {selectedJob && (
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Review & Optimize: {selectedJob.title}</DialogTitle>
            <DialogDescription>Department: {selectedJob.department} | Submitted by: {selectedJob.hiringManager}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
            <div className="space-y-1">
                <h4 className="font-semibold text-sm">Job Description (from HM):</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-line p-2 border rounded-md bg-secondary/30">{selectedJob.jobDescription || "No description provided."}</p>
                <Textarea placeholder="Recruiter: Add optimized job description here..." rows={4} className="mt-1"/>
            </div>
            <div className="space-y-1">
                <h4 className="font-semibold text-sm">Salary Range:</h4>
                <p className="text-sm text-muted-foreground">{selectedJob.salaryRange || "Not specified."}</p>
            </div>

            {selectedJob.status === "Pending Recruiter Approval" && (
                 <div className="pt-4 border-t">
                    <Label htmlFor="rejectionReason" className="font-semibold text-sm">Reason for Rejection (if rejecting):</Label>
                    <Textarea
                        id="rejectionReason"
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        placeholder="Provide a brief reason if you are rejecting this job posting..."
                        className="mt-1"
                        rows={3}
                    />
                 </div>
            )}
          </div>
          <DialogFooter>
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
                 <Button type="button" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => handleAction(selectedJob.id, 'approve')}>
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
