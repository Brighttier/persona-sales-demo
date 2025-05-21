
"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Edit, MoreHorizontal, PlusCircle, Trash2, Users, Eye, Play, Pause, ShieldCheck, Search as SearchIcon } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

const mockJobListings = [
  { id: "job1", title: "Software Engineer, Frontend", status: "Active", applicants: 25, interviews: 5, hired: 1, department: "Engineering", location: "Remote", aiScreeningStatus: "Completed" },
  { id: "job2", title: "Product Manager", status: "Active", applicants: 42, interviews: 8, hired: 0, department: "Product", location: "New York, NY", aiScreeningStatus: "Pending" },
  { id: "job3", title: "UX Designer", status: "Paused", applicants: 15, interviews: 2, hired: 0, department: "Design", location: "San Francisco, CA", aiScreeningStatus: "N/A" },
  { id: "job4", title: "Data Scientist", status: "Closed", applicants: 60, interviews: 10, hired: 2, department: "Data Science", location: "Remote", aiScreeningStatus: "Completed"},
  { id: "job5", title: "DevOps Engineer", status: "Draft", applicants: 0, interviews: 0, hired: 0, department: "IT/Operations", location: "Austin, TX", aiScreeningStatus: "N/A"},
];

export default function RecruiterJobListingsPage() {
  const { user, role } = useAuth();
  const { toast } = useToast();

  const handleJobAction = (jobId: string, action: string) => {
    toast({ title: `Action: ${action}`, description: `Performed ${action} on job ${jobId}. (Simulated)`});
    // API call for action would happen here
  };

  const getStatusPill = (status: string) => {
    switch(status) {
        case "Active": return <Badge className="bg-green-100 text-green-700 border-green-300">{status}</Badge>;
        case "Paused": return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-300">{status}</Badge>;
        case "Closed": return <Badge variant="secondary" className="bg-gray-100 text-gray-700 border-gray-300">{status}</Badge>;
        case "Draft": return <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300">{status}</Badge>;
        default: return <Badge>{status}</Badge>;
    }
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
            {/* This link would go to a /new or similar page which isn't built in this step */}
            <Link href={`/dashboard/${role}/job-listings`}> 
              <PlusCircle className="mr-2 h-4 w-4" /> Create New Job (Placeholder)
            </Link>
          </Button>
        </CardHeader>
      </Card>
      
      <Card>
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
                            <SelectItem value="paused">Paused</SelectItem>
                            <SelectItem value="closed">Closed</SelectItem>
                            <SelectItem value="draft">Draft</SelectItem>
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
                <TableHead>AI Screened</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockJobListings.map((job) => (
                <TableRow key={job.id}>
                  <TableCell className="font-medium">{job.title}</TableCell>
                  <TableCell>{job.department}</TableCell>
                  <TableCell>{job.location}</TableCell>
                  <TableCell>{getStatusPill(job.status)}</TableCell>
                  <TableCell>{job.applicants}</TableCell>
                  <TableCell>
                    {job.aiScreeningStatus === "Completed" && <Badge variant="secondary" className="text-green-700"><Check className="mr-1 h-3 w-3"/>Done</Badge>}
                    {job.aiScreeningStatus === "Pending" && <Badge variant="outline">Pending</Badge>}
                    {job.aiScreeningStatus === "N/A" && <span className="text-muted-foreground text-xs">N/A</span>}
                  </TableCell>
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
                        {/* The links for view/edit would go to [jobId]/view or [jobId]/edit which are not built */}
                        <DropdownMenuItem onClick={() => handleJobAction(job.id, 'view_applicants')}><Users className="mr-2 h-4 w-4" />View Applicants</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleJobAction(job.id, 'edit_job')}><Edit className="mr-2 h-4 w-4" />Edit Job</DropdownMenuItem>
                         <DropdownMenuItem onClick={() => handleJobAction(job.id, 'ai_screen')}><ShieldCheck className="mr-2 h-4 w-4" />AI Screen Applicants</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {job.status === "Active" && <DropdownMenuItem onClick={() => handleJobAction(job.id, 'pause_job')}><Pause className="mr-2 h-4 w-4" />Pause Job</DropdownMenuItem>}
                        {job.status === "Paused" && <DropdownMenuItem onClick={() => handleJobAction(job.id, 'activate_job')}><Play className="mr-2 h-4 w-4" />Activate Job</DropdownMenuItem>}
                        <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10" onClick={() => handleJobAction(job.id, 'delete_job')}><Trash2 className="mr-2 h-4 w-4" />Delete Job</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {mockJobListings.length === 0 && (
                <TableRow><TableCell colSpan={7} className="h-24 text-center text-muted-foreground">No job listings found. Start by creating a new one!</TableCell></TableRow>
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

    