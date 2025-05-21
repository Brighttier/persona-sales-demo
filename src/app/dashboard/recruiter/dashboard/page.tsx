"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Briefcase, Users, CheckSquare, TrendingUp, ArrowRight } from "lucide-react";
import Link from "next/link";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Badge } from "@/components/ui/badge";

const recentActivities = [
  { id: 1, type: "New Applicant", details: "John Doe applied for Software Engineer", time: "2h ago", jobId: "1" },
  { id:2, type: "Job Posted", details: "Senior UX Designer role is now live", time: "5h ago", jobId: "2" },
  { id: 3, type: "Interview Scheduled", details: "Jane Smith for Product Manager", time: "1 day ago", candidateId: "c1" },
];

const hiringPipelineData = [
  { name: 'Applied', count: 120 },
  { name: 'Screened', count: 80 },
  { name: 'Interviewed', count: 45 },
  { name: 'Offered', count: 15 },
  { name: 'Hired', count: 10 },
];

export default function RecruiterDashboardPage() {
  const { user } = useAuth();

  if (!user) {
    return <p>Loading user data...</p>;
  }

  return (
    <div className="space-y-8">
      <Card className="shadow-md bg-gradient-to-r from-primary/10 via-background to-background">
        <CardHeader>
          <CardTitle className="text-3xl">Recruiter Dashboard</CardTitle>
          <CardDescription>Manage your recruitment pipeline efficiently, {user.name.split(" ")[0]}.</CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Job Listings</CardTitle>
            <Briefcase className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">15</div>
            <p className="text-xs text-muted-foreground">+2 this week</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Applicants</CardTitle>
            <Users className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">253</div>
            <p className="text-xs text-muted-foreground">+50 today</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Interviews Scheduled</CardTitle>
            <CheckSquare className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">42</div>
            <p className="text-xs text-muted-foreground">+5 this week</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hiring Velocity</CardTitle>
            <TrendingUp className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12 days</div>
            <p className="text-xs text-muted-foreground">Average time-to-hire</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activities</CardTitle>
            <CardDescription>Stay updated with the latest actions.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              {recentActivities.map(activity => (
                <li key={activity.id} className="flex items-start space-x-3">
                  <div className="flex-shrink-0 pt-0.5">
                    {activity.type === "New Applicant" && <Users className="h-5 w-5 text-primary" />}
                    {activity.type === "Job Posted" && <Briefcase className="h-5 w-5 text-green-500" />}
                    {activity.type === "Interview Scheduled" && <CheckSquare className="h-5 w-5 text-blue-500" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{activity.details}</p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                   {activity.jobId && <Button variant="link" size="sm" asChild className="ml-auto p-0 h-auto"><Link href={`/dashboard/recruiter/job-listings/${activity.jobId}`}>View</Link></Button>}
                   {activity.candidateId && <Button variant="link" size="sm" asChild className="ml-auto p-0 h-auto"><Link href={`/dashboard/recruiter/candidates/${activity.candidateId}`}>View</Link></Button>}
                </li>
              ))}
            </ul>
          </CardContent>
           <CardFooter>
            <Button variant="outline" size="sm" className="w-full">View All Activities</Button>
          </CardFooter>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Hiring Pipeline Overview</CardTitle>
            <CardDescription>Number of candidates at each stage.</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={hiringPipelineData} margin={{ top: 5, right: 0, left: -25, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: "12px" }} />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Button size="lg" asChild className="w-full">
            <Link href={`/dashboard/${user.role}/job-listings/new`}><Briefcase className="mr-2 h-4 w-4"/> Post New Job</Link>
          </Button>
          <Button size="lg" variant="outline" asChild className="w-full">
            <Link href={`/dashboard/${user.role}/candidate-pool`}><Users className="mr-2 h-4 w-4"/> Browse Candidates</Link>
          </Button>
           <Button size="lg" variant="outline" asChild className="w-full">
            <Link href={`/dashboard/${user.role}/screening`}><CheckSquare className="mr-2 h-4 w-4"/> AI Screening Tools</Link>
          </Button>
           <Button size="lg" variant="secondary" asChild className="w-full">
            <Link href={`/dashboard/${user.role}/reports`}><TrendingUp className="mr-2 h-4 w-4"/> View Reports (Placeholder)</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
