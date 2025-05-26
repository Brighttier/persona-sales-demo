
"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Briefcase, MapPin, Search, Eye, Clock, ArrowRight, Star } from "lucide-react";
import Link from "next/link";
import { useState, useEffect, useMemo } from "react";

interface JobListing {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  postedDate: string;
  skills: string[];
  shortDescription: string;
  experienceLevel: string;
  salary?: string;
  isFeatured?: boolean;
}

const allMockJobListings: JobListing[] = [
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
  {
    id: "4",
    title: "Data Analyst",
    company: "Number Crunchers Ltd.",
    location: "Chicago, IL",
    type: "Full-time",
    postedDate: "2024-07-12",
    skills: ["SQL", "Tableau", "Python", "Excel"],
    shortDescription: "Analyze complex datasets to provide actionable insights and support data-driven decision-making across various departments. Develop dashboards and reports.",
    experienceLevel: "Mid-Level",
    salary: "$80,000 - $100,000",
    isFeatured: false,
  },
  {
    id: "5",
    title: "DevOps Engineer",
    company: "CloudNet Solutions",
    location: "Remote",
    type: "Full-time",
    postedDate: "2024-07-10",
    skills: ["AWS", "Kubernetes", "Docker", "Terraform", "CI/CD"],
    shortDescription: "Design, implement, and manage our cloud infrastructure and CI/CD pipelines. Ensure system reliability, scalability, and security. Automate everything.",
    experienceLevel: "Senior",
    salary: "$130,000 - $160,000",
    isFeatured: true,
  },
  {
    id: "6",
    title: "Customer Support Specialist",
    company: "HelpDesk Heroes",
    location: "Austin, TX (Hybrid)",
    type: "Full-time",
    postedDate: "2024-07-08",
    skills: ["Communication", "Problem-Solving", "Zendesk", "Empathy"],
    shortDescription: "Provide exceptional support to our customers via multiple channels. Troubleshoot issues, answer questions, and ensure customer satisfaction. Patience is key.",
    experienceLevel: "Entry-Level",
    salary: "$50,000 - $65,000",
    isFeatured: false,
  },
   {
    id: "7",
    title: "Backend Developer (Node.js)",
    company: "API Masters",
    location: "Remote",
    type: "Full-time",
    postedDate: "2024-07-05",
    skills: ["Node.js", "Express", "MongoDB", "REST APIs", "Microservices"],
    shortDescription: "Build and maintain scalable backend services and APIs using Node.js. Work with databases like MongoDB and PostgreSQL. Focus on performance and reliability.",
    experienceLevel: "Mid-Level",
    salary: "$95,000 - $115,000",
    isFeatured: false,
  },
  {
    id: "8",
    title: "Digital Marketing Manager",
    company: "Growth Hackers Ltd.",
    location: "Remote",
    type: "Full-time",
    postedDate: "2024-07-22",
    skills: ["SEO", "SEM", "Content Marketing", "Social Media"],
    shortDescription: "Develop and execute comprehensive digital marketing strategies to drive growth and brand awareness. Manage campaigns across SEO, SEM, social media, and email.",
    experienceLevel: "Mid-Level",
    salary: "$90,000 - $110,000",
    isFeatured: false,
  },
  {
    id: "9",
    title: "AI Research Scientist",
    company: "FutureAI Corp",
    location: "Boston, MA",
    type: "Full-time",
    postedDate: "2024-07-25",
    skills: ["Machine Learning", "Deep Learning", "Python", "NLP"],
    shortDescription: "Conduct cutting-edge research in AI and Machine Learning. Develop novel algorithms and contribute to our core AI products. PhD preferred.",
    experienceLevel: "Senior",
    isFeatured: true,
  },
];

const INITIAL_JOBS_TO_SHOW = 3;
const JOBS_INCREMENT_COUNT = 2;


