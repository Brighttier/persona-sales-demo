"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Check, Clock, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const mockJobsForApproval = [
  { id: "jobAppr1", title: "Senior Backend Engineer", department: "Engineering", recruiter: "Brenda Smith", dateSubmitted: "2024-07-22", status: "Pending Approval" },
  { id: "jobAppr2", title: "Lead UX Researcher", department: "Design", recruiter: "John Recruiter", dateSubmitted: "2024-07-20", status: "Pending Approval" },
  { id: "jobAppr3", title: "Junior Marketing Analyst", department: "Marketing", recruiter: "Sarah Talent", dateSubmitted: "2024-07-18", status: "Approved" },
  { id: "jobAppr4", title: "DevOps Specialist", department: "IT/Ops", recruiter: "Brenda Smith", dateSubmitted: "2024-07-15", status: "Rejected" },
];

export default function JobApprovalsPage() {
  const { toast } = useToast();

  const handleApproval = (jobId: string, action: 'approve' | 'reject') => {
    // In a real app, this would be an API call
    console.log(`Job ${jobId} ${action}d.`);
    toast({
      title: `Job ${action === 'approve' ? 'Approved' : 'Rejected'}`,
      description: `The job posting has been successfully ${action === 'approve' ? 'approved' : 'rejected'}.`,
    });
    // Here you would update the state or re-fetch data
  };
  
  const getStatusPill = (status: string) => {
    switch(status) {
        case "Pending Approval": return <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 border-yellow-300"><Clock className="mr-1 h-3 w-3"/>{status}</Badge>;
        case "Approved": return <Badge variant="default" className="bg-green-100 text-green-700 border-green-300"><Check className="mr-1 h-3 w-3"/>{status}</Badge>;
        case "Rejected": return <Badge variant="destructive" className="bg-red-100 text-red-700 border-red-300"><X className="mr-1 h-3 w-3"/>{status}</Badge>;
        default: return <Badge>{status}</Badge>;
    }
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-2xl">Job Posting Approvals</CardTitle>
          <CardDescription>Review and approve or reject job postings submitted by recruiters.</CardDescription>
        </CardHeader>
      </Card>

      <Card>
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
              {mockJobsForApproval.map((job) => (
                <TableRow key={job.id}>
                  <TableCell className="font-medium">{job.title}</TableCell>
                  <TableCell>{job.department}</TableCell>
                  <TableCell>{job.recruiter}</TableCell>
                  <TableCell>{job.dateSubmitted}</TableCell>
                  <TableCell>{getStatusPill(job.status)}</TableCell>
                  <TableCell className="text-right space-x-2">
                    {job.status === "Pending Approval" && (
                      <>
                        <Button variant="outline" size="sm" onClick={() => handleApproval(job.id, 'reject')}>
                          <X className="mr-1 h-4 w-4" /> Reject
                        </Button>
                        <Button variant="default" size="sm" onClick={() => handleApproval(job.id, 'approve')} className="bg-green-600 hover:bg-green-700">
                          <Check className="mr-1 h-4 w-4" /> Approve
                        </Button>
                      </>
                    )}
                    {job.status !== "Pending Approval" && (
                       <Button variant="ghost" size="sm" disabled>View Details</Button> // Placeholder
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {mockJobsForApproval.length === 0 && (
                 <TableRow><TableCell colSpan={6} className="h-24 text-center">No job postings awaiting approval.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
