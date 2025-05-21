"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Edit, MoreHorizontal, PlusCircle, Trash2, Users, Eye } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";

const mockJobListings = [
  { id: "job1", title: "Software Engineer, Frontend", status: "Active", applicants: 25, interviews: 5, hired: 1, department: "Engineering", location: "Remote" },
  { id: "job2", title: "Product Manager", status: "Active", applicants: 42, interviews: 8, hired: 0, department: "Product", location: "New York, NY" },
  { id: "job3", title: "UX Designer", status: "Paused", applicants: 15, interviews: 2, hired: 0, department: "Design", location: "San Francisco, CA" },
  { id: "job4", title: "Data Scientist", status: "Closed", applicants: 60, interviews: 10, hired: 2, department: "Data Science", location: "Remote"},
];

export default function RecruiterJobListingsPage() {
  const { user } = useAuth();

  const getStatusVariant = (status: string) => {
    if (status === "Active") return "default";
    if (status === "Paused") return "secondary";
    if (status === "Closed") return "outline"; // Or "destructive" if appropriate for "Closed"
    return "outline";
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-md">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl">Manage Job Listings</CardTitle>
            <CardDescription>Oversee all job postings, track applicants, and manage their status.</CardDescription>
          </div>
          <Button asChild>
            <Link href={`/dashboard/${user?.role}/job-listings/new`}>
              <PlusCircle className="mr-2 h-4 w-4" /> Create New Job
            </Link>
          </Button>
        </CardHeader>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Job Title</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Applicants</TableHead>
                <TableHead>Interviews</TableHead>
                <TableHead>Hired</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockJobListings.map((job) => (
                <TableRow key={job.id}>
                  <TableCell className="font-medium">{job.title}</TableCell>
                  <TableCell>{job.department}</TableCell>
                  <TableCell>{job.location}</TableCell>
                  <TableCell><Badge variant={getStatusVariant(job.status)}>{job.status}</Badge></TableCell>
                  <TableCell>{job.applicants}</TableCell>
                  <TableCell>{job.interviews}</TableCell>
                  <TableCell>{job.hired}</TableCell>
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
                        <DropdownMenuItem asChild><Link href={`/dashboard/${user?.role}/job-listings/${job.id}/view`}><Eye className="mr-2 h-4 w-4" />View Applicants</Link></DropdownMenuItem>
                        <DropdownMenuItem asChild><Link href={`/dashboard/${user?.role}/job-listings/${job.id}/edit`}><Edit className="mr-2 h-4 w-4" />Edit Job</Link></DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10"><Trash2 className="mr-2 h-4 w-4" />Delete Job</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {mockJobListings.length === 0 && (
                <TableRow><TableCell colSpan={8} className="h-24 text-center">No job listings found.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

// Placeholder pages for new/edit/view job applicants (would be more complex)
// e.g. /dashboard/recruiter/job-listings/new/page.tsx
// e.g. /dashboard/recruiter/job-listings/[jobId]/edit/page.tsx
// e.g. /dashboard/recruiter/job-listings/[jobId]/view/page.tsx (Job Applicant Management by job listing)
