
"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Briefcase, MapPin, Search, Eye, Clock, ArrowRight, Star } from "lucide-react";
import Link from "next/link";

// Updated Mock job data
const jobListings = [
  {
    id: "1",
    title: "Senior SAP Basis Consultant",
    company: "TechCorp Inc.",
    location: "New York, Remote",
    type: "Full-time",
    postedDate: "2024-07-20",
    skills: ["SAP Basis", "HANA", "System Optimization", "Azure"],
    shortDescription: "Drive our SAP infrastructure and ensure seamless system performance. You'll be responsible for managing, maintaining, and optimizing SAP systems to support critical business functions. This role requires deep technical expertise and a proactive approach to system health and innovation.",
    experienceLevel: "Senior",
    salary: "$120,000 - $140,000",
    isFeatured: true,
  },
  {
    id: "2",
    title: "Product Manager",
    company: "Innovate Hub",
    location: "New York, NY",
    type: "Full-time",
    postedDate: "2024-07-18",
    skills: ["Agile", "Roadmap", "User Research", "Market Analysis"],
    shortDescription: "Lead product strategy, define product roadmaps, and work closely with engineering and design teams to deliver impactful products that meet user needs and business goals. Strong analytical and communication skills are essential.",
    experienceLevel: "Mid-Level",
    salary: "$100,000 - $130,000",
    isFeatured: false,
  },
  {
    id: "3",
    title: "UX Designer",
    company: "Creative Designs Co.",
    location: "San Francisco, CA",
    type: "Contract",
    postedDate: "2024-07-15",
    skills: ["Figma", "Prototyping", "User Testing", "Wireframing"],
    shortDescription: "Design intuitive and engaging user experiences for web and mobile applications. Conduct user research, create wireframes, prototypes, and high-fidelity mockups. Collaborate effectively with product managers and developers.",
    experienceLevel: "Junior",
    salary: "$70,000 - $90,000",
    isFeatured: false,
  },
];


export default function JobBoardPage() {

  const renderJobCard = (job: typeof jobListings[0]) => (
    <Card key={job.id} className="shadow-lg hover:shadow-xl transition-shadow duration-300 w-full overflow-hidden">
      <CardContent className="p-6 space-y-4">
        {job.isFeatured && (
          <Badge className="bg-blue-100 text-blue-700 border-blue-300 hover:bg-blue-100 mb-2 font-normal">
            <Star className="mr-1 h-3 w-3 fill-current" /> Featured Opportunity
          </Badge>
        )}
        <CardTitle className="text-2xl font-bold group">
           <Link href={`/jobs/${job.id}`} className="hover:text-primary transition-colors duration-200">
            {job.title}
          </Link>
        </CardTitle>

        <div className="flex flex-wrap items-center text-sm text-muted-foreground gap-x-3 gap-y-1">
          <div className="flex items-center">
            <Briefcase className="mr-1.5 h-4 w-4" /> {job.company}
          </div>
          <span className="text-muted-foreground/50">&#8226;</span>
          <div className="flex items-center">
            <MapPin className="mr-1.5 h-4 w-4" /> {job.location}
          </div>
           <span className="text-muted-foreground/50">&#8226;</span>
          <div className="flex items-center">
            <Clock className="mr-1.5 h-4 w-4" /> {job.type}
          </div>
        </div>

        <p className="text-sm text-foreground/80 line-clamp-2">{job.shortDescription}</p>

        <div className="flex flex-wrap gap-2 items-center">
          {job.skills.slice(0, 3).map(skill => (
            <Badge key={skill} variant="default" className="font-normal">{skill}</Badge>
          ))}
          {job.experienceLevel && <Badge variant="default" className="font-normal">{job.experienceLevel}</Badge>}
          {job.salary && <Badge variant="default" className="font-normal">{job.salary}</Badge>}
           {job.skills.length > 3 && <Badge variant="default" className="font-normal text-xs">+{job.skills.length - 3} more skills</Badge>}
        </div>
      </CardContent>
      <CardFooter className="bg-muted/30 px-6 py-4 flex justify-end items-center gap-3 border-t">
        <Button variant="outline" size="sm" asChild>
            <Link href={`/jobs/${job.id}`}>
                <Eye className="mr-2 h-4 w-4" /> View Details
            </Link>
        </Button>
        <Button asChild size="sm">
          <Link href={`/jobs/${job.id}/apply`}>
            Apply Now <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
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

      <div className="space-y-6">
        {jobListings.map(job => renderJobCard(job))}
         {jobListings.length === 0 && (
          <Card className="text-center py-10 shadow-lg">
            <CardContent>
                <Briefcase className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No job listings found. Try adjusting your search filters.</p>
            </CardContent>
          </Card>
        )}
      </div>
      {jobListings.length > 0 && (
        <div className="flex justify-center mt-8">
            <Button variant="outline">Load More Jobs (Placeholder)</Button>
        </div>
      )}
    </div>
  );
}
