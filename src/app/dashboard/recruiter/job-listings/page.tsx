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
import { useState, useMemo, useEffect } from "react";
import { jobService, type Job } from "@/lib/firestore";
import { functionUtils } from "@/lib/functions";

export default function RecruiterJobListingsPage() {
  const { user, role } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | "all">("all");

  // Load jobs on component mount
  useEffect(() => {
    const loadJobs = async () => {
      try {
        setLoading(true);
        if (user) {
          // Load jobs created by this user (recruiter)
          const userJobs = await jobService.getByUser(user.uid);
          setJobs(userJobs);
        }
      } catch (error) {
        console.error('Error loading jobs:', error);
        toast({
          title: "Error",
          description: "Failed to load job listings",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    loadJobs();
  }, [user, toast]);

  const filteredJobs = useMemo(() => {
    return jobs.filter(job => {
      const searchMatch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (job.description || "").toLowerCase().includes(searchTerm.toLowerCase());
      const statusMatch = statusFilter === "all" || job.status === statusFilter;
      return searchMatch && statusMatch;
    });
  }, [jobs, searchTerm, statusFilter]);

  const handleJobAction = async (jobId: string, jobTitle: string, action: string) => {
    try {
      let message = "";
      
      switch(action) {
        case "edit_job": 
          router.push(`/dashboard/${role}/job-listings/edit/${jobId}`);
          return;
          
        case "ai_screen": 
          message = `Initiating AI screening for all applicants of "${jobTitle}"`;
          // Call the matching function
          try {
            await functionUtils.matchCandidates(jobId);
            message += " - AI screening completed successfully";
          } catch (error) {
            message += " - AI screening failed";
            throw error;
          }
          break;
          
        case "pause_job": 
          await jobService.update(jobId, { status: 'closed' });
          message = `Job "${jobTitle}" has been paused`;
          // Refresh the jobs list
          if (user) {
            const updatedJobs = await jobService.getByUser(user.uid);
            setJobs(updatedJobs);
          }
          break;
          
        case "activate_job": 
          await jobService.update(jobId, { status: 'active' });
          message = `Job "${jobTitle}" has been activated`;
          // Refresh the jobs list
          if (user) {
            const updatedJobs = await jobService.getByUser(user.uid);
            setJobs(updatedJobs);
          }
          break;
          
        case "delete_job": 
          if (window.confirm(`Are you sure you want to delete "${jobTitle}"? This action cannot be undone.`)) {
            await jobService.delete(jobId);
            message = `Job "${jobTitle}" has been deleted`;
            // Remove from local state
            setJobs(prev => prev.filter(job => job.id !== jobId));
          } else {
            return;
          }
          break;
          
        default: 
          message = `Performing ${action} on job "${jobTitle}"`;
      }
      
      toast({ 
        title: `Success`, 
        description: message
      });
    } catch (error: any) {
      console.error('Job action error:', error);
      toast({
        title: "Error",
        description: functionUtils.handleFunctionError(error),
        variant: "destructive"
      });
    }
  };

  const getStatusPill = (status: string) => {
    switch(status) {
      case "active": return <Badge className="bg-green-100 text-green-700 border-green-300">Active</Badge>;
      case "closed": return <Badge variant="secondary" className="bg-gray-100 text-gray-700 border-gray-300">Closed</Badge>;
      case "draft": return <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300">Draft</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p>Loading job listings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-xl">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl flex items-center">
              <Briefcase className="mr-2 h-6 w-6 text-primary"/> Job Listings Overview
            </CardTitle>
            <CardDescription>
              Manage your job postings, track applicants, and monitor their status.
            </CardDescription>
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
                placeholder="Search by title, description..."
                className="pl-8 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value)}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Filter by Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
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
                <TableHead>Company</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Applicants</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredJobs.map((job) => (
                <TableRow key={job.id}>
                  <TableCell className="font-medium">
                    <Link 
                      href={`/dashboard/${role}/job-listings/${job.id}/applicants`} 
                      className="hover:underline text-primary"
                    >
                      {job.title}
                    </Link>
                  </TableCell>
                  <TableCell>{job.company}</TableCell>
                  <TableCell>{job.location}</TableCell>
                  <TableCell>{getStatusPill(job.status)}</TableCell>
                  <TableCell>{job.applicantCount || 0}</TableCell>
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
                          <Link href={`/dashboard/${role}/job-listings/${job.id}/applicants`}>
                            <Users className="mr-2 h-4 w-4" />View Applicants
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleJobAction(job.id!, job.title, 'edit_job')}>
                          <Edit className="mr-2 h-4 w-4" />Edit Job
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleJobAction(job.id!, job.title, 'ai_screen')}>
                          <ShieldCheck className="mr-2 h-4 w-4" />AI Screen Applicants
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {job.status === "active" && (
                          <DropdownMenuItem onClick={() => handleJobAction(job.id!, job.title, 'pause_job')}>
                            <Pause className="mr-2 h-4 w-4" />Pause Job
                          </DropdownMenuItem>
                        )}
                        {job.status === "closed" && (
                          <DropdownMenuItem onClick={() => handleJobAction(job.id!, job.title, 'activate_job')}>
                            <Play className="mr-2 h-4 w-4" />Activate Job
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem 
                          className="text-destructive focus:text-destructive focus:bg-destructive/10" 
                          onClick={() => handleJobAction(job.id!, job.title, 'delete_job')}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />Delete Job
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {filteredJobs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    {jobs.length === 0 
                      ? "No job listings created yet. Create your first job posting!" 
                      : "No job listings found matching your criteria."
                    }
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
        {jobs.length > 0 && (
          <CardFooter className="border-t pt-6 flex justify-center">
            <p className="text-sm text-muted-foreground">
              Showing {filteredJobs.length} of {jobs.length} job listings
            </p>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}