
"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Edit, MoreHorizontal, PlusCircle, Trash2, Users, Eye, Play, Pause, Check, Search as SearchIcon, Briefcase } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useRouter } from "next/navigation";

const mockHMJobListings = [
  { id: "hmjob1", title: "Lead Software Architect", status: "Pending Approval", applicants: 0, department: "Engineering", location: "Remote", dateCreated: "2024-07-28" },
  { id: "hmjob2", title: "Senior Product Designer", status: "Active", applicants: 15, department: "Design", location: "New York, NY", dateCreated: "2024-07-25" },
  { id: "hmjob3", title: "Marketing Manager", status: "Draft", applicants: 0, department: "Marketing", location: "San Francisco, CA", dateCreated: "2024-07-22" },
];

export default function HiringManagerJobListingsPage() {
  const { user, role } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const handleJobAction = (jobId: string, action: string) => {
    toast({ title: `Action: ${action}`, description: `Performed ${action} on job ${jobId}. (Simulated)`});
  };

  const getStatusPill = (status: string) => {
    switch(status) {
        case "Active": return <Badge className="bg-green-100 text-green-700 border-green-300">{status}</Badge>;
        case "Pending Approval": return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-300">{status}</Badge>;
        case "Closed": return <Badge variant="secondary" className="bg-gray-100 text-gray-700 border-gray-300">{status}</Badge>;
        case "Draft": return <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300">{status}</Badge>;
        default: return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-xl">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl flex items-center"><Briefcase className="mr-2 h-6 w-6 text-primary"/> My Job Postings</CardTitle>
            <CardDescription>Create and manage job postings for your team.</CardDescription>
          </div>
          <Button asChild>
            <Link href={`/dashboard/${role}/job-listings/new`}>
              <PlusCircle className="mr-2 h-4 w-4" /> Create New Job
            </Link>
          </Button>
        </CardHeader>
      </Card>

      <Card className="shadow-lg">
        <CardHeader className="border-b">
            <div className="flex flex-col md:flex-row gap-2 justify-between items-center">
                 <div className="relative flex-grow w-full md:w-auto">
                    <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search by title, department..." className="pl-8 w-full" />
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <Select>
                        <SelectTrigger className="w-full md:w-[180px]"><SelectValue placeholder="Filter by Status" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="pending-approval">Pending Approval</SelectItem>
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="closed">Closed</SelectItem>
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
                <TableHead>Job Title</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Applicants</TableHead>
                <TableHead>Date Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockHMJobListings.map((job) => (
                <TableRow key={job.id}>
                  <TableCell className="font-medium">
                    <Link href={`/dashboard/recruiter/job-listings/${job.id}/applicants`} className="hover:underline text-primary">
                        {job.title}
                    </Link>
                  </TableCell>
                  <TableCell>{job.department}</TableCell>
                  <TableCell>{job.location}</TableCell>
                  <TableCell>{getStatusPill(job.status)}</TableCell>
                  <TableCell>{job.status === "Active" || job.status === "Closed" ? job.applicants : "N/A"}</TableCell>
                  <TableCell>{job.dateCreated}</TableCell>
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
                        {(job.status === "Active" || job.status === "Pending Approval") && (
                           <DropdownMenuItem onClick={() => router.push(`/dashboard/recruiter/job-listings/${job.id}/applicants`)}>
                            <Users className="mr-2 h-4 w-4" />View Applicants
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => handleJobAction(job.id, 'edit_job')}><Edit className="mr-2 h-4 w-4" />Edit Job</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {job.status === "Draft" && <DropdownMenuItem onClick={() => handleJobAction(job.id, 'submit_for_approval')}><Check className="mr-2 h-4 w-4"/>Submit for Approval</DropdownMenuItem>}
                        <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10" onClick={() => handleJobAction(job.id, 'delete_job')}><Trash2 className="mr-2 h-4 w-4" />Delete Job</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {mockHMJobListings.length === 0 && (
                <TableRow><TableCell colSpan={7} className="h-24 text-center text-muted-foreground">No job postings created yet.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter className="border-t pt-6 flex justify-center">
            <Button variant="outline" size="sm">Load More (Placeholder)</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
    