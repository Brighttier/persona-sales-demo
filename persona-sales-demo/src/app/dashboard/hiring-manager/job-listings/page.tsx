
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
import { useState, useMemo, useEffect } from "react";

const mockHMJobListings = [
  { id: "hmjob1", title: "Lead Software Architect", status: "Pending Recruiter Approval", applicants: 0, department: "Engineering", location: "Remote", dateCreated: "2024-07-28" },
  { id: "hmjob2", title: "Senior Product Designer", status: "Active", applicants: 15, department: "Design", location: "New York, NY", dateCreated: "2024-07-25" },
  { id: "hmjob3", title: "Marketing Manager", status: "Draft", applicants: 0, department: "Marketing", location: "San Francisco, CA", dateCreated: "2024-07-22" },
  { id: "hmjob4", title: "Data Visualization Expert", status: "Closed", applicants: 40, department: "Analytics", location: "Remote", dateCreated: "2024-06-15" },
  { id: "hmjob5", title: "Cloud Solutions Architect", status: "Active", applicants: 22, department: "Engineering", location: "Austin, TX", dateCreated: "2024-07-10" },
  { id: "hmjob6", title: "UX Research Lead", status: "Pending Recruiter Approval", applicants: 0, department: "Design", location: "Remote", dateCreated: "2024-07-30" },
  { id: "hmjob7", title: "Content Strategy Head", status: "Draft", applicants: 0, department: "Marketing", location: "Boston, MA", dateCreated: "2024-07-12" },
  { id: "hmjob8", title: "Principal Data Engineer", status: "Active", applicants: 8, department: "Analytics", location: "Seattle, WA", dateCreated: "2024-07-01" },
  { id: "hmjob9", title: "Junior UX Writer", status: "Active", applicants: 5, department: "Design", location: "Remote", dateCreated: "2024-08-01" },
  { id: "hmjob10", title: "Technical Project Manager", status: "Draft", applicants: 0, department: "Engineering", location: "New York, NY", dateCreated: "2024-08-02" },
  { id: "hmjob11", title: "Sales Development Representative", status: "Pending Recruiter Approval", applicants: 0, department: "Sales", location: "Remote", dateCreated: "2024-08-03" },
];

const INITIAL_JOBS_TO_SHOW = 5;
const JOBS_INCREMENT_COUNT = 5;

export default function HiringManagerJobListingsPage() {
  const { user, role } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | "all">("all");
  const [visibleJobsCount, setVisibleJobsCount] = useState(INITIAL_JOBS_TO_SHOW);

  const filteredJobsMemo = useMemo(() => {
    return mockHMJobListings.filter(job => {
      const searchMatch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          job.department.toLowerCase().includes(searchTerm.toLowerCase());
      const statusMatch = statusFilter === "all" || job.status === statusFilter;
      return searchMatch && statusMatch;
    });
  }, [searchTerm, statusFilter]);

  const displayedJobs = useMemo(() => {
    return filteredJobsMemo.slice(0, visibleJobsCount);
  }, [filteredJobsMemo, visibleJobsCount]);

  useEffect(() => {
    setVisibleJobsCount(INITIAL_JOBS_TO_SHOW); 
  }, [searchTerm, statusFilter]);

  const handleLoadMoreJobs = () => {
    setVisibleJobsCount(prevCount => Math.min(prevCount + JOBS_INCREMENT_COUNT, filteredJobsMemo.length));
  };

  const handleJobAction = (jobId: string, action: string) => {
    toast({ title: `Action: ${action}`, description: `Performed ${action} on job ${jobId}. (Simulated)`});
  };

  const getStatusPill = (status: string) => {
    switch(status) {
        case "Active": return <Badge className="bg-green-100 text-green-700 border-green-300">{status}</Badge>;
        case "Pending Recruiter Approval": return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-300">{status}</Badge>;
        case "Closed": return <Badge variant="secondary" className="bg-gray-100 text-gray-700 border-gray-300">{status}</Badge>;
        case "Draft": return <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300">{status}</Badge>;
        default: return <Badge>{status}</Badge>;
    }
  };

  const canViewApplicants = (status: string) => {
    return ["Active", "Closed", "Pending Recruiter Approval"].includes(status);
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-xl">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl flex items-center"><Briefcase className="mr-2 h-6 w-6 text-primary"/> My Job Postings</CardTitle>
            <CardDescription>Create and manage job postings for your team. Submit them to Recruiters for review.</CardDescription>
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
                            <SelectItem value="Pending Recruiter Approval">Pending Recruiter Approval</SelectItem>
                            <SelectItem value="Draft">Draft</SelectItem>
                            <SelectItem value="Closed">Closed</SelectItem>
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
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Applicants</TableHead>
                <TableHead>Date Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayedJobs.map((job) => (
                <TableRow key={job.id}>
                  <TableCell className="font-medium">
                    <Link href={`/dashboard/hiring-manager/job-listings/${job.id}/applicants`} className="hover:underline text-primary">
                        {job.title}
                    </Link>
                  </TableCell>
                  <TableCell>{job.department}</TableCell>
                  <TableCell>{job.location}</TableCell>
                  <TableCell>{getStatusPill(job.status)}</TableCell>
                  <TableCell>
                    {canViewApplicants(job.status) ? (
                        <Link href={`/dashboard/hiring-manager/job-listings/${job.id}/applicants`} className="hover:underline text-primary">
                            {job.applicants}
                        </Link>
                    ) : (
                        "N/A"
                    )}
                  </TableCell>
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
                        <DropdownMenuItem asChild>
                            <Link href={`/dashboard/hiring-manager/job-listings/${job.id}/applicants`}>
                                <Users className="mr-2 h-4 w-4" />View Applicants
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleJobAction(job.id, 'edit_job')}><Edit className="mr-2 h-4 w-4" />Edit Job</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {job.status === "Draft" && <DropdownMenuItem onClick={() => handleJobAction(job.id, 'submit_for_recruiter_approval')}><Check className="mr-2 h-4 w-4"/>Submit for Recruiter Approval</DropdownMenuItem>}
                        <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10" onClick={() => handleJobAction(job.id, 'delete_job')}><Trash2 className="mr-2 h-4 w-4" />Delete Job</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {displayedJobs.length === 0 && (
                <TableRow><TableCell colSpan={7} className="h-24 text-center text-muted-foreground">No job postings found matching your criteria.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
        {visibleJobsCount < filteredJobsMemo.length && (
          <CardFooter className="border-t pt-6 flex justify-center">
              <Button variant="outline" size="sm" onClick={handleLoadMoreJobs}>Load More Jobs</Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
