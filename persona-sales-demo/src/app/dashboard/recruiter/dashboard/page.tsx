
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Briefcase, Users, CheckSquare, TrendingUp, ArrowRight, MessageSquare, UserPlus, Search, CalendarCheck } from "lucide-react"; 
import Link from "next/link";
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Badge } from "@/components/ui/badge";
import { useState } from "react"; // Added useState

const initialRecentActivities = [
  { id: 1, type: "New Applicant", details: "John Doe applied for Software Engineer", time: "2h ago", jobId: "job1", candidateId: "cand1" },
  { id: 2, type: "Job Posted", details: "Senior UX Designer role is now live", time: "5h ago", jobId: "job2" },
  { id: 3, type: "Interview Scheduled", details: "Jane Smith for Product Manager", time: "1 day ago", candidateId: "cand2", jobId: "job3" },
  { id: 4, type: "AI Screening Complete", details: "Screening for 'Backend Developer' finished", time: "2 days ago", jobId: "job4"},
  { id: 5, type: "New Applicant", details: "Alice Brown applied for Data Scientist", time: "3 days ago", jobId: "job4", candidateId: "cand3" },
  { id: 6, type: "Job Status Updated", details: "'Product Manager' moved to 'Interviewing'", time: "3 days ago", jobId: "job3" },
  { id: 7, type: "New Message", details: "Message from Bob on 'Software Engineer' application", time: "4 days ago", candidateId: "cand4", jobId: "job1" },
  { id: 8, type: "Job Approved", details: "Hiring Manager approved 'Marketing Lead'", time: "5 days ago", jobId: "job5" },
];

const hiringPipelineData = [
  { name: 'Applied', count: 120, fill: 'hsl(var(--chart-1))' },
  { name: 'Screened', count: 80, fill: 'hsl(var(--chart-2))' },
  { name: 'Interview', count: 45, fill: 'hsl(var(--chart-3))' },
  { name: 'Offer', count: 15, fill: 'hsl(var(--chart-4))' },
  { name: 'Hired', count: 10, fill: 'hsl(var(--chart-5))' },
];

const ACTIVITIES_TO_SHOW_INITIALLY = 4;

export default function RecruiterDashboardPage() {
  const { user, role } = useAuth();
  const [showAllActivities, setShowAllActivities] = useState(false);

  if (!user) {
    return <div className="flex h-screen items-center justify-center"><p>Loading user data...</p></div>;
  }

  const displayedActivities = showAllActivities ? initialRecentActivities : initialRecentActivities.slice(0, ACTIVITIES_TO_SHOW_INITIALLY);

  return (
    <div className="space-y-8">
      <Card className="shadow-xl bg-gradient-to-r from-primary/10 via-background to-background">
        <CardHeader>
          <CardTitle className="text-3xl">Recruiter Dashboard</CardTitle>
          <CardDescription>Manage your recruitment pipeline efficiently, {user.name.split(" ")[0]}.</CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-200 ease-in-out">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Job Listings</CardTitle>
            <Briefcase className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">15</div>
            <p className="text-xs text-muted-foreground">+2 this week</p>
            <Link href={`/dashboard/${role}/job-listings`} className="text-xs text-primary hover:underline mt-1 block">Manage Jobs</Link>
          </CardContent>
        </Card>
        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-200 ease-in-out">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Applicants (Today)</CardTitle>
            <UserPlus className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">53</div>
            <p className="text-xs text-muted-foreground">Across all active jobs</p>
             <Link href={`/dashboard/${role}/candidate-pool`} className="text-xs text-primary hover:underline mt-1 block">View Candidates</Link>
          </CardContent>
        </Card>
        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-200 ease-in-out">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Interviews This Week</CardTitle>
            <CalendarCheck className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">3 completed, 9 upcoming</p>
            <p className="text-xs text-muted-foreground mt-1">Manage via Job Listings</p>
          </CardContent>
        </Card>
        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-200 ease-in-out">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Time-to-Fill</CardTitle>
            <TrendingUp className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">28 days</div>
            <p className="text-xs text-muted-foreground">Last 90 days</p>
            <p className="text-xs text-muted-foreground mt-1">Reports (Placeholder)</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Recent Activities</CardTitle>
            <CardDescription>Stay updated with the latest actions.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              {displayedActivities.map(activity => (
                <li key={activity.id} className="flex items-start space-x-3">
                  <div className="flex-shrink-0 pt-0.5">
                    {activity.type === "New Applicant" && <UserPlus className="h-5 w-5 text-primary" />}
                    {activity.type === "Job Posted" && <Briefcase className="h-5 w-5 text-green-500" />}
                    {activity.type === "Interview Scheduled" && <CheckSquare className="h-5 w-5 text-blue-500" />}
                    {activity.type === "AI Screening Complete" && <Search className="h-5 w-5 text-purple-500" />}
                    {activity.type === "Job Status Updated" && <TrendingUp className="h-5 w-5 text-orange-500" />}
                    {activity.type === "New Message" && <MessageSquare className="h-5 w-5 text-teal-500" />}
                    {activity.type === "Job Approved" && <CheckSquare className="h-5 w-5 text-lime-500" />}
                  </div>
                  <div className="flex-grow">
                    <p className="text-sm font-medium">{activity.details}</p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                   {activity.jobId && <Button variant="link" size="xs" asChild className="ml-auto p-0 h-auto text-xs"><Link href={`/dashboard/${role}/job-listings`}>View Job</Link></Button>}
                </li>
              ))}
            </ul>
          </CardContent>
           <CardFooter>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full" 
              onClick={() => setShowAllActivities(!showAllActivities)}
              disabled={initialRecentActivities.length <= ACTIVITIES_TO_SHOW_INITIALLY && !showAllActivities}
            >
              {showAllActivities ? "Show Fewer Activities" : "View All Activities"}
            </Button>
          </CardFooter>
        </Card>
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Hiring Pipeline Overview</CardTitle>
            <CardDescription>Number of candidates at each stage (all jobs).</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsBarChart data={hiringPipelineData} margin={{ top: 5, right: 0, left: -25, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip wrapperStyle={{fontSize: "12px"}}/>
                <Bar dataKey="count" radius={[4, 4, 0, 0]} />
              </RechartsBarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Button size="lg" asChild className="w-full">
            <Link href={`/dashboard/${role}/job-listings`}><Briefcase className="mr-2 h-4 w-4"/> Manage Job Listings</Link>
          </Button>
          <Button size="lg" variant="outline" asChild className="w-full">
            <Link href={`/dashboard/${role}/candidate-pool`}><Users className="mr-2 h-4 w-4"/> Browse Candidate Pool</Link>
          </Button>
           <Button size="lg" variant="outline" asChild className="w-full">
            <Link href={`/dashboard/${role}/screening`}><Search className="mr-2 h-4 w-4"/> AI Screening Tools</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
