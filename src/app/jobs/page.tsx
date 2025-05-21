
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Briefcase, MapPin, Search } from "lucide-react";
import Link from "next/link";

// Mock job data
const jobListings = [
  { id: "1", title: "Software Engineer, Frontend", company: "Tech Solutions Inc.", location: "Remote", type: "Full-time", postedDate: "2024-07-20", skills: ["React", "TypeScript", "Next.js"] },
  { id: "2", title: "Product Manager", company: "Innovate Hub", location: "New York, NY", type: "Full-time", postedDate: "2024-07-18", skills: ["Agile", "Roadmap", "User Research"] },
  { id: "3", title: "UX Designer", company: "Creative Designs Co.", location: "San Francisco, CA", type: "Contract", postedDate: "2024-07-15", skills: ["Figma", "Prototyping", "User Testing"] },
  { id: "4", title: "Data Scientist", company: "Analytics Corp.", location: "Remote", type: "Full-time", postedDate: "2024-07-22", skills: ["Python", "Machine Learning", "SQL"] },
  { id: "5", title: "Marketing Specialist", company: "Growth Co.", location: "Austin, TX", type: "Part-time", postedDate: "2024-07-19", skills: ["SEO", "Content Marketing", "Social Media"] },
];

export default function JobBoardPage() {
  return (
    <div className="space-y-8">
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl font-bold">Find Your Next Opportunity</CardTitle>
          <CardDescription>Browse through thousands of open positions or use our advanced filters to narrow down your search.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {jobListings.map((job) => (
          <Card key={job.id} className="flex flex-col shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader>
              <CardTitle className="text-xl">{job.title}</CardTitle>
              <CardDescription>{job.company}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow space-y-2">
              <div className="flex items-center text-sm text-muted-foreground">
                <MapPin className="mr-2 h-4 w-4" />
                {job.location}
              </div>
              <div className="flex items-center text-sm text-muted-foreground">
                <Briefcase className="mr-2 h-4 w-4" />
                {job.type}
              </div>
              <div className="pt-2">
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
    </div>
  );
}

    