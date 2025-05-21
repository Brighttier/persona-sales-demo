"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Users, TrendingUp, Clock, Target, CheckCircle } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

const hiringFunnelData = [
  { stage: 'Applications', count: 500, fill: 'hsl(var(--chart-1))' },
  { stage: 'Screened', count: 250, fill: 'hsl(var(--chart-2))' },
  { stage: 'Interviews', count: 100, fill: 'hsl(var(--chart-3))' },
  { stage: 'Offers', count: 20, fill: 'hsl(var(--chart-4))' },
  { stage: 'Hired', count: 15, fill: 'hsl(var(--chart-5))' },
];

const timeToHireData = [
  { month: 'Jan', days: 35 }, { month: 'Feb', days: 32 }, { month: 'Mar', days: 40 },
  { month: 'Apr', days: 28 }, { month: 'May', days: 25 }, { month: 'Jun', days: 22 },
];

const offerAcceptanceData = [ { name: 'Accepted', value: 80 }, { name: 'Rejected', value: 20 } ];
const OFFER_COLORS = ['hsl(var(--chart-2))', 'hsl(var(--destructive))'];

const topPerformingRecruiters = [
    { name: "Brenda S.", hires: 12, efficiency: "85%" },
    { name: "John R.", hires: 9, efficiency: "78%" },
    { name: "Sarah T.", hires: 7, efficiency: "92%" },
]

export default function HMAnalyticsPage() {
  return (
    <div className="space-y-8">
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-2xl">Hiring Performance Analytics</CardTitle>
          <CardDescription>Deep dive into your team's recruitment metrics and identify areas for improvement.</CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center"><Clock className="mr-2 h-4 w-4 text-muted-foreground"/>Average Time to Hire</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">28 Days</div>
            <p className="text-xs text-muted-foreground">-5% from last quarter</p>
          </CardContent>
        </Card>
         <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center"><Target className="mr-2 h-4 w-4 text-muted-foreground"/>Offer Acceptance Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">80%</div>
            <p className="text-xs text-muted-foreground">+2% from last quarter</p>
          </CardContent>
        </Card>
         <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center"><CheckCircle className="mr-2 h-4 w-4 text-muted-foreground"/>Cost Per Hire</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">$3,500</div>
            <p className="text-xs text-muted-foreground">- $200 from last quarter</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Hiring Funnel</CardTitle>
            <CardDescription>Candidate progression through hiring stages.</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={hiringFunnelData} layout="vertical" margin={{ top: 5, right: 20, left: 30, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" fontSize={12}/>
                <YAxis dataKey="stage" type="category" width={100} fontSize={12}/>
                <Tooltip />
                <Bar dataKey="count" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Offer Acceptance Rate</CardTitle>
            <CardDescription>Breakdown of offers accepted vs. rejected.</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie data={offerAcceptanceData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={120} label fontSize={12}>
                    {offerAcceptanceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={OFFER_COLORS[index % OFFER_COLORS.length]} />
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
            <CardTitle>Time to Hire Trend</CardTitle>
            <CardDescription>Average number of days from job posting to offer acceptance.</CardDescription>
        </CardHeader>
        <CardContent>
            <ResponsiveContainer width="100%" height={300}>
                <LineChart data={timeToHireData} margin={{ top: 5, right: 20, left: -15, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" fontSize={12}/>
                    <YAxis fontSize={12}/>
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: "12px" }} />
                    <Line type="monotone" dataKey="days" stroke="hsl(var(--primary))" strokeWidth={2} activeDot={{ r: 6 }} name="Avg. Days to Hire"/>
                </LineChart>
            </ResponsiveContainer>
        </CardContent>
      </Card>
      
        <Card>
            <CardHeader>
                <CardTitle>Top Performing Recruiters</CardTitle>
                <CardDescription>Based on hires and efficiency metrics.</CardDescription>
            </CardHeader>
            <CardContent>
                <ul className="space-y-3">
                    {topPerformingRecruiters.map(recruiter => (
                        <li key={recruiter.name} className="flex justify-between items-center p-3 bg-secondary/30 rounded-md">
                            <span className="font-medium">{recruiter.name}</span>
                            <div className="text-right">
                                <p className="text-sm">{recruiter.hires} Hires</p>
                                <p className="text-xs text-muted-foreground">Efficiency: {recruiter.efficiency}</p>
                            </div>
                        </li>
                    ))}
                </ul>
            </CardContent>
        </Card>
    </div>
  );
}
