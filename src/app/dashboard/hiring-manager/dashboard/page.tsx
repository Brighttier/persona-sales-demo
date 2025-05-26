
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Briefcase, Users, UserCheck, BarChart3 as BarChartIcon, ArrowRight, CalendarCheck, PieChart as PieChartIcon, FileText, UserPlus, MessageSquare } from "lucide-react";
import Link from "next/link";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const teamStats = {
  openPositions: 5,
  candidatesInPipeline: 45,
  interviewsToday: 3,
  avgTimeToFill: "28 days",
  pendingApprovals: 2,
  feedbackDue: 8,
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

interface TeamInterviewer {
    id: string;
    name: string;
    email: string;
    specializations: string;
}

const addInterviewerFormSchema = z.object({
  name: z.string().min(2, "Interviewer name must be at least 2 characters."),
  email: z.string().email("Invalid email address."),
  specializations: z.string().min(5, "Please list at least one specialization (e.g., Java, Behavioral).").optional(),
});

type AddInterviewerFormValues = z.infer<typeof addInterviewerFormSchema>;


export default function HiringManagerDashboardPage() {
  const { user, role } = useAuth();
  const { toast } = useToast();
  const [isAddInterviewerDialogOpen, setIsAddInterviewerDialogOpen] = useState(false);
  const [teamInterviewers, setTeamInterviewers] = useState<TeamInterviewer[]>([
    { id: "interviewerA", name: "John Smith - Sr. Engineer", email: "john.s@example.com", specializations: "Java, System Design" },
    { id: "interviewerB", name: "Alice Brown - Team Lead", email: "alice.b@example.com", specializations: "React, Frontend Architecture, Behavioral" },
    { id: "interviewerC", name: "Bob Green - Architect", email: "bob.g@example.com", specializations: "Cloud Infrastructure, Python, Scalability" },
  ]);

  const form = useForm<AddInterviewerFormValues>({
    resolver: zodResolver(addInterviewerFormSchema),
    defaultValues: {
      name: "",
      email: "",
      specializations: "",
    },
  });

  const handleAddInterviewerSubmit = (data: AddInterviewerFormValues) => {
    const newInterviewer: TeamInterviewer = {
        id: `interviewer-${Date.now()}`,
        name: data.name,
        email: data.email,
        specializations: data.specializations || "General",
    };
    setTeamInterviewers(prev => [...prev, newInterviewer]);
    toast({
        title: "Interviewer Added (Placeholder)",
        description: `${data.name} has been added to your team's interviewer list.`,
    });
    form.reset();
    setIsAddInterviewerDialogOpen(false);
  };

  if (!user) {
    return <div className="flex h-screen items-center justify-center"><p>Loading user data...</p></div>;
  }

  return (
    <div className="space-y-8">
      <Card className="shadow-xl bg-gradient-to-r from-primary/10 via-background to-background">
        <CardHeader>
          <CardTitle className="text-3xl">Hiring Manager Dashboard</CardTitle>
          <CardDescription>Overview of your team's hiring activities, {user.name.split(" ")[0]}.</CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-200 ease-in-out">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Positions</CardTitle>
            <Briefcase className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamStats.openPositions}</div>
            <Link href={`/dashboard/${role}/job-listings`} className="text-xs text-primary hover:underline mt-1 block">Manage My Postings</Link>
          </CardContent>
        </Card>
        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-200 ease-in-out">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Job Approvals</CardTitle>
            <UserCheck className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamStats.pendingApprovals}</div>
             <Link href={`/dashboard/${role}/job-approvals`} className="text-xs text-primary hover:underline mt-1 block">Review Jobs</Link>
          </CardContent>
        </Card>
        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-200 ease-in-out">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Interviews Today</CardTitle>
            <CalendarCheck className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamStats.interviewsToday}</div>
            <Link href={`/dashboard/${role}/interviews`} className="text-xs text-primary hover:underline mt-1 block">View Schedule</Link>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-200 ease-in-out">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Candidates in Pipeline</CardTitle>
            <Users className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamStats.candidatesInPipeline}</div>
            <p className="text-xs text-muted-foreground mt-1">Across all open positions</p>
          </CardContent>
        </Card>
        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-200 ease-in-out">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Interview Feedback Due</CardTitle>
            <MessageSquare className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamStats.feedbackDue}</div>
            <Link href={`/dashboard/${role}/interviews`} className="text-xs text-primary hover:underline mt-1 block">Provide Feedback</Link>
          </CardContent>
        </Card>
        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-200 ease-in-out">
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

      <Card className="shadow-lg hover:shadow-xl transition-shadow duration-200 ease-in-out">
        <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">My Team's Interviewers</CardTitle>
            <Dialog open={isAddInterviewerDialogOpen} onOpenChange={setIsAddInterviewerDialogOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline" size="sm" onClick={() => form.reset()}><UserPlus className="mr-2 h-4 w-4"/>Add Interviewer</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Add New Interviewer to Your Team</DialogTitle>
                        <DialogDescription>
                            Define the interviewer's details and their areas of specialization.
                        </DialogDescription>
                    </DialogHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(handleAddInterviewerSubmit)} className="space-y-4 py-4">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Interviewer Full Name</FormLabel>
                                        <FormControl><Input placeholder="e.g., Dr. Jane Smith" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Interviewer Email</FormLabel>
                                        <FormControl><Input type="email" placeholder="e.g., jane.smith@company.com" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="specializations"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Specializations / Focus Areas</FormLabel>
                                        <FormControl><Textarea placeholder="e.g., Java Backend, System Design, Behavioral Interviews, React Frontend" {...field} rows={3}/></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <DialogFooter className="pt-4">
                                <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                                <Button type="submit">Add Interviewer</Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
        </CardHeader>
        <CardContent>
            {teamInterviewers.length > 0 ? (
                <ul className="space-y-2">
                    {teamInterviewers.map(interviewer => (
                        <li key={interviewer.id} className="text-sm p-3 bg-secondary/50 rounded-md flex justify-between items-center">
                            <div>
                                <span className="font-medium">{interviewer.name}</span>
                                <p className="text-xs text-muted-foreground">Email: {interviewer.email}</p>
                                <p className="text-xs text-muted-foreground">Specializations: {interviewer.specializations}</p>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => toast({title: "Manage Interviewer (Placeholder)", description: `Further actions for ${interviewer.name} would be here.`})}>Manage</Button>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-sm text-muted-foreground">No interviewers added for your team yet.</p>
            )}
            <p className="text-xs text-muted-foreground mt-3">Hiring Managers can add and manage interviewers from their company who can conduct interviews. This is a placeholder for that functionality.</p>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-200 ease-in-out">
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
         <Card className="shadow-lg hover:shadow-xl transition-shadow duration-200 ease-in-out">
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

      <Card className="shadow-lg hover:shadow-xl transition-shadow duration-200 ease-in-out">
          <CardHeader>
            <CardTitle>Key Actions & Quick Links</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
             <Button size="lg" variant="default" asChild className="w-full">
                <Link href={`/dashboard/${role}/job-listings`}><FileText className="mr-2 h-4 w-4"/> My Job Postings</Link>
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
