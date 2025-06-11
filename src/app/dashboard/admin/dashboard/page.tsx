
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Users, Building, CreditCard, Settings, ShieldAlert, Activity, ArrowRight, Brain, BarChart3, ListChecks, PieChart as PieChartIcon } from "lucide-react";
import Link from "next/link";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const systemStats = {
  totalUsers: 1250,
  activeCompanies: 75,
  totalRevenue: "$15,500",
  pendingIssues: 3,
};

const userGrowthData = [
  { month: 'Jan', users: 800 }, { month: 'Feb', users: 850 }, { month: 'Mar', users: 950 },
  { month: 'Apr', users: 1050 }, { month: 'May', users: 1150 }, { month: 'Jun', users: 1250 },
];

const userRoleDistributionData = [
  { name: 'Candidates', value: 800 }, { name: 'Recruiters', value: 250 },
  { name: 'Hiring Managers', value: 150 }, { name: 'Admins', value: 50 },
];
const ROLE_COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))'];

const aiUsageData = [
  { name: 'Tech Solutions Inc.', usage: 1200, fill: 'hsl(var(--chart-1))' },
  { name: 'Innovate Hub', usage: 850, fill: 'hsl(var(--chart-2))' },
  { name: 'AI Screening', usage: 700, fill: 'hsl(var(--chart-3))' },
  { name: 'Brenda S. (Recruiter)', usage: 450, fill: 'hsl(var(--chart-4))' },
  { name: 'AI Interviews', usage: 950, fill: 'hsl(var(--chart-5))' },
  { name: 'Creative Designs Co.', usage: 300, fill: 'hsl(var(--chart-1))' },
];

const platformHiringFunnelData = [
  { stage: 'Active Jobs', count: 150, fill: 'hsl(var(--chart-1))' },
  { stage: 'Total Applicants', count: 3250, fill: 'hsl(var(--chart-2))' },
  { stage: 'AI Screened', count: 1800, fill: 'hsl(var(--chart-3))' },
  { stage: 'Interviews Scheduled', count: 600, fill: 'hsl(var(--chart-4))' },
  { stage: 'Offers Made', count: 120, fill: 'hsl(var(--chart-5))' },
  { stage: 'Hires Made', count: 95, fill: 'hsl(var(--chart-1))' },
];

const subscriptionPlanDistributionData = [
  { name: 'Enterprise', count: 15, fill: 'hsl(var(--chart-1))' },
  { name: 'Pro', count: 55, fill: 'hsl(var(--chart-2))' },
  { name: 'Basic', count: 30, fill: 'hsl(var(--chart-3))' },
  { name: 'Trial', count: 25, fill: 'hsl(var(--chart-4))' },
];
const PLAN_COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

const mockSystemLogs = [
  { id: "log1", timestamp: "2024-08-15 10:30:00", message: "New company 'FutureTech Solutions' registered.", level: "info" },
  { id: "log2", timestamp: "2024-08-15 09:15:22", message: "User 'alex.johnson@example.com' updated profile.", level: "info" },
  { id: "log3", timestamp: "2024-08-15 08:05:10", message: "AI Screening job 'jobRec1' completed for 50 candidates.", level: "info" },
  { id: "log4", timestamp: "2024-08-14 17:45:00", message: "System alert: Database CPU usage reached 85%.", level: "warning" },
  { id: "log5", timestamp: "2024-08-14 16:00:00", message: "Admin 'diana.green@example.com' updated billing settings.", level: "info" },
];


