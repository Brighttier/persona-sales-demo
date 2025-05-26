
"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Briefcase, LayoutGrid, List, MapPin, Search, Eye } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/utils";

// Mock job data
const jobListings = [
  { id: "1", title: "Software Engineer, Frontend", company: "Tech Solutions Inc.", location: "Remote", type: "Full-time", postedDate: "2024-07-20", skills: ["React", "TypeScript", "Next.js"] },
  { id: "2", title: "Product Manager", company: "Innovate Hub", location: "New York, NY", type: "Full-time", postedDate: "2024-07-18", skills: ["Agile", "Roadmap", "User Research"] },
  { id: "3", title: "UX Designer", company: "Creative Designs Co.", location: "San Francisco, CA", type: "Contract", postedDate: "2024-07-15", skills: ["Figma", "Prototyping", "User Testing"] },
  { id: "4", title: "Data Scientist", company: "Analytics Corp.", location: "Remote", type: "Full-time", postedDate: "2024-07-22", skills: ["Python", "Machine Learning", "SQL"] },
  { id: "5", title: "Marketing Specialist", company: "Growth Co.", location: "Austin, TX", type: "Part-time", postedDate: "2024-07-19", skills: ["SEO", "Content Marketing", "Social Media"] },
];

type ViewMode = 'card' | 'list';

export default function JobBoardPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('card');

  const renderCardView = () => (
    <div className="space-y-6"> {/* Changed from grid to space-y-6 for full-width cards */}
      {jobListings.map((job) => (
        <Card key={job.id} className="shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="text-xl">{job.title}</CardTitle>
            <CardDescription>{job.company}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center text-sm text-muted-foreground">
              <MapPin className="mr-2 h-4 w-4" />
              {job.location}
            </div>
            <div className="flex items-center text-sm text-muted-foreground">
              <Briefcase className="mr-2 h-4 w-4" />
              {job.type}
            </div>
            <div className="pt-2">
              <span className="text-sm font-medium text-foreground">Key Skills: </span>
              {job.skills.map(skill => (
                <Badge key={skill} variant="secondary" className="mr-1 mb-1">{skill}</Badge>
              ))}
            </div>
          </CardContent>
          <CardFooter className="flex justify-between items-center">
            <p className="text-xs text-muted-foreground">Posted: {job.postedDate}</p>
            <Button asChild variant="default" size="sm">
              <Link href={`/jobs/${job.id}`}>View Details</Link>
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );

  const renderListView = () => (
    <Card className="shadow-lg">
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Job Title</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Posted</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {jobListings.map((job) => (
              <TableRow key={job.id}>
                <TableCell className="font-medium">
                  <Link href={`/jobs/${job.id}`} className="hover:underline text-primary">
                    {job.title}
                  </Link>
                </TableCell>
                <TableCell>{job.company}</TableCell>
                <TableCell>{job.location}</TableCell>
                <TableCell>{job.type}</TableCell>
                <TableCell>{job.postedDate}</TableCell>
                <TableCell className="text-right">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/jobs/${job.id}`}>
                      <Eye className="mr-1 h-4 w-4" /> View
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );


  return (
    <div className="space-y-8">
      <Card className="shadow-xl">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div>
              <CardTitle className="text-3xl font-bold">Find Your Next Opportunity</CardTitle>
              <CardDescription>Browse through thousands of open positions or use our advanced filters to narrow down your search.</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant={viewMode === 'card' ? 'default' : 'outline'} size="icon" onClick={() => setViewMode('card')} title="Card View">
                <LayoutGrid className="h-5 w-5" />
              </Button>
              <Button variant={viewMode === 'list' ? 'default' : 'outline'} size="icon" onClick={() => setViewMode('list')} title="List View">
                <List className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end pt-6 border-t">
          <div className="md:col-span-2 space-y-2">
            <label htmlFor="keywords" className="text-sm font-medium">Keywords</label>
            <Input id="keywords" placeholder="Job title, skills, or company" className="w-full" />
          </div>
          <div className="space-y-2">
            <label htmlFor="location" className="text-sm font-medium">Location</label>
            <Input id="location" placeholder="City, state, or remote" className="w-full" />
          </div>
          <div className="space-y-2">
             <label htmlFor="jobType" className="text-sm font-medium">Job Type</label>
            <Select>
              <SelectTrigger id="jobType">
                <SelectValue placeholder="All Job Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Job Types</SelectItem>
                <SelectItem value="full-time">Full-time</SelectItem>
                <SelectItem value="part-time">Part-time</SelectItem>
                <SelectItem value="contract">Contract</SelectItem>
                <SelectItem value="internship">Internship</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button className="md:col-start-4">
            <Search className="mr-2 h-4 w-4" /> Search Jobs
          </Button>
        </CardContent>
      </Card>

      {viewMode === 'card' ? renderCardView() : renderListView()}
    </div>
  );
}
