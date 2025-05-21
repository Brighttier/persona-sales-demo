"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowRight, Eye } from "lucide-react";
import Link from "next/link";

const mockApplications = [
  { id: "app1", jobId: "1", jobTitle: "Software Engineer, Frontend", company: "Tech Solutions Inc.", dateApplied: "2024-07-21", status: "Under Review" },
  { id: "app2", jobId: "2", jobTitle: "Product Manager", company: "Innovate Hub", dateApplied: "2024-07-19", status: "Interview Scheduled" },
  { id: "app3", jobId: "3", jobTitle: "UX Designer", company: "Creative Designs Co.", dateApplied: "2024-07-16", status: "Application Submitted" },
  { id: "app4", jobId: "4", jobTitle: "Data Scientist", company: "Analytics Corp.", dateApplied: "2024-07-23", status: "Offer Extended" },
  { id: "app5", jobId: "5", jobTitle: "Marketing Specialist", company: "Growth Co.", dateApplied: "2024-07-10", status: "Rejected" },
];

const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
  switch (status.toLowerCase()) {
    case "interview scheduled":
    case "offer extended":
      return "default"; // Or a success variant if you have one
    case "under review":
    case "application submitted":
      return "secondary";
    case "rejected":
      return "destructive";
    default:
      return "outline";
  }
};

export default function CandidateApplicationsPage() {
  const allApplications = mockApplications;
  const activeApplications = mockApplications.filter(app => !["Rejected", "Offer Extended", "Withdrawn"].includes(app.status)); // Example filter
  const archivedApplications = mockApplications.filter(app => ["Rejected", "Offer Extended", "Withdrawn"].includes(app.status));

  const renderTable = (applications: typeof mockApplications) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Job Title</TableHead>
          <TableHead>Company</TableHead>
          <TableHead>Date Applied</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {applications.length > 0 ? applications.map((app) => (
          <TableRow key={app.id}>
            <TableCell className="font-medium">{app.jobTitle}</TableCell>
            <TableCell>{app.company}</TableCell>
            <TableCell>{app.dateApplied}</TableCell>
            <TableCell>
              <Badge variant={getStatusVariant(app.status)}>{app.status}</Badge>
            </TableCell>
            <TableCell className="text-right">
              <Button variant="ghost" size="sm" asChild>
                <Link href={`/jobs/${app.jobId}`}>
                  <Eye className="mr-2 h-4 w-4" /> View Job
                </Link>
              </Button>
            </TableCell>
          </TableRow>
        )) : (
          <TableRow>
            <TableCell colSpan={5} className="text-center h-24">No applications found.</TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );

  return (
    <div className="space-y-6">
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-2xl">My Job Applications</CardTitle>
          <CardDescription>Track the status of all your job applications in one place.</CardDescription>
        </CardHeader>
      </Card>
      
      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid w-full grid-cols-3 md:w-auto md:inline-flex">
          <TabsTrigger value="active">Active ({activeApplications.length})</TabsTrigger>
          <TabsTrigger value="all">All ({allApplications.length})</TabsTrigger>
          <TabsTrigger value="archived">Archived ({archivedApplications.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="active">
          <Card>
            <CardContent className="p-0">
             {renderTable(activeApplications)}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="all">
           <Card>
            <CardContent className="p-0">
              {renderTable(allApplications)}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="archived">
           <Card>
            <CardContent className="p-0">
             {renderTable(archivedApplications)}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card className="shadow-md">
        <CardHeader>
            <CardTitle>Looking for more opportunities?</CardTitle>
        </CardHeader>
        <CardContent>
            <p className="text-muted-foreground mb-4">
                Don't stop now! Explore thousands of job openings on our public job board.
            </p>
            <Button asChild>
            <Link href="/jobs">
                Explore Job Board <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            </Button>
        </CardContent>
      </Card>
    </div>
  );
}
