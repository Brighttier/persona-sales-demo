"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Briefcase, Users, CheckSquare, BarChart3, UserCheck, ArrowRight } from "lucide-react";
import Link from "next/link";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const teamStats = {
  openPositions: 5,
  candidatesInPipeline: 45,
  interviewsToday: 3,
  avgTimeToFill: "28 days",
};

const hiringPerformanceData = [
  { month: 'Jan', hired: 2 },
  { month: 'Feb', hired: 3 },
  { month: 'Mar', hired: 1 },
  { month: 'Apr', hired: 4 },
  { month: 'May', hired: 2 },
  { month: 'Jun', hired: 5 },
];

const candidateSourceData = [
  { name: 'Referrals', value: 400 },
  { name: 'Job Boards', value: 300 },
  { name: 'LinkedIn', value: 300 },
  { name: 'Career Site', value: 200 },
];
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];


export default function HiringManagerDashboardPage() {
  const { user } = useAuth();

  if (!user) {
    return <p>Loading user data...</p>;
  }

  return (
    <div className="space-y-8">
      <Card className="shadow-md bg-gradient-to-r from-primary/10 via-background to-background">
        <CardHeader>
          <CardTitle className="text-3xl">Hiring Manager Dashboard</CardTitle>
          <CardDescription>Overview of your team's hiring activities, {user.name.split(" ")[0]}.</CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Positions</CardTitle>
            <Briefcase className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamStats.openPositions}</div>
            <Link href={`/dashboard/${user.role}/job-approvals`} className="text-xs text-primary hover:underline">View Jobs</Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Candidates in Pipeline</CardTitle>
            <Users className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamStats.candidatesInPipeline}</div>
             <Link href={`/dashboard/${user.role}/interviews`} className="text-xs text-primary hover:underline">Track Progress</Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Interviews Today</CardTitle>
            <UserCheck className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamStats.interviewsToday}</div>
            <Link href={`/dashboard/${user.role}/interviews`} className="text-xs text-primary hover:underline">View Schedule</Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Time to Fill</CardTitle>
            <BarChart3 className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamStats.avgTimeToFill}</div>
            <Link href={`/dashboard/${user.role}/analytics`} className="text-xs text-primary hover:underline">More Analytics</Link>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Monthly Hires</CardTitle>
             <CardDescription>Number of candidates hired each month.</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={hiringPerformanceData} margin={{ top: 5, right: 0, left: -25, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" fontSize={12}/>
                <YAxis fontSize={12}/>
                <Tooltip />
                <Bar dataKey="hired" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
         <Card>
          <CardHeader>
            <CardTitle>Candidate Sources</CardTitle>
            <CardDescription>Distribution of candidates by source.</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={candidateSourceData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  fontSize={12}
                >
                  {candidateSourceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: "12px" }}/>
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
          <CardHeader>
            <CardTitle>Pending Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
             <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-md">
                <div>
                    <p className="font-medium">5 Job Postings to Approve</p>
                    <p className="text-xs text-muted-foreground">Recruiters are waiting for your review.</p>
                </div>
                <Button size="sm" asChild><Link href={`/dashboard/${user.role}/job-approvals`}>Review Now <ArrowRight className="ml-2 h-3 w-3"/></Link></Button>
             </div>
             <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-md">
                <div>
                    <p className="font-medium">8 Interview Feedbacks Due</p>
                    <p className="text-xs text-muted-foreground">Share your insights on recent candidates.</p>
                </div>
                <Button size="sm" asChild><Link href={`/dashboard/${user.role}/interviews`}>Provide Feedback <ArrowRight className="ml-2 h-3 w-3"/></Link></Button>
             </div>
          </CardContent>
        </Card>
    </div>
  );
}