export default function JobBoardPage() {
  const [appliedKeywords, setAppliedKeywords] = useState("");
  const [appliedLocation, setAppliedLocation] = useState("");
  const [appliedJobType, setAppliedJobType] = useState<string | "all">("all");

  const [visibleJobsCount, setVisibleJobsCount] = useState(INITIAL_JOBS_TO_SHOW);

  const handleKeywordsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAppliedKeywords(e.target.value);
  };

  const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAppliedLocation(e.target.value);
  };

  const handleJobTypeChange = (value: string) => {
    setAppliedJobType(value);
  };

  useEffect(() => {
    // Reset pagination when filters change
    setVisibleJobsCount(INITIAL_JOBS_TO_SHOW);
  }, [appliedKeywords, appliedLocation, appliedJobType]);

  const filteredJobs = useMemo(() => {
    return allMockJobListings.filter(job => {
      const keywordsLower = appliedKeywords.toLowerCase();
      const locationLower = appliedLocation.toLowerCase();

      const titleMatch = job.title.toLowerCase().includes(keywordsLower);
      const companyMatch = job.company.toLowerCase().includes(keywordsLower);
      const skillsMatch = job.skills.some(skill => skill.toLowerCase().includes(keywordsLower));
      const descriptionMatch = job.shortDescription.toLowerCase().includes(keywordsLower);

      const keywordsCondition = !appliedKeywords || titleMatch || companyMatch || skillsMatch || descriptionMatch;

      const locationCondition = !appliedLocation || job.location.toLowerCase().includes(locationLower);

      const jobTypeCondition = appliedJobType === "all" || job.type.toLowerCase() === appliedJobType.toLowerCase();

      return keywordsCondition && locationCondition && jobTypeCondition;
    });
  }, [appliedKeywords, appliedLocation, appliedJobType]);

  const displayedJobs = useMemo(() => {
    return filteredJobs.slice(0, visibleJobsCount);
  }, [filteredJobs, visibleJobsCount]);

  const handleLoadMore = () => {
    const newVisibleCount = Math.min(visibleJobsCount + JOBS_INCREMENT_COUNT, filteredJobs.length);
    setVisibleJobsCount(newVisibleCount);
  };

  const renderJobCard = (job: JobListing) => (
    <Card key={job.id} className="shadow-lg hover:shadow-xl transition-shadow duration-300 w-full overflow-hidden">
      <CardContent className="p-6 space-y-4">
        {job.isFeatured && (
          <Badge className="bg-blue-100 text-blue-700 border-blue-300 hover:bg-blue-100 mb-2 font-semibold">
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
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end pt-6 border-t">
          <div className="md:col-span-2 space-y-2">
            <label htmlFor="keywords" className="text-sm font-medium">Keywords</label>
            <Input
              id="keywords"
              placeholder="Job title, skills, or company"
              className="w-full"
              value={appliedKeywords}
              onChange={handleKeywordsChange}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="location" className="text-sm font-medium">Location</label>
            <Input
              id="location"
              placeholder="City, state, or remote"
              className="w-full"
              value={appliedLocation}
              onChange={handleLocationChange}
            />
          </div>
          <div className="space-y-2 md:col-span-1">
             <label htmlFor="jobType" className="text-sm font-medium">Job Type</label>
            <Select value={appliedJobType} onValueChange={handleJobTypeChange}>
              <SelectTrigger id="jobType">
                <SelectValue placeholder="All Job Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Job Types</SelectItem>
                <SelectItem value="Full-time">Full-time</SelectItem>
                <SelectItem value="Part-time">Part-time</SelectItem>
                <SelectItem value="Contract">Contract</SelectItem>
                <SelectItem value="Internship">Internship</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {/* Removed explicit Search Jobs button for live filtering */}
        </CardContent>
      </Card>

      <div className="space-y-6">
        {displayedJobs.map(job => renderJobCard(job))}
         {displayedJobs.length === 0 && (
          <Card className="text-center py-10 shadow-lg">
            <CardContent>
                <Briefcase className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No job listings found matching your criteria.</p>
            </CardContent>
          </Card>
        )}
      </div>
      {visibleJobsCount < filteredJobs.length && (
        <div className="flex justify-center mt-8">
            <Button variant="outline" onClick={handleLoadMore}>Load More Jobs</Button>
        </div>
      )}
    </div>
  );
}