export default function AdminDashboardPage() {
  const { user, role } = useAuth();

  if (!user) {
    return <p>Loading user data...</p>;
  }

  return (
    <div className="space-y-8">
      <Card className="shadow-xl bg-gradient-to-r from-primary/10 via-background to-background">
        <CardHeader>
          <CardTitle className="text-3xl">Administrator Dashboard</CardTitle>
          <CardDescription>System-wide overview and management tools, {user.name.split(" ")[0]}.</CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemStats.totalUsers}</div>
            <Link href={`/dashboard/${role}/user-management`} className="text-xs text-primary hover:underline">Manage Users</Link>
          </CardContent>
        </Card>
        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Companies</CardTitle>
            <Building className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemStats.activeCompanies}</div>
             <Link href={`/dashboard/${role}/company-management`} className="text-xs text-primary hover:underline">Manage Companies</Link>
          </CardContent>
        </Card>
        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue (MRR)</CardTitle>
            <CreditCard className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemStats.totalRevenue}</div>
            <Link href={`/dashboard/${role}/billing`} className="text-xs text-primary hover:underline">View Billing</Link>
          </CardContent>
        </Card>
        <Card className="border-yellow-400 bg-yellow-50 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-yellow-700">Pending System Alerts</CardTitle>
            <ShieldAlert className="h-5 w-5 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-700">{systemStats.pendingIssues}</div>
            <Link href={`/dashboard/${role}/settings`} className="text-xs text-yellow-700 hover:underline">Resolve Alerts</Link>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>User Growth Over Time</CardTitle>
            <CardDescription>Total registered users per month.</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={userGrowthData} margin={{ top: 5, right: 0, left: -15, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" fontSize={12}/>
                <YAxis fontSize={12}/>
                <Tooltip wrapperStyle={{fontSize: "12px"}}/>
                <Bar dataKey="users" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
         <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>User Role Distribution</CardTitle>
             <CardDescription>Breakdown of users by their roles.</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={userRoleDistributionData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} labelLine={false} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} fontSize={12}>
                    {userRoleDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={ROLE_COLORS[index % ROLE_COLORS.length]} />
                    ))}
                </Pie>
                <Tooltip wrapperStyle={{fontSize: "12px"}} />
                <Legend wrapperStyle={{ fontSize: "12px" }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle className="flex items-center"><ListChecks className="mr-2 h-5 w-5 text-primary"/> Platform Hiring Funnel</CardTitle>
                <CardDescription>Aggregate candidate progression across all jobs (last 90 days).</CardDescription>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                <BarChart data={platformHiringFunnelData} layout="vertical" margin={{ top: 5, right: 20, left: 50, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" fontSize={12}/>
                    <YAxis dataKey="stage" type="category" width={120} fontSize={12} tick={{ fill: 'hsl(var(--muted-foreground))' }}/>
                    <Tooltip wrapperStyle={{fontSize: "12px"}}/>
                    <Legend wrapperStyle={{fontSize: "12px"}} />
                    <Bar dataKey="count" name="Candidate Count" radius={[0, 4, 4, 0]} >
                      {platformHiringFunnelData.map((entry, index) => (
                        <Cell key={`cell-funnel-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle className="flex items-center"><PieChartIcon className="mr-2 h-5 w-5 text-primary"/> Subscription Plan Distribution</CardTitle>
                <CardDescription>Breakdown of active companies by subscription tier.</CardDescription>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                    <Pie data={subscriptionPlanDistributionData} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={110} labelLine={false} label={({ name, percent, count }) => `${name}: ${count} (${(percent * 100).toFixed(0)}%)`} fontSize={12}>
                        {subscriptionPlanDistributionData.map((entry, index) => (
                            <Cell key={`cell-plan-${index}`} fill={PLAN_COLORS[index % PLAN_COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip wrapperStyle={{fontSize: "12px"}}/>
                    <Legend wrapperStyle={{fontSize: "12px"}}/>
                </PieChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
            <CardTitle className="flex items-center"><Brain className="mr-2 h-5 w-5 text-primary"/> AI Feature Usage</CardTitle>
            <CardDescription>Overview of AI credits/tokens consumed by companies, recruiters, or features.</CardDescription>
        </CardHeader>
        <CardContent>
            <ResponsiveContainer width="100%" height={350}>
                <BarChart data={aiUsageData} margin={{ top: 5, right: 0, left: -15, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" fontSize={12} interval={0} angle={-30} textAnchor="end" height={70} />
                    <YAxis fontSize={12} label={{ value: 'AI Units / Credits Consumed', angle: -90, position: 'insideLeft', offset:-5, style: {textAnchor: 'middle', fontSize: '12px', fill: 'hsl(var(--muted-foreground))'} }}/>
                    <Tooltip wrapperStyle={{fontSize: "12px"}}/>
                    <Legend wrapperStyle={{fontSize: "12px"}}/>
                    <Bar dataKey="usage" name="Usage Units" radius={[4, 4, 0, 0]}>
                        {aiUsageData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </CardContent>
        <CardFooter>
             <Button variant="outline">Detailed AI Usage Report</Button>
        </CardFooter>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
            <CardTitle>System Logs & Activity</CardTitle>
            <CardDescription>Recent important system events and activities.</CardDescription>
        </CardHeader>
        <CardContent>
            {mockSystemLogs.length > 0 ? (
              <ul className="space-y-3 max-h-60 overflow-y-auto pr-2">
                {mockSystemLogs.slice(0, 5).map(log => ( // Show latest 5 logs
                  <li key={log.id} className="text-xs border-l-2 pl-3 py-1 hover:bg-muted/50 transition-colors
                    ${log.level === 'warning' ? 'border-yellow-500' : log.level === 'error' ? 'border-red-500' : 'border-blue-500'}">
                    <span className="font-mono text-muted-foreground mr-2">{log.timestamp}:</span>
                    <span className={log.level === 'warning' ? 'text-yellow-700' : log.level === 'error' ? 'text-red-700' : 'text-foreground/80'}>
                      {log.message}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-4 border rounded-md bg-muted min-h-[150px] flex items-center justify-center">
                  <p className="text-muted-foreground flex items-center"><Activity className="mr-2 h-5 w-5"/> No system activity logs to display.</p>
              </div>
            )}
        </CardContent>
        <CardFooter>
            <Button variant="outline">View All System Logs (Placeholder)</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
