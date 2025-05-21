
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Briefcase, Users, UserCheck, BarChart3 as BarChartIcon, ArrowRight, CalendarCheck, PieChart as PieChartIcon, MessageSquare } from "lucide-react";
import Link from "next/link";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const teamStats = {
  openPositions: 5,
  candidatesInPipeline: 45,
  interviewsToday: 3,
  avgTimeToFill: "28 days", // This might come from analytics
  pendingApprovals: 2, // New stat
  feedbackDue: 8, // New stat
};

const monthlyHiresData = [
  { month: 'Jan', hired: 2, fill: 'hsl(var(--chart-1))' }, { month: 'Feb', hired: 3, fill: 'hsl(var(--chart-1))' },
  { month: 'Mar', hired: 1, fill: 'hsl(var(--chart-1))' }, { month: 'Apr', hired: 4, fill: 'hsl(var(--chart-1))' },
  { month: 'May', hired: 2, fill: 'hsl(var(--chart-1))' }, { month: 'Jun', hired: 5, fill: 'hsl(var(--chart-1))' },
];

const candidateSourceData = [
  { name: 'Referrals', value: 40, fill: 'hsl(var(--chart-1))' }, { name: 'Job Boards', value: 30, fill: 'hsl(var(--chart-2))' },
  { name: 'LinkedIn', value: 20, fill: 'hsl(var(--chart-3))' }, { name: 'Career Site', value: 10, fill: 'hsl(var(--chart-4))' },
];

export default function HiringManagerDashboardPage() {
  const { user, role } = useAuth();

  if (!user) {
    return <div className="flex h-screen items-center justify-center"><p>Loading user data...</p></div>;
  }

  return (
    <div className="space-y-8">
      <Card className="shadow-md bg-gradient-to-r from-primary/10 via-background to-background">
        <CardHeader>
          <CardTitle className="text-3xl">Hiring Manager Dashboard</CardTitle>
          <CardDescription>Overview of your team's hiring activities, {user.name.split(" ")[0]}.</CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Positions</CardTitle>
            <Briefcase className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamStats.openPositions}</div>
            <Link href={`/dashboard/${role}/job-approvals`} className="text-xs text-primary hover:underline mt-1 block">Review Jobs</Link>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Job Approvals</CardTitle>
            <UserCheck className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamStats.pendingApprovals}</div>
             <Link href={`/dashboard/${role}/job-approvals`} className="text-xs text-primary hover:underline mt-1 block">Approve Now</Link>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Interviews Today</CardTitle>
            <CalendarCheck className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamStats.interviewsToday}</div>
            <Link href={`/dashboard/${role}/interviews`} className="text-xs text-primary hover:underline mt-1 block">View Schedule</Link>
          </CardContent>
        </Card>
        {/* Remaining cards (candidates, feedback, time to fill) could be in a second row or combined */}
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Candidates in Pipeline</CardTitle>
            <Users className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamStats.candidatesInPipeline}</div>
            <p className="text-xs text-muted-foreground mt-1">Across all open positions</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Interview Feedback Due</CardTitle>
            <MessageSquare className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamStats.feedbackDue}</div>
            <Link href={`/dashboard/${role}/interviews`} className="text-xs text-primary hover:underline mt-1 block">Provide Feedback</Link>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Time to Fill</CardTitle>
            <BarChartIcon className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamStats.avgTimeToFill}</div>
            <Link href={`/dashboard/${role}/analytics`} className="text-xs text-primary hover:underline mt-1 block">More Analytics</Link>
          </CardContent>
        </Card>
      </div>


      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Monthly Hires</CardTitle>
             <CardDescription>Number of candidates hired each month by your team.</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyHiresData} margin={{ top: 5, right: 0, left: -25, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" fontSize={12}/>
                <YAxis fontSize={12}/>
                <Tooltip wrapperStyle={{fontSize: "12px"}}/>
                <Bar dataKey="hired" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
         <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Top Candidate Sources</CardTitle>
            <CardDescription>Where your best candidates are coming from.</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={candidateSourceData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} labelLine={false} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} fontSize={12}>
                    {candidateSourceData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.fill} />))}
                </Pie>
                <Tooltip wrapperStyle={{fontSize: "12px"}}/>
                <Legend wrapperStyle={{fontSize: "12px"}}/>
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Key Actions & Quick Links</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
             <Button size="lg" variant="default" asChild className="w-full">
                <Link href={`/dashboard/${role}/job-approvals`}><UserCheck className="mr-2 h-4 w-4"/> Review Job Postings</Link>
             </Button>
             <Button size="lg" variant="outline" asChild className="w-full">
                <Link href={`/dashboard/${role}/interviews`}><CalendarCheck className="mr-2 h-4 w-4"/> Manage Interviews</Link>
             </Button>
             <Button size="lg" variant="outline" asChild className="w-full">
                <Link href={`/dashboard/${role}/analytics`}><BarChartIcon className="mr-2 h-4 w-4"/> View Hiring Analytics</Link>
             </Button>
          </CardContent>
        </Card>
    </div>
  );
}

    
