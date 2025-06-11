
"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Edit, MoreHorizontal, PlusCircle, Trash2, Users, Eye, Play, Pause, ShieldCheck, Search as SearchIcon, Check, Briefcase } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useRouter } from "next/navigation";
import { useState, useMemo } from "react";

const mockJobListings = [
  { id: "job1", title: "Software Engineer, Frontend", status: "Active", applicants: 25, interviews: 5, hired: 1, department: "Engineering", location: "Remote", aiScreeningStatus: "Completed", datePosted: "2024-07-20", approvalStatus: "Approved by Recruiter" },
  { id: "job2", title: "Product Manager", status: "Pending Recruiter Approval", applicants: 0, interviews: 0, hired: 0, department: "Product", location: "New York, NY", aiScreeningStatus: "N/A", datePosted: "2024-07-28", approvalStatus: "Pending Recruiter Approval"},
  { id: "job3", title: "UX Designer", status: "Paused", applicants: 15, interviews: 2, hired: 0, department: "Design", location: "San Francisco, CA", aiScreeningStatus: "N/A", datePosted: "2024-07-15", approvalStatus: "Approved by Recruiter" },
  { id: "job4", title: "Data Scientist", status: "Closed", applicants: 60, interviews: 10, hired: 2, department: "Data Science", location: "Remote", aiScreeningStatus: "Completed", datePosted: "2024-06-10", approvalStatus: "Approved by Recruiter"},
  { id: "job5", title: "Marketing Lead", status: "Pending Recruiter Approval", applicants: 0, interviews: 0, hired: 0, department: "Marketing", location: "Austin, TX", aiScreeningStatus: "N/A", datePosted: "2024-07-29", approvalStatus: "Pending Recruiter Approval" },
  { id: "job6", title: "Senior Backend Developer", status: "Active", applicants: 30, interviews: 8, hired: 1, department: "Engineering", location: "Remote", aiScreeningStatus: "Completed", datePosted: "2024-07-10", approvalStatus: "Approved by Recruiter" },
  { id: "job7", title: "Junior Cloud Engineer", status: "Draft", applicants: 0, interviews: 0, hired: 0, department: "IT/Ops", location: "Chicago, IL", aiScreeningStatus: "N/A", datePosted: "2024-07-30", approvalStatus: "Draft" }, // Recruiter's own draft
];

