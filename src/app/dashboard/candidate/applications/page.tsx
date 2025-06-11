
"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowRight, Eye, Search } from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";

const mockApplications = [
  { id: "app1", jobId: "job1", jobTitle: "Software Engineer, Frontend", company: "Tech Solutions Inc.", dateApplied: "2024-07-21", status: "Under Review" },
  { id: "app2", jobId: "job2", jobTitle: "Product Manager", company: "Innovate Hub", dateApplied: "2024-07-19", status: "Interview Scheduled" },
  { id: "app3", jobId: "job3", jobTitle: "UX Designer", company: "Creative Designs Co.", dateApplied: "2024-07-16", status: "Shortlisted" },
  { id: "app4", jobId: "job4", jobTitle: "Data Scientist", company: "Analytics Corp.", dateApplied: "2024-07-23", status: "Offer Extended" },
  { id: "app5", jobId: "job5", jobTitle: "Marketing Specialist", company: "Growth Co.", dateApplied: "2024-07-10", status: "Not Selected" },
  { id: "app6", jobId: "job6", jobTitle: "Backend Developer", company: "Server Systems Ltd.", dateApplied: "2024-06-15", status: "Withdrawn" },
];

const getStatusPill = (status: string) => {
    switch (status.toLowerCase()) {
      case "offer extended":
        return <Badge className="bg-blue-100 text-blue-700 border-blue-300">{status}</Badge>;
      case "interview scheduled":
        return <Badge className="bg-green-100 text-green-700 border-green-300">{status}</Badge>;
      case "shortlisted":
        return <Badge className="bg-cyan-100 text-cyan-700 border-cyan-300">{status}</Badge>;
      case "under review":
        return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-300">{status}</Badge>;
      case "application submitted":
        return <Badge className="bg-purple-100 text-purple-700 border-purple-300">{status}</Badge>;
      case "not selected":
        return <Badge variant="destructive" className="bg-red-100 text-red-700 border-red-300">{status}</Badge>;
      case "withdrawn":
        return <Badge variant="secondary" className="bg-gray-100 text-gray-700 border-gray-300">{status}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

export default function CandidateApplicationsPage() {
  const allApplications = mockApplications;
  const activeApplications = mockApplications.filter(app => !["Not Selected", "Offer Extended", "Withdrawn"].includes(app.status));
  const archivedApplications = mockApplications.filter(app => ["Not Selected", "Offer Extended", "Withdrawn"].includes(app.status));

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
            <TableCell>{getStatusPill(app.status)}</TableCell>
            <TableCell className="text-right">
              <Button variant="ghost" size="sm" asChild>
                <Link href={`/jobs/${app.jobId}`}> {/* Assuming jobId matches job board ID */}
                  <Eye className="mr-2 h-4 w-4" /> View Job
                </Link>
              </Button>
            </TableCell>
          </TableRow>
        )) : (
          <TableRow>
            <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">No applications found in this category.</TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );

  return (
    <div className="space-y-6">
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl">My Job Applications</CardTitle>
          <CardDescription>Track the status of all your job applications in one place.</CardDescription>
        </CardHeader>
      </Card>
      
      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid w-full grid-cols-3 md:w-auto md:inline-flex mb-4">
          <TabsTrigger value="active">Active ({activeApplications.length})</TabsTrigger>
          <TabsTrigger value="all">All ({allApplications.length})</TabsTrigger>
          <TabsTrigger value="archived">Archived ({archivedApplications.length})</TabsTrigger>
        </TabsList>
        <Card className="shadow-lg">
          <TabsContent value="active" className="m-0">
            <CardContent className="p-0">
             {renderTable(activeApplications)}
            </CardContent>
          </TabsContent>
          <TabsContent value="all" className="m-0">
            <CardContent className="p-0">
              {renderTable(allApplications)}
            </CardContent>
          </TabsContent>
          <TabsContent value="archived" className="m-0">
            <CardContent className="p-0">
             {renderTable(archivedApplications)}
            </CardContent>
          </TabsContent>
        </Card>
      </Tabs>

      <Card className="shadow-lg">
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

