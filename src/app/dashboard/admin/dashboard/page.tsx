"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Users, Building, CreditCard, Settings, ShieldAlert, Activity, ArrowRight } from "lucide-react";
import Link from "next/link";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const systemStats = {
  totalUsers: 1250,
  activeCompanies: 5,
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

export default function AdminDashboardPage() {
  const { user } = useAuth();

  if (!user) {
    return <p>Loading user data...</p>;
  }

  return (
    <div className="space-y-8">
      <Card className="shadow-md bg-gradient-to-r from-primary/10 via-background to-background">
        <CardHeader>
          <CardTitle className="text-3xl">Administrator Dashboard</CardTitle>
          <CardDescription>System-wide overview and management tools, {user.name.split(" ")[0]}.</CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemStats.totalUsers}</div>
            <Link href={`/dashboard/${user.role}/user-management`} className="text-xs text-primary hover:underline">Manage Users</Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Companies</CardTitle>
            <Building className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemStats.activeCompanies}</div>
             <Link href={`/dashboard/${user.role}/company-management`} className="text-xs text-primary hover:underline">Manage Companies</Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue (MRR)</CardTitle>
            <CreditCard className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemStats.totalRevenue}</div>
            <Link href={`/dashboard/${user.role}/billing`} className="text-xs text-primary hover:underline">View Billing</Link>
          </CardContent>
        </Card>
        <Card className="border-yellow-400 bg-yellow-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-yellow-700">Pending System Alerts</CardTitle>
            <ShieldAlert className="h-5 w-5 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-700">{systemStats.pendingIssues}</div>
            <Link href={`/dashboard/${user.role}/settings`} className="text-xs text-yellow-700 hover:underline">Resolve Alerts</Link>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
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
                <Tooltip />
                <Bar dataKey="users" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
         <Card>
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
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: "12px" }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
            <CardTitle>System Logs & Activity</CardTitle>
            <CardDescription>Recent important system events and activities.</CardDescription>
        </CardHeader>
        <CardContent>
            {/* Placeholder for system logs. In a real app, this would be a list or table. */}
            <div className="p-4 border rounded-md bg-muted min-h-[150px] flex items-center justify-center">
                <p className="text-muted-foreground flex items-center"><Activity className="mr-2 h-5 w-5"/> System activity logs will be displayed here. (e.g., New company registered, Major error occurred)</p>
            </div>
        </CardContent>
        <CardFooter>
            <Button variant="outline">View All System Logs</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
