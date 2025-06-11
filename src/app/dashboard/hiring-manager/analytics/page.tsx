
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Users, TrendingUp, Clock, Target, CheckCircle, PieChart as PieIcon } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Badge } from "@/components/ui/badge"; 

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

const offerAcceptanceData = [ 
    { name: 'Accepted', value: 80, fill: 'hsl(var(--chart-2))' }, 
    { name: 'Rejected', value: 20, fill: 'hsl(var(--destructive))' } 
];


const topPerformingRecruiters = [ 
    { name: "Brenda S.", hires: 12, efficiency: "85%", timeToFill: "25 days" },
    { name: "John R.", hires: 9, efficiency: "78%", timeToFill: "30 days" },
    { name: "Sarah T.", hires: 7, efficiency: "92%", timeToFill: "22 days" },
];

const hiresByDepartmentData = [
    { department: "Engineering", hires: 8, fill: 'hsl(var(--chart-1))'},
    { department: "Product", hires: 4, fill: 'hsl(var(--chart-2))'},
    { department: "Design", hires: 3, fill: 'hsl(var(--chart-3))'},
    { department: "Marketing", hires: 2, fill: 'hsl(var(--chart-4))'},
]

export default function HMAnalyticsPage() {
  return (
    <div className="space-y-8">
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl">Hiring Performance Analytics</CardTitle>
          <CardDescription>Deep dive into your team's recruitment metrics and identify areas for improvement.</CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-200 ease-in-out">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center"><Clock className="mr-2 h-4 w-4 text-muted-foreground"/>Average Time to Hire</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">28 Days</div>
            <p className="text-xs text-muted-foreground">-5% from last quarter</p>
          </CardContent>
        </Card>
         <Card className="shadow-lg hover:shadow-xl transition-shadow duration-200 ease-in-out">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center"><Target className="mr-2 h-4 w-4 text-muted-foreground"/>Offer Acceptance Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">80%</div>
            <p className="text-xs text-muted-foreground">+2% from last quarter</p>
          </CardContent>
        </Card>
         <Card className="shadow-lg hover:shadow-xl transition-shadow duration-200 ease-in-out">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center"><CheckCircle className="mr-2 h-4 w-4 text-muted-foreground"/>Quality of Hire (QoH)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">8.5<span className="text-lg text-muted-foreground">/10</span></div>
            <p className="text-xs text-muted-foreground">Based on 6-month reviews</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3 shadow-lg hover:shadow-xl transition-shadow duration-200 ease-in-out">
          <CardHeader>
            <CardTitle className="flex items-center"><BarChart3 className="mr-2 h-5 w-5 text-primary"/> Hiring Funnel</CardTitle>
            <CardDescription>Candidate progression through hiring stages (last 90 days).</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={hiringFunnelData} layout="vertical" margin={{ top: 5, right: 20, left: 30, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" fontSize={12}/>
                <YAxis dataKey="stage" type="category" width={100} fontSize={12} tick={{ fill: 'hsl(var(--muted-foreground))' }}/>
                <Tooltip wrapperStyle={{fontSize: "12px"}}/>
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {hiringFunnelData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="lg:col-span-2 shadow-lg hover:shadow-xl transition-shadow duration-200 ease-in-out">
          <CardHeader>
            <CardTitle className="flex items-center"><PieIcon className="mr-2 h-5 w-5 text-primary"/> Offer Acceptance</CardTitle>
            <CardDescription>Breakdown of offers accepted vs. rejected.</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie data={offerAcceptanceData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={120} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} fontSize={12}>
                    {offerAcceptanceData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.fill} />))}
                </Pie>
                <Tooltip wrapperStyle={{fontSize: "12px"}}/>
                <Legend wrapperStyle={{fontSize: "12px"}}/>
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
      
      <Card className="shadow-lg hover:shadow-xl transition-shadow duration-200 ease-in-out">
        <CardHeader>
            <CardTitle className="flex items-center"><TrendingUp className="mr-2 h-5 w-5 text-primary"/> Time to Hire Trend</CardTitle>
            <CardDescription>Average number of days from job posting to offer acceptance.</CardDescription>
        </CardHeader>
        <CardContent>
            <ResponsiveContainer width="100%" height={300}>
                <LineChart data={timeToHireData} margin={{ top: 5, right: 20, left: -15, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" fontSize={12} tick={{ fill: 'hsl(var(--muted-foreground))' }}/>
                    <YAxis fontSize={12} tick={{ fill: 'hsl(var(--muted-foreground))' }}/>
                    <Tooltip wrapperStyle={{fontSize: "12px"}}/>
                    <Legend wrapperStyle={{fontSize: "12px"}}/>
                    <Line type="monotone" dataKey="days" stroke="hsl(var(--primary))" strokeWidth={2} activeDot={{ r: 6 }} name="Avg. Days to Hire"/>
                </LineChart>
            </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-200 ease-in-out">
            <CardHeader>
                <CardTitle className="flex items-center"><Users className="mr-2 h-5 w-5 text-primary"/> Top Performing Recruiters</CardTitle>
                <CardDescription>Based on hires and efficiency metrics this quarter.</CardDescription>
            </CardHeader>
            <CardContent>
                <ul className="space-y-3">
                    {topPerformingRecruiters.map(recruiter => (
                        <li key={recruiter.name} className="flex justify-between items-center p-3 bg-secondary/40 rounded-md">
                            <div>
                                <span className="font-medium text-sm">{recruiter.name}</span>
                                <p className="text-xs text-muted-foreground">Efficiency: {recruiter.efficiency} | Avg. Fill: {recruiter.timeToFill}</p>
                            </div>
                            <Badge variant="default" className="text-sm bg-primary/80">{recruiter.hires} Hires</Badge>
                        </li>
                    ))}
                </ul>
            </CardContent>
        </Card>
         <Card className="shadow-lg hover:shadow-xl transition-shadow duration-200 ease-in-out">
            <CardHeader>
                <CardTitle className="flex items-center"><BarChart3 className="mr-2 h-5 w-5 text-primary"/> Hires by Department</CardTitle>
                <CardDescription>Distribution of new hires across departments.</CardDescription>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={hiresByDepartmentData} margin={{ top: 5, right:0, left: -25, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="department" fontSize={12} tick={{ fill: 'hsl(var(--muted-foreground))' }}/>
                        <YAxis fontSize={12} tick={{ fill: 'hsl(var(--muted-foreground))' }}/>
                        <Tooltip wrapperStyle={{fontSize: "12px"}}/>
                        <Bar dataKey="hires" radius={[4, 4, 0, 0]}>
                            {hiresByDepartmentData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                             ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
