
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, UserCircle, Briefcase, BarChart3, Link as LinkIcon, Settings, Mail, Search, CheckSquare, TrendingUp } from "lucide-react";
import Link from "next/link";

export default function RecruiterProfilePage() {
  const { user, isLoading: authLoading, role } = useAuth();

  if (authLoading || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Loading profile...</p>
      </div>
    );
  }

  const currentFullName = user.name;
  const currentEmail = user.email;

  const recruiterQuickLinks = [
    { label: "Manage Job Listings", href: `/dashboard/${role}/job-listings`, icon: Briefcase },
    { label: "Browse Candidate Pool", href: `/dashboard/${role}/candidate-pool`, icon: Search },
    { label: "Manage Job Approvals", href: `/dashboard/${role}/job-approvals`, icon: CheckSquare },
    { label: "AI Screening Tools", href: `/dashboard/${role}/screening`, icon: TrendingUp },
  ];

  return (
    <div className="space-y-6">
      <Card className="shadow-xl">
        <div className="bg-gradient-to-br from-primary/10 via-background to-background h-16 md:h-20" />
        <div className="px-6 pb-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start">
            <div className="-mt-12 md:-mt-16 shrink-0">
              <Avatar className="h-32 w-32 md:h-40 md:w-40 border-4 border-background shadow-lg">
                <AvatarImage src={user.avatar || `https://placehold.co/200x200.png?text=${currentFullName.charAt(0)}`} alt={currentFullName} data-ai-hint="person professional"/>
                <AvatarFallback>{currentFullName.split(" ").map(n => n[0]).join("").toUpperCase()}</AvatarFallback>
              </Avatar>
            </div>
            <div className="sm:ml-6 mt-4 sm:mt-0 text-center sm:text-left w-full">
              <CardTitle className="text-2xl md:text-3xl text-foreground">{currentFullName}</CardTitle>
              <div className="mt-1 space-y-0.5 text-sm text-muted-foreground">
                <div className="flex items-center justify-center sm:justify-start">
                  <Mail className="mr-2 h-4 w-4"/> {currentEmail}
                </div>
                <div className="flex items-center justify-center sm:justify-start">
                  <Briefcase className="mr-2 h-4 w-4"/> <span className="capitalize">{user.role}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center"><UserCircle className="mr-2 h-5 w-5 text-primary"/>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Full Name</p>
                <p className="text-md">{currentFullName}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Email</p>
                <p className="text-md">{currentEmail}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Role</p>
                <p className="text-md capitalize">{user.role}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center"><Briefcase className="mr-2 h-5 w-5 text-primary"/>Recruitment Focus (Placeholder)</CardTitle>
              <CardDescription>Your primary areas of recruitment expertise.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                E.g., Specialized in sourcing and placing top-tier talent in Technology, Sales, and Marketing sectors. Proven ability to manage full-cycle recruitment for diverse roles.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <Card className="shadow-lg">
            <CardHeader>
                <CardTitle className="flex items-center"><BarChart3 className="mr-2 h-5 w-5 text-primary"/>Performance Metrics (Placeholder)</CardTitle>
                <CardDescription>Key statistics related to your recruitment activities.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Active Jobs Managed:</span>
                    <span className="font-semibold">15</span>
                </div>
                 <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Candidates Sourced (Month):</span>
                    <span className="font-semibold">120</span>
                </div>
                 <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Average Time-to-Fill:</span>
                    <span className="font-semibold">28 days</span>
                </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader>
                <CardTitle className="flex items-center"><LinkIcon className="mr-2 h-5 w-5 text-primary"/>Quick Links</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {recruiterQuickLinks.map(link => (
                <Link key={link.href} href={link.href} className="flex items-center p-2 -m-2 rounded-md hover:bg-accent transition-colors">
                  <link.icon className="mr-3 h-5 w-5 text-muted-foreground" />
                  <span className="text-sm font-medium">{link.label}</span>
                </Link>
              ))}
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader>
                <CardTitle className="flex items-center"><Settings className="mr-2 h-5 w-5 text-primary"/>Tools & Preferences (Placeholder)</CardTitle>
                <CardDescription>Manage your tool integrations and notification settings.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Configure integrations with LinkedIn Recruiter, calendar sync preferences, and manage how you receive notifications for new applicants or interview updates.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