export default function RecruiterJobListingsPage() {
  const { user, role } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | "all">("all");


  const filteredJobs = useMemo(() => {
    return mockJobListings.filter(job => {
      const searchMatch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          job.department.toLowerCase().includes(searchTerm.toLowerCase());
      const statusMatch = statusFilter === "all" || job.status === statusFilter;
      return searchMatch && statusMatch;
    });
  }, [searchTerm, statusFilter]);


  const handleJobAction = (jobId: string, jobTitle: string, action: string) => {
    let message = "";
    switch(action) {
        case "edit_job": message = `Editing job "${jobTitle}" (ID: ${jobId}) - Placeholder`; router.push(`/dashboard/${role}/job-listings/edit/${jobId}`); break; // Assume an edit page
        case "ai_screen": message = `Initiating AI screening for all applicants of "${jobTitle}" (ID: ${jobId}) - Placeholder`; break;
        case "pause_job": message = `Pausing job "${jobTitle}" (ID: ${jobId}) - Placeholder`; break;
        case "activate_job": message = `Activating job "${jobTitle}" (ID: ${jobId}) - Placeholder`; break;
        case "delete_job": message = `Deleting job "${jobTitle}" (ID: ${jobId}) - Placeholder`; break;
        default: message = `Performing ${action} on job "${jobTitle}" (ID: ${jobId}) - Placeholder`;
    }
    toast({ title: `Action: ${action.replace("_", " ").toUpperCase()}`, description: message});
  };

  const getStatusPill = (status: string) => {
    switch(status) {
        case "Active": return <Badge className="bg-green-100 text-green-700 border-green-300">{status}</Badge>;
        case "Paused": return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-300">{status}</Badge>;
        case "Closed": return <Badge variant="secondary" className="bg-gray-100 text-gray-700 border-gray-300">{status}</Badge>;
        case "Draft": return <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300">{status}</Badge>;
        case "Pending Recruiter Approval": return <Badge className="bg-orange-100 text-orange-700 border-orange-300">{status}</Badge>;
        case "Rejected by Recruiter": return <Badge variant="destructive" className="bg-red-100 text-red-700 border-red-300">{status}</Badge>;
        default: return <Badge>{status}</Badge>;
    }
  };
  
  const getApprovalStatusColumnText = (jobStatus: string, approvalStatus: string | undefined) => {
    if (jobStatus === "Pending Recruiter Approval") return "Pending Your Approval";
    if (approvalStatus === "Approved by Recruiter" && jobStatus !== "Draft") return "Approved by You";
    if (jobStatus === "Draft") return "Draft (Yours)";
    if (jobStatus === "Rejected by Recruiter") return "Rejected by You";
    if (jobStatus === "Active" && approvalStatus === "Approved by Recruiter") return "Published"; // Or just "Active"
    return approvalStatus || jobStatus; // Fallback
  };


  return (
    <div className="space-y-6">
      <Card className="shadow-xl">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl flex items-center"><Briefcase className="mr-2 h-6 w-6 text-primary"/> Job Listings Overview</CardTitle>
            <CardDescription>Oversee all job postings, track applicants, and manage their status or approval.</CardDescription>
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
                    <Input
                      placeholder="Search by title, department..."
                      className="pl-8 w-full"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value)}>
                        <SelectTrigger className="w-full md:w-[180px]"><SelectValue placeholder="Filter by Status" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            <SelectItem value="Active">Active</SelectItem>
                            <SelectItem value="Paused">Paused</SelectItem>
                            <SelectItem value="Closed">Closed</SelectItem>
                            <SelectItem value="Pending Recruiter Approval">Pending Recruiter Approval</SelectItem>
                            <SelectItem value="Draft">Draft</SelectItem>
                            <SelectItem value="Rejected by Recruiter">Rejected by Recruiter</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Job Title</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Overall Status</TableHead>
                <TableHead>Approval/Origin</TableHead>
                <TableHead>Applicants</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredJobs.map((job) => (
                <TableRow key={job.id}>
                  <TableCell className="font-medium">
                    <Link href={`/dashboard/${role}/job-listings/${job.id}/applicants`} className="hover:underline text-primary">
                      {job.title}
                    </Link>
                  </TableCell>
                  <TableCell>{job.department}</TableCell>
                  <TableCell>{getStatusPill(job.status)}</TableCell>
                  <TableCell>
                    <Badge variant={
                        job.status === "Pending Recruiter Approval" ? "default" : 
                        job.approvalStatus === "Approved by Recruiter" ? "default" :
                        job.status === "Draft" ? "outline" :
                        job.status === "Rejected by Recruiter" ? "destructive" : "secondary"
                    } className={
                        job.status === "Pending Recruiter Approval" ? "bg-yellow-100 text-yellow-700 border-yellow-300" : 
                        job.approvalStatus === "Approved by Recruiter" && job.status !== "Draft" ? "bg-green-100 text-green-700 border-green-300" :
                        job.status === "Draft" ? "bg-blue-100 text-blue-700 border-blue-300" : ""
                    }>
                        {getApprovalStatusColumnText(job.status, job.approvalStatus)}
                    </Badge>
                  </TableCell>
                  <TableCell>{job.applicants}</TableCell>
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
                        {(job.status === "Pending Recruiter Approval") && (
                             <DropdownMenuItem asChild>
                                <Link href={`/dashboard/${role}/job-approvals`}> {/* Specific job ID could be passed as query param if needed */}
                                  <Check className="mr-2 h-4 w-4" /> Review for Approval
                                </Link>
                             </DropdownMenuItem>
                        )}
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard/${role}/job-listings/${job.id}/applicants`}>
                            <Users className="mr-2 h-4 w-4" />View Applicants
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleJobAction(job.id, job.title, 'edit_job')}><Edit className="mr-2 h-4 w-4" />Edit Job</DropdownMenuItem>
                         <DropdownMenuItem onClick={() => handleJobAction(job.id, job.title, 'ai_screen')}><ShieldCheck className="mr-2 h-4 w-4" />AI Screen Applicants</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {job.status === "Active" && <DropdownMenuItem onClick={() => handleJobAction(job.id, job.title, 'pause_job')}><Pause className="mr-2 h-4 w-4" />Pause Job</DropdownMenuItem>}
                        {job.status === "Paused" && <DropdownMenuItem onClick={() => handleJobAction(job.id, job.title, 'activate_job')}><Play className="mr-2 h-4 w-4" />Activate Job</DropdownMenuItem>}
                        <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10" onClick={() => handleJobAction(job.id, job.title, 'delete_job')}><Trash2 className="mr-2 h-4 w-4" />Delete Job</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {filteredJobs.length === 0 && (
                <TableRow><TableCell colSpan={6} className="h-24 text-center text-muted-foreground">No job listings found matching your criteria.</TableCell></TableRow>
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

    