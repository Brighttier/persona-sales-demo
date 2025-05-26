
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

interface JobForHMApproval {
  id: string;
  title: string;
  department: string;
  submittedBy: string; // Recruiter's name
  dateSubmitted: string;
  status: "Pending Hiring Manager Approval" | "Approved by Hiring Manager" | "Rejected by Hiring Manager";
  jobDescription?: string;
  salaryRange?: string;
}

const mockJobsForHMApproval: JobForHMApproval[] = [
  { id: "recJob1", title: "Senior Frontend Developer", department: "Engineering", submittedBy: "Brenda Smith (Recruiter)", dateSubmitted: "2024-07-29", status: "Pending Hiring Manager Approval", jobDescription: "Seeking an experienced frontend developer to lead UI/UX initiatives...", salaryRange: "$125k - $155k" },
  { id: "recJob2", title: "Digital Marketing Specialist", department: "Marketing", submittedBy: "Brenda Smith (Recruiter)", dateSubmitted: "2024-07-27", status: "Pending Hiring Manager Approval", jobDescription: "Drive our digital marketing campaigns across various channels...", salaryRange: "$70k - $90k" },
  { id: "recJob3", title: "AI Research Scientist", department: "Research & Development", submittedBy: "Brenda Smith (Recruiter)", dateSubmitted: "2024-07-25", status: "Approved by Hiring Manager", jobDescription: "Conduct cutting-edge research in machine learning...", salaryRange: "$130k - $160k" },
  { id: "recJob4", title: "Customer Success Manager", department: "Customer Relations", submittedBy: "Brenda Smith (Recruiter)", dateSubmitted: "2024-07-22", status: "Rejected by Hiring Manager", jobDescription: "Ensure our enterprise clients achieve their desired outcomes...", salaryRange: "$90k - $110k" },
];

export default function HMJobApprovalsPage() {
  const { toast } = useToast();
  const [jobs, setJobs] = useState<JobForHMApproval[]>(mockJobsForHMApproval);
  const [selectedJob, setSelectedJob] = useState<JobForHMApproval | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const handleAction = (jobId: string, action: 'approve' | 'reject', reason?: string) => {
    setJobs(prevJobs => prevJobs.map(job =>
        job.id === jobId ? { ...job, status: action === 'approve' ? 'Approved by Hiring Manager' : 'Rejected by Hiring Manager' } : job
    ));
    toast({
      title: `Job ${action === 'approve' ? 'Approved' : 'Rejected'} by Hiring Manager`,
      description: `The job posting "${jobs.find(j=>j.id===jobId)?.title}" has been ${action === 'approve' ? 'approved' : 'rejected'}.${reason ? ` Reason: ${reason}` : ''}`,
      variant: action === 'approve' ? 'default' : 'destructive',
    });
    setSelectedJob(null);
    setRejectionReason("");
  };

  const getStatusPill = (status: JobForHMApproval["status"]) => {
    switch(status) {
        case "Pending Hiring Manager Approval": return <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 border-yellow-300"><Clock className="mr-1 h-3 w-3"/>{status}</Badge>;
        case "Approved by Hiring Manager": return <Badge className="bg-green-100 text-green-700 border-green-300"><Check className="mr-1 h-3 w-3"/>Approved</Badge>;
        case "Rejected by Hiring Manager": return <Badge variant="destructive" className="bg-red-100 text-red-700 border-red-300"><X className="mr-1 h-3 w-3"/>Rejected</Badge>;
        default: return <Badge>{status}</Badge>;
    }
  };

  const openDetailsDialog = (job: JobForHMApproval) => {
    setSelectedJob(job);
  };

  return (
    <Dialog onOpenChange={(open) => !open && setSelectedJob(null)}>
      <div className="space-y-6">
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center"><Users className="mr-2 h-6 w-6 text-primary" /> Hiring Manager: Job Posting Approvals</CardTitle>
            <CardDescription>As a Hiring Manager, review job postings submitted by Recruiters, and approve or reject them.</CardDescription>
          </CardHeader>
        </Card>

        <Card className="shadow-lg">
          <CardHeader className="border-b">
             <div className="flex items-center space-x-2">
                <SearchIcon className="h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search job titles or departments..." className="max-w-sm"/>
             </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Job Title</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Submitted By (Recruiter)</TableHead>
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
                    <TableCell>{job.submittedBy}</TableCell>
                    <TableCell>{job.dateSubmitted}</TableCell>
                    <TableCell>{getStatusPill(job.status)}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="sm" onClick={() => openDetailsDialog(job)}><Eye className="mr-1 h-4 w-4"/> Review Details</Button>
                      </DialogTrigger>
                      {job.status === "Pending Hiring Manager Approval" && (
                        <>
                          <DialogTrigger asChild>
                             <Button variant="outline" size="sm" className="text-red-600 border-red-300 hover:bg-red-50 hover:text-red-700" onClick={() => setSelectedJob(job)}>
                                <ThumbsDown className="mr-1 h-4 w-4" /> Reject
                            </Button>
                          </DialogTrigger>
                          <Button variant="default" size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => handleAction(job.id, 'approve')}>
                            <ThumbsUp className="mr-1 h-4 w-4" /> Approve & Finalize
                          </Button>
                        </>
                      )}
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
            <DialogTitle>Review Job: {selectedJob.title}</DialogTitle>
            <DialogDescription>Department: {selectedJob.department} | Submitted by: {selectedJob.submittedBy}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
            <div className="space-y-1">
                <h4 className="font-semibold text-sm">Job Description (from Recruiter):</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-line p-2 border rounded-md bg-secondary/30">{selectedJob.jobDescription || "No description provided."}</p>
                 <Textarea placeholder="Hiring Manager: Add final notes or adjustments (optional)..." rows={3} className="mt-1"/>
            </div>
            <div className="space-y-1">
                <h4 className="font-semibold text-sm">Salary Range:</h4>
                <p className="text-sm text-muted-foreground">{selectedJob.salaryRange || "Not specified."}</p>
            </div>

            {selectedJob.status === "Pending Hiring Manager Approval" && (
                 <div className="pt-4 border-t">
                    <Label htmlFor="rejectionReasonHM" className="font-semibold text-sm">Reason for Rejection (if rejecting):</Label>
                    <Textarea
                        id="rejectionReasonHM"
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
            {selectedJob.status === "Pending Hiring Manager Approval" && (
                <>
                <Button type="button" variant="destructive" onClick={() => handleAction(selectedJob.id, 'reject', rejectionReason)}>
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
    
