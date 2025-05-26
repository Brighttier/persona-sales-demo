
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

interface JobForHMApproval {
  id: string;
  title: string;
  department: string;
  submittedBy: string; // Recruiter's name who might have created it
  dateSubmitted: string;
  status: "Pending Hiring Manager Approval" | "Approved by Hiring Manager" | "Rejected by Hiring Manager";
  jobDescription?: string;
  salaryRange?: string;
}

const mockJobsForHMApproval: JobForHMApproval[] = [
  // This page is no longer used per the new workflow.
  // Keeping one example for structure if it were to be reactivated for a different purpose.
  // { id: "recJob1", title: "Senior Frontend Developer", department: "Engineering", submittedBy: "Brenda Smith (Recruiter)", dateSubmitted: "2024-07-29", status: "Pending Hiring Manager Approval", jobDescription: "Seeking an experienced frontend developer to lead UI/UX initiatives...", salaryRange: "$125k - $155k" },
];

export default function HMJobApprovalsPage() {
  const { toast } = useToast();
  const [jobs, setJobs] = useState<JobForHMApproval[]>(mockJobsForHMApproval);
  const [selectedJob, setSelectedJob] = useState<JobForHMApproval | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

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
        case "Pending Hiring Manager Approval": return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300 hover:bg-yellow-100 py-1"><Clock className="mr-1 h-3 w-3"/>{status}</Badge>;
        case "Approved by Hiring Manager": return <Badge className="bg-green-100 text-green-800 border-green-300 hover:bg-green-100 py-1"><Check className="mr-1 h-3 w-3"/>Approved</Badge>;
        case "Rejected by Hiring Manager": return <Badge className="bg-red-100 text-red-800 border-red-300 hover:bg-red-100 py-1"><X className="mr-1 h-3 w-3"/>Rejected</Badge>;
        default: return <Badge className="py-1">{status}</Badge>;
    }
  };

  const openDetailsDialog = (job: JobForHMApproval) => {
    setSelectedJob(job);
    if (job.status === "Pending Hiring Manager Approval") {
      setRejectionReason("");
    }
  };

  const filteredJobs = useMemo(() => {
    return jobs.filter(job => 
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.department.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [jobs, searchTerm]);

  return (
    <Dialog onOpenChange={(open) => !open && setSelectedJob(null)}>
      <div className="space-y-6">
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center"><Users className="mr-2 h-6 w-6 text-primary" /> Hiring Manager: Job Posting Approvals</CardTitle>
            <CardDescription>This page is currently not in use. Job approvals are handled by Recruiters.</CardDescription>
          </CardHeader>
        </Card>

        <Card className="shadow-lg">
          <CardHeader className="border-b py-4">
             <div className="relative max-w-xs">
                <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search job titles or departments..." 
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  disabled
                />
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
                {filteredJobs.length > 0 ? filteredJobs.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell className="font-medium">{job.title}</TableCell>
                    <TableCell>{job.department}</TableCell>
                    <TableCell>{job.submittedBy}</TableCell>
                    <TableCell>{job.dateSubmitted}</TableCell>
                    <TableCell>{getStatusPill(job.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm" onClick={() => openDetailsDialog(job)} disabled><Eye className="mr-1 h-4 w-4"/> Review Details</Button>
                        </DialogTrigger>
                        {job.status === "Pending Hiring Manager Approval" && (
                          <>
                            <DialogTrigger asChild>
                               <Button variant="outline" size="sm" className="text-red-600 border-red-400 hover:bg-red-50 hover:text-red-700 focus-visible:ring-red-400" onClick={() => openDetailsDialog(job)} disabled>
                                  <ThumbsDown className="mr-1 h-3.5 w-3.5" /> Reject
                              </Button>
                            </DialogTrigger>
                            <Button variant="default" size="sm" className="bg-green-600 hover:bg-green-700 text-white focus-visible:ring-green-500" onClick={() => handleAction(job.id, 'approve')} disabled>
                              <ThumbsUp className="mr-1 h-3.5 w-3.5" /> Approve & Finalize
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )) : (
                   <TableRow><TableCell colSpan={6} className="h-24 text-center text-muted-foreground">No job postings to display. This approval step is handled by Recruiters.</TableCell></TableRow>
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
                <div className="text-sm text-foreground/80 whitespace-pre-line p-3 border rounded-md bg-muted min-h-[100px]">
                    {selectedJob.jobDescription || "No description provided."}
                </div>
            </div>
            <div className="space-y-1">
                <h4 className="font-semibold text-sm">Salary Range (from Recruiter):</h4>
                <p className="text-sm text-foreground/80 p-3 border rounded-md bg-muted">
                    {selectedJob.salaryRange || "Not specified."}
                </p>
            </div>

            {selectedJob.status === "Pending Hiring Manager Approval" && (
                 <div className="pt-4 border-t">
                    <Label htmlFor="rejectionReasonHM" className="font-semibold text-sm">Reason for Rejection (Required if rejecting):</Label>
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
    

    