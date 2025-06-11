
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { ArrowRight, Briefcase, CalendarCheck, Lightbulb, UserCircle2, BotMessageSquare } from "lucide-react"; 
import Link from "next/link";
import Image from "next/image";
// Placeholder for AI flow import
// import { recommendJobs } from "@/ai/flows/job-recommendation";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

interface RecommendedJob {
  id: string;
  title: string;
  company: string;
}

export default function CandidateDashboardPage() {
  const { user, role } = useAuth();
  const { toast } = useToast();
  const [recommendedJobs, setRecommendedJobs] = useState<RecommendedJob[]>([]);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);

  useEffect(() => {
    const fetchRecommendations = async () => {
      if (user) {
        setIsLoadingRecommendations(true);
        try {
          // Simulate fetching embeddings and profile data
          const mockProfile = "Experienced software engineer with skills in React, Node.js, and cloud technologies.";
          const mockResumeText = "Extensive experience in full-stack development...";
          const mockJobEmbeddings = "Embeddings for various software engineering roles..."; // This would be complex data

          // In a real app, you would call your AI flow:
          // const result = await recommendJobs({
          //   candidateProfile: mockProfile,
          //   resumeText: mockResumeText,
          //   jobDetailsEmbeddings: mockJobEmbeddings,
          // });
          
          // For demo, using mock data directly as AI flow is not called here.
          await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API delay
          const mockRecommendedJobsData: RecommendedJob[] = [
            { id: "jobRec1", title: "Senior Frontend Developer", company: "Innovatech" },
            { id: "jobRec2", title: "Full Stack Engineer", company: "Solutions Co." },
            { id: "jobRec3", title: "React Native Developer", company: "MobileFirst Ltd." },
          ];
          // setRecommendedJobs(result.recommendedJobs.map((title, i) => ({id: `${i+1}`, title, company: "AI Recommended Inc."})));
          setRecommendedJobs(mockRecommendedJobsData);
          if (mockRecommendedJobsData.length > 0) {
            toast({ title: "Job Recommendations Loaded", description: "AI has found some jobs you might like!" });
          }
        } catch (error) {
          console.error("Error fetching job recommendations:", error);
          toast({ variant: "destructive", title: "Error", description: "Could not fetch job recommendations." });
        } finally {
          setIsLoadingRecommendations(false);
        }
      }
    };
    fetchRecommendations();
  }, [user, toast]);

  if (!user) {
    return <div className="flex h-screen items-center justify-center"><p>Loading user data...</p></div>;
  }

  const upcomingInterviews = [
    { id: "int1", jobTitle: "Software Engineer", company: "Tech Solutions Inc.", date: "2024-08-15", time: "10:00 AM" },
    { id: "int2", jobTitle: "Product Designer", company: "Creative Co.", date: "2024-08-20", time: "02:30 PM" },
  ];

  const recentApplications = [
    { id: "app1", jobTitle: "Frontend Developer", company: "Web Wizards", status: "Under Review" },
    { id: "app2", jobTitle: "UX Researcher", company: "UserFirst", status: "Interview Scheduled" },
  ];

  return (
    <div className="space-y-8">
      <Card className="shadow-xl bg-gradient-to-r from-primary/10 via-background to-background">
        <CardHeader>
          <CardTitle className="text-3xl">Welcome back, {user.name.split(" ")[0]}!</CardTitle>
          <CardDescription>Here's an overview of your job search journey.</CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-200 ease-in-out">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Interviews</CardTitle>
            <CalendarCheck className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {upcomingInterviews.length > 0 ? (
              <ul className="space-y-2">
                {upcomingInterviews.slice(0,2).map(interview => (
                  <li key={interview.id} className="text-sm">
                    <strong>{interview.jobTitle}</strong> at {interview.company}
                    <p className="text-xs text-muted-foreground">{interview.date} - {interview.time}</p>
                  </li>
                ))}
              </ul>
            ) : <p className="text-sm text-muted-foreground">No upcoming interviews.</p>}
          </CardContent>
          <CardFooter>
            <Button variant="outline" size="sm" asChild className="w-full">
              <Link href={`/dashboard/${role}/interviews`}>View All Interviews <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </CardFooter>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-200 ease-in-out">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Applications</CardTitle>
            <Briefcase className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
             {recentApplications.length > 0 ? (
              <ul className="space-y-2">
                {recentApplications.slice(0,2).map(app => (
                  <li key={app.id} className="text-sm">
                    <strong>{app.jobTitle}</strong> at {app.company}
                    <div className="text-xs"><Badge variant={app.status === 'Interview Scheduled' ? 'default' : 'secondary'} className={app.status === 'Interview Scheduled' ? 'bg-green-100 text-green-700 border-green-300' : ''}>{app.status}</Badge></div>
                  </li>
                ))}
              </ul>
            ) : <p className="text-sm text-muted-foreground">No recent applications.</p>}
          </CardContent>
           <CardFooter>
            <Button variant="outline" size="sm" asChild className="w-full">
              <Link href={`/dashboard/${role}/applications`}>View All Applications <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </CardFooter>
        </Card>
        
        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-200 ease-in-out">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profile Status</CardTitle>
            <UserCircle2 className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Your profile is looking great! Consider adding more skills or experiences.</p>
            <div className="w-full bg-muted rounded-full h-2.5 mt-2">
                <div className="bg-primary h-2.5 rounded-full" style={{width: "75%"}}></div>
            </div>
            <p className="text-xs text-muted-foreground mt-1 text-right">75% Complete</p>
          </CardContent>
          <CardFooter>
             <Button variant="default" size="sm" asChild className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
              <Link href={`/dashboard/${role}/profile`}>Update Profile <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </CardFooter>
        </Card>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl flex items-center"><Lightbulb className="mr-2 h-6 w-6 text-accent" /> AI Recommended Jobs</CardTitle>
          <CardDescription>Based on your profile, here are some jobs you might be interested in.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingRecommendations ? <p className="text-muted-foreground">Loading recommendations...</p> :
            recommendedJobs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recommendedJobs.map(job => (
                <Card key={job.id} className="shadow-md hover:shadow-lg transition-shadow duration-200 ease-in-out">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">{job.title}</CardTitle>
                    <CardDescription>{job.company}</CardDescription>
                  </CardHeader>
                  <CardFooter>
                    <Button variant="link" size="sm" asChild className="p-0 h-auto text-primary">
                      <Link href={`/jobs/${job.id}`}>View Job <ArrowRight className="ml-1 h-3 w-3" /></Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : <p className="text-sm text-muted-foreground">No job recommendations available at the moment. Make sure your profile is up-to-date!</p>}
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
            <CardTitle>Ready for your next interview?</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row items-center gap-6">
            <Image src="https://placehold.co/300x200.png" alt="AI Interview Simulation" width={300} height={200} className="rounded-lg shadow-sm" data-ai-hint="interview preparation"/>
            <div>
                <p className="text-muted-foreground mb-4">
                Engage in a realistic interview with our AI Simulator. Gain confidence and receive valuable feedback. 
                Our AI will ask you relevant questions and help you polish your answers.
                </p>
                <Button asChild size="lg">
                <Link href={`/dashboard/${role}/ai-interview`}><BotMessageSquare className="mr-2 h-5 w-5" /> Start AI Interview Simulation</Link>
                </Button>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
