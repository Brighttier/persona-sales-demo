"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, MoreHorizontal, Search, Eye, ShieldCheck, Edit3, CalendarPlus, UserX, Users, Loader2, FileText } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState, useMemo, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { 
  jobService, 
  applicationService, 
  type Job, 
  type JobApplication 
} from "@/lib/firestore";
import { functionUtils } from "@/lib/functions";

const ALL_APPLICATION_STATUSES: JobApplication["status"][] = ["pending", "reviewing", "shortlisted", "rejected", "hired"];

export default function ViewApplicantsPage() {
  const params = useParams();
  const jobId = params.jobId as string;
  const { toast } = useToast();
  const router = useRouter();
  const { user, role } = useAuth();

  const [job, setJob] = useState<Job | null>(null);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApplicationForStatus, setSelectedApplicationForStatus] = useState<JobApplication | null>(null);
  const [newStatus, setNewStatus] = useState<JobApplication["status"] | "">("");

  const [isScreeningLoading, setIsScreeningLoading] = useState(false);
  const [selectedApplicationForScreening, setSelectedApplicationForScreening] = useState<JobApplication | null>(null);

  const [isRejectConfirmOpen, setIsRejectConfirmOpen] = useState(false);
  const [applicationToUpdate, setApplicationToUpdate] = useState<JobApplication | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<JobApplication["status"] | "all">("all");

  // Load job and applications on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Load job details
        const jobData = await jobService.getById(jobId);
        if (!jobData) {
          toast({
            title: "Error",
            description: "Job not found",
            variant: "destructive"
          });
          router.push(`/dashboard/${role}/job-listings`);
          return;
        }
        setJob(jobData);

        // Load applications for this job
        const jobApplications = await applicationService.getByJob(jobId);
        setApplications(jobApplications);

      } catch (error) {
        console.error('Error loading data:', error);
        toast({
          title: "Error",
          description: "Failed to load job applications",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [jobId, role, router, toast]);

  const filteredApplications = useMemo(() => {
    return applications.filter(app => {
      const searchMatch = app.candidateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          app.candidateEmail.toLowerCase().includes(searchTerm.toLowerCase());
      const statusMatch = statusFilter === "all" || app.status === statusFilter;
      return searchMatch && statusMatch;
    });
  }, [applications, searchTerm, statusFilter]);

  const handleUpdateStatus = async () => {
    if (applicationToUpdate && newStatus) {
      try {
        await applicationService.update(applicationToUpdate.id!, { status: newStatus as JobApplication["status"] });
        
        // Update local state
        setApplications(prev => 
          prev.map(app => 
            app.id === applicationToUpdate.id 
              ? { ...app, status: newStatus as JobApplication["status"] } 
              : app
          )
        );
        
        toast({
          title: "Status Updated",
          description: `Application status changed to ${newStatus}`,
        });
        
        setSelectedApplicationForStatus(null);
        setApplicationToUpdate(null);
        setNewStatus("");
      } catch (error) {
        console.error('Error updating status:', error);
        toast({
          title: "Error",
          description: "Failed to update application status",
          variant: "destructive"
        });
      }
    }
  };

  const handleAIScreening = async (application: JobApplication) => {
    try {
      setIsScreeningLoading(true);
      setSelectedApplicationForScreening(application);
      
      // Trigger enhanced AI matching for this specific candidate
      if (job) {
        await functionUtils.matchCandidates(jobId, job.description, [application.candidateId]);
      }
      
      toast({
        title: "AI Screening Complete",
        description: `Enhanced AI screening completed for ${application.candidateName}`,
      });
      
      // Reload applications to get updated match scores
      const updatedApplications = await applicationService.getByJob(jobId);
      setApplications(updatedApplications);
      
    } catch (error: any) {
      console.error('Enhanced AI screening error:', error);
      toast({
        title: "AI Screening Failed",
        description: functionUtils.handleFunctionError(error),
        variant: "destructive"
      });
    } finally {
      setIsScreeningLoading(false);
      setSelectedApplicationForScreening(null);
    }
  };

  const getStatusBadge = (status: JobApplication["status"]) => {
    const statusConfig = {
      pending: { variant: "secondary" as const, className: "bg-gray-100 text-gray-700" },
      reviewing: { variant: "default" as const, className: "bg-blue-100 text-blue-700" },
      shortlisted: { variant: "default" as const, className: "bg-green-100 text-green-700" },
      rejected: { variant: "destructive" as const, className: "bg-red-100 text-red-700" },
      hired: { variant: "default" as const, className: "bg-emerald-100 text-emerald-700" }
    };

    const config = statusConfig[status] || statusConfig.pending;
    
    return (
      <Badge variant={config.variant} className={config.className}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getMatchScoreDisplay = (score: number | undefined) => {
    if (score === undefined) return <span className="text-muted-foreground">N/A</span>;
    
    const percentage = Math.round(score * 100);
    const color = percentage >= 80 ? "text-green-600" : 
                  percentage >= 60 ? "text-yellow-600" : "text-red-600";
    
    return <span className={cn("font-medium", color)}>{percentage}%</span>;
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading applications...</span>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p>Job not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="shadow-xl">
        <CardHeader>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/dashboard/${role}/job-listings`}>
                <ArrowLeft className="h-4 w-4" />
                Back to Job Listings
              </Link>
            </Button>
          </div>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center">
                <Users className="mr-2 h-6 w-6 text-primary" />
                Applicants for {job.title}
              </CardTitle>
              <CardDescription>
                {job.company} • {job.location} • {applications.length} applications
              </CardDescription>
            </div>
            <div className="flex gap-2 mt-4 md:mt-0">
              <Button 
                onClick={() => job && functionUtils.matchCandidates(jobId, job.description)}
                disabled={isScreeningLoading || !job}
              >
                {isScreeningLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <ShieldCheck className="mr-2 h-4 w-4" />
                )}
                Enhanced AI Screen All
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Filters */}
      <Card>
        <CardHeader className="border-b">
          <div className="flex flex-col md:flex-row gap-2 justify-between items-center">
            <div className="relative flex-grow w-full md:w-auto">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                className="pl-8 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as any)}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Filter by Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {ALL_APPLICATION_STATUSES.map(status => (
                    <SelectItem key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Candidate</TableHead>
                <TableHead>Applied Date</TableHead>
                <TableHead>AI Match Score</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredApplications.map((application) => (
                <TableRow key={application.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarFallback>
                          {application.candidateName.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{application.candidateName}</p>
                        <p className="text-sm text-muted-foreground">{application.candidateEmail}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {application.appliedAt?.toDate ? 
                      application.appliedAt.toDate().toLocaleDateString() : 
                      'N/A'
                    }
                  </TableCell>
                  <TableCell>{getMatchScoreDisplay(application.matchScore)}</TableCell>
                  <TableCell>{getStatusBadge(application.status)}</TableCell>
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
                        <DropdownMenuItem 
                          onClick={() => handleAIScreening(application)}
                          disabled={isScreeningLoading}
                        >
                          <ShieldCheck className="mr-2 h-4 w-4" />
                          AI Screen
                        </DropdownMenuItem>
                        {application.resumeUrl && (
                          <DropdownMenuItem asChild>
                            <a href={application.resumeUrl} target="_blank" rel="noopener noreferrer">
                              <FileText className="mr-2 h-4 w-4" />
                              View Resume
                            </a>
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem 
                          onClick={() => {
                            setSelectedApplicationForStatus(application);
                            setApplicationToUpdate(application);
                          }}
                        >
                          <Edit3 className="mr-2 h-4 w-4" />
                          Update Status
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-red-600"
                          onClick={() => {
                            setApplicationToUpdate(application);
                            setNewStatus("rejected");
                            setIsRejectConfirmOpen(true);
                          }}
                        >
                          <UserX className="mr-2 h-4 w-4" />
                          Reject
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {filteredApplications.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    {applications.length === 0 
                      ? "No applications received yet for this job." 
                      : "No applications found matching your criteria."
                    }
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Update Status Dialog */}
      <Dialog open={!!selectedApplicationForStatus} onOpenChange={() => setSelectedApplicationForStatus(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Application Status</DialogTitle>
            <DialogDescription>
              Change the status for {selectedApplicationForStatus?.candidateName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="status">New Status</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select new status" />
                </SelectTrigger>
                <SelectContent>
                  {ALL_APPLICATION_STATUSES.map(status => (
                    <SelectItem key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedApplicationForStatus(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateStatus} disabled={!newStatus}>
              Update Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Confirmation Dialog */}
      <Dialog open={isRejectConfirmOpen} onOpenChange={setIsRejectConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Rejection</DialogTitle>
            <DialogDescription>
              Are you sure you want to reject {applicationToUpdate?.candidateName}? This action can be undone later.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRejectConfirmOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleUpdateStatus}>
              Reject Application
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}