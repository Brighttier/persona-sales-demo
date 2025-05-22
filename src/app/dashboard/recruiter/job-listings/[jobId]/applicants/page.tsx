
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
import { ArrowLeft, MoreHorizontal, Search, Eye, ShieldCheck, Edit3, CalendarPlus, UserX, Users } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation"; // useRouter can be used for programmatic navigation if needed

interface Applicant {
  id: string;
  name: string;
  avatar: string;
  applicationDate: string;
  aiMatchScore?: number;
  status: "New" | "Screening" | "Interview" | "Offer" | "Hired" | "Rejected" | "Withdrawn";
  email: string;
  skills: string[];
}

const mockApplicants: Applicant[] = [
  { id: "app1", name: "Alice Johnson", avatar: "https://placehold.co/100x100.png?text=AJ", applicationDate: "2024-07-25", aiMatchScore: 92, status: "New", email: "alice@example.com", skills: ["React", "Node.js", "TypeScript"] },
  { id: "app2", name: "Bob Williams", avatar: "https://placehold.co/100x100.png?text=BW", applicationDate: "2024-07-24", aiMatchScore: 85, status: "Screening", email: "bob@example.com", skills: ["Python", "Django", "SQL"] },
  { id: "app3", name: "Carol Davis", avatar: "https://placehold.co/100x100.png?text=CD", applicationDate: "2024-07-23", aiMatchScore: 78, status: "Interview", email: "carol@example.com", skills: ["Java", "Spring Boot", "Microservices"] },
  { id: "app4", name: "David Miller", avatar: "https://placehold.co/100x100.png?text=DM", applicationDate: "2024-07-22", status: "Rejected", email: "david@example.com", skills: ["PHP", "Laravel"] },
  { id: "app5", name: "Eve Brown", avatar: "https://placehold.co/100x100.png?text=EB", applicationDate: "2024-07-26", aiMatchScore: 95, status: "New", email: "eve@example.com", skills: ["JavaScript", "Vue.js", "Firebase"] },
];

// Mock job titles - in a real app, you'd fetch this based on jobId
const mockJobTitles: { [key: string]: string } = {
  "job1": "Software Engineer, Frontend",
  "job2": "Product Manager",
  "job3": "UX Designer",
  "job4": "Data Scientist",
  "job5": "DevOps Engineer",
};

export default function ViewApplicantsPage() {
  const params = useParams();
  const jobId = params.jobId as string;
  const { toast } = useToast();
  const router = useRouter();

  const jobTitle = mockJobTitles[jobId] || `Job ID: ${jobId}`; // Fallback to Job ID if not found

  const handleApplicantAction = (applicantName: string, action: string) => {
    toast({
      title: `Action: ${action}`,
      description: `Performed ${action} for ${applicantName}. (Placeholder)`,
    });
  };

  const getStatusPill = (status: Applicant["status"]) => {
    switch (status) {
      case "New": return <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-300">{status}</Badge>;
      case "Screening": return <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 border-yellow-300">{status}</Badge>;
      case "Interview": return <Badge variant="secondary" className="bg-purple-100 text-purple-700 border-purple-300">{status}</Badge>;
      case "Offer": return <Badge variant="default" className="bg-green-500 text-white border-green-700">Offer</Badge>;
      case "Hired": return <Badge variant="default" className="bg-green-700 text-white border-green-900">Hired</Badge>;
      case "Rejected": return <Badge variant="destructive" className="bg-red-100 text-red-700 border-red-300">{status}</Badge>;
      case "Withdrawn": return <Badge variant="outline">{status}</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-start">
        <Button variant="outline" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Job Listings
        </Button>
      </div>

      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center"><Users className="mr-2 h-6 w-6 text-primary" /> Applicants for: {jobTitle}</CardTitle>
          <CardDescription>Review and manage candidates who applied for this position.</CardDescription>
        </CardHeader>
      </Card>

      <Card className="shadow-lg">
        <CardHeader className="border-b">
          <div className="flex flex-col md:flex-row gap-2 justify-between items-center">
            <div className="relative flex-grow w-full md:w-auto">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search applicants by name or skills..." className="pl-8 w-full" />
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <Select>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Filter by Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="New">New</SelectItem>
                  <SelectItem value="Screening">Screening</SelectItem>
                  <SelectItem value="Interview">Interview</SelectItem>
                  <SelectItem value="Offer">Offer</SelectItem>
                  <SelectItem value="Hired">Hired</SelectItem>
                  <SelectItem value="Rejected">Rejected</SelectItem>
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
                <TableHead>Candidate</TableHead>
                <TableHead>Applied On</TableHead>
                <TableHead>AI Match</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockApplicants.map((applicant) => (
                <TableRow key={applicant.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={applicant.avatar} alt={applicant.name} data-ai-hint="person professional" />
                        <AvatarFallback>{applicant.name.split(" ").map(n => n[0]).join("").toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{applicant.name}</div>
                        <div className="text-xs text-muted-foreground">{applicant.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{applicant.applicationDate}</TableCell>
                  <TableCell>
                    {applicant.aiMatchScore ? (
                      <Badge variant={applicant.aiMatchScore > 80 ? "default" : "secondary"} className={applicant.aiMatchScore > 80 ? "bg-green-100 text-green-700 border-green-300" : ""}>
                        {applicant.aiMatchScore}%
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">N/A</span>
                    )}
                  </TableCell>
                  <TableCell>{getStatusPill(applicant.status)}</TableCell>
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
                        <DropdownMenuItem onClick={() => handleApplicantAction(applicant.name, 'View Profile')}>
                          <Eye className="mr-2 h-4 w-4" />View Profile
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleApplicantAction(applicant.name, 'AI Screen Candidate')}>
                          <ShieldCheck className="mr-2 h-4 w-4" />AI Screen
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleApplicantAction(applicant.name, 'Update Status')}>
                          <Edit3 className="mr-2 h-4 w-4" />Update Status
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleApplicantAction(applicant.name, 'Schedule Interview')}>
                          <CalendarPlus className="mr-2 h-4 w-4" />Schedule Interview
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10" onClick={() => handleApplicantAction(applicant.name, 'Reject Candidate')}>
                          <UserX className="mr-2 h-4 w-4" />Reject Candidate
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {mockApplicants.length === 0 && (
                 <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                        No applicants found for this job.
                    </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
