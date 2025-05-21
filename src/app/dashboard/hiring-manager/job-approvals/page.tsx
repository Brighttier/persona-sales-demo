
"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Check, Clock, Eye, ThumbsDown, ThumbsUp, X, Search as SearchIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface JobForApproval {
  id: string;
  title: string;
  department: string;
  recruiter: string;
  dateSubmitted: string;
  status: "Pending Approval" | "Approved" | "Rejected";
  jobDescription?: string; // Added for view details
  salaryRange?: string;
}

const mockJobsForApproval: JobForApproval[] = [
  { id: "jobAppr1", title: "Senior Backend Engineer", department: "Engineering", recruiter: "Brenda Smith", dateSubmitted: "2024-07-22", status: "Pending Approval", jobDescription: "Lead the development of our core backend services...", salaryRange: "$120k - $150k" },
  { id: "jobAppr2", title: "Lead UX Researcher", department: "Design", recruiter: "John Recruiter", dateSubmitted: "2024-07-20", status: "Pending Approval", jobDescription: "Drive user research initiatives to inform product strategy...", salaryRange: "$110k - $140k" },
  { id: "jobAppr3", title: "Junior Marketing Analyst", department: "Marketing", recruiter: "Sarah Talent", dateSubmitted: "2024-07-18", status: "Approved", jobDescription: "Analyze marketing campaign performance and identify trends...", salaryRange: "$60k - $75k" },
  { id: "jobAppr4", title: "DevOps Specialist", department: "IT/Ops", recruiter: "Brenda Smith", dateSubmitted: "2024-07-15", status: "Rejected", jobDescription: "Maintain and improve our CI/CD pipelines and cloud infrastructure...", salaryRange: "$100k - $130k" },
];

export default function JobApprovalsPage() {
  const { toast } = useToast();
  const [jobs, setJobs] = useState<JobForApproval[]>(mockJobsForApproval);
  const [selectedJob, setSelectedJob] = useState<JobForApproval | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const handleAction = (jobId: string, action: 'approve' | 'reject', reason?: string) => {
    setJobs(prevJobs => prevJobs.map(job => 
        job.id === jobId ? { ...job, status: action === 'approve' ? 'Approved' : 'Rejected' } : job
    ));
    toast({
      title: `Job ${action === 'approve' ? 'Approved' : 'Rejected'}`,
      description: `The job posting "${jobs.find(j=>j.id===jobId)?.title}" has been ${action === 'approve' ? 'approved' : 'rejected'}.${reason ? ` Reason: ${reason}` : ''}`,
      variant: action === 'approve' ? 'default' : 'destructive',
    });
    setSelectedJob(null); // Close dialog
    setRejectionReason(""); // Reset reason
  };
  
  const getStatusPill = (status: string) => {
    switch(status) {
        case "Pending Approval": return <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 border-yellow-300"><Clock className="mr-1 h-3 w-3"/>{status}</Badge>;
        case "Approved": return <Badge className="bg-green-100 text-green-700 border-green-300"><Check className="mr-1 h-3 w-3"/>{status}</Badge>;
        case "Rejected": return <Badge variant="destructive" className="bg-red-100 text-red-700 border-red-300"><X className="mr-1 h-3 w-3"/>{status}</Badge>;
        default: return <Badge>{status}</Badge>;
    }
  };

  const openDetailsDialog = (job: JobForApproval) => {
    setSelectedJob(job);
  };
  
  const openRejectDialog = (job: JobForApproval) => {
    setSelectedJob(job); // Set for rejection reason dialog
    // This will now open the common dialog, but we can differentiate actions later
  };

  return (
    <Dialog onOpenChange={(open) => !open && setSelectedJob(null)}>
      <div className="space-y-6">
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl">Job Posting Approvals</CardTitle>
            <CardDescription>Review and approve or reject job postings submitted by recruiters.</CardDescription>
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
                  <TableHead>Submitted By</TableHead>
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
                    <TableCell>{job.recruiter}</TableCell>
                    <TableCell>{job.dateSubmitted}</TableCell>
                    <TableCell>{getStatusPill(job.status)}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="sm" onClick={() => openDetailsDialog(job)}><Eye className="mr-1 h-4 w-4"/> View</Button>
                      </DialogTrigger>
                      {job.status === "Pending Approval" && (
                        <>
                          <DialogTrigger asChild>
                             <Button variant="outline" size="sm" className="text-red-600 border-red-300 hover:bg-red-50 hover:text-red-700" onClick={() => setSelectedJob(job) /* Store job for reject modal */}>
                                <ThumbsDown className="mr-1 h-4 w-4" /> Reject
                            </Button>
                          </DialogTrigger>
                          <Button variant="default" size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => handleAction(job.id, 'approve')}>
                            <ThumbsUp className="mr-1 h-4 w-4" /> Approve
                          </Button>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {jobs.length === 0 && (
                   <TableRow><TableCell colSpan={6} className="h-24 text-center text-muted-foreground">No job postings awaiting approval or historical data.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      
      {/* Combined Dialog for View Details and Reject Reason */}
      {selectedJob && (
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedJob.title}</DialogTitle>
            <DialogDescription>Department: {selectedJob.department} | Submitted by: {selectedJob.recruiter}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
            <div className="space-y-1">
                <h4 className="font-semibold text-sm">Job Description:</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-line">{selectedJob.jobDescription || "No description provided."}</p>
            </div>
            <div className="space-y-1">
                <h4 className="font-semibold text-sm">Salary Range:</h4>
                <p className="text-sm text-muted-foreground">{selectedJob.salaryRange || "Not specified."}</p>
            </div>
            
            {selectedJob.status === "Pending Approval" && (
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
            {selectedJob.status === "Pending Approval" && (
                <>
                <Button type="button" variant="destructive" onClick={() => handleAction(selectedJob.id, 'reject', rejectionReason)} disabled={!rejectionReason && true /* Could enforce reason */}>
                    Confirm Rejection
                </Button>
                 <Button type="button" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => handleAction(selectedJob.id, 'approve')}>
                    Approve Job
                  </Button>
                </>
            )}
          </DialogFooter>
        </DialogContent>
      )}
    </Dialog>
  );
}
