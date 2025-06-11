
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"; // Added CardFooter
import { useAuth } from "@/hooks/useAuth";
import { Loader2, UserCircle, BrainCircuit, CalendarCheck, BarChart3, Mail, Briefcase, CheckCircle } from "lucide-react";
import React from "react";

interface Specialization {
  id: string;
  name: string;
}

interface AvailabilityPreference {
  id: string;
  type: string;
  detail: string;
}

const mockSpecializations: Specialization[] = [
  { id: "spec1", name: "Java Backend Interviews" },
  { id: "spec2", name: "System Design Architecture" },
  { id: "spec3", name: "Behavioral & Cultural Fit" },
  { id: "spec4", name: "Frontend (React & TypeScript)" },
];

const mockAvailability: AvailabilityPreference[] = [
  { id: "avail1", type: "Preferred Days", detail: "Monday, Wednesday, Friday" },
  { id: "avail2", type: "Preferred Times", detail: "9:00 AM - 1:00 PM (Local Time)" },
  { id: "avail3", type: "Interview Types", detail: "Technical Deep Dives, Behavioral" },
];

const mockInterviewStats = {
  conducted: 42,
  avgFeedbackTime: "16 hours",
  positiveFeedbackRate: "92%",
};

export default function InterviewerProfilePage() {
  const { user, isLoading: authLoading } = useAuth();

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

  return (
    <div className="space-y-6">
      <Card className="shadow-xl">
        <div className="bg-gradient-to-br from-primary/10 via-background to-background h-16 md:h-20" />
        <div className="px-6 pb-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start">
            <div className="-mt-12 md:-mt-16 shrink-0 relative group">
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
              <CardTitle className="flex items-center"><BrainCircuit className="mr-2 h-5 w-5 text-primary"/>Interview Specializations</CardTitle>
              <CardDescription>Areas of expertise for conducting interviews.</CardDescription>
            </CardHeader>
            <CardContent>
              {mockSpecializations.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {mockSpecializations.map((spec) => (
                    <Badge key={spec.id} variant="default" className="py-1 px-3 text-sm">
                      {spec.name}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No specializations listed yet.</p>
              )}
            </CardContent>
             <CardFooter className="text-xs text-muted-foreground">
                To update specializations, please contact an administrator (Placeholder).
            </CardFooter>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <Card className="shadow-lg">
            <CardHeader>
                <CardTitle className="flex items-center"><CalendarCheck className="mr-2 h-5 w-5 text-primary"/>Availability Preferences</CardTitle>
                <CardDescription>General guidelines for scheduling.</CardDescription>
            </CardHeader>
            <CardContent>
              {mockAvailability.length > 0 ? (
                 <ul className="space-y-2">
                  {mockAvailability.map((item) => (
                    <li key={item.id} className="text-sm">
                      <span className="font-medium text-muted-foreground">{item.type}:</span> {item.detail}
                    </li>
                  ))}
                </ul>
              ) : (
                 <p className="text-sm text-muted-foreground">No availability preferences set.</p>
              )}
            </CardContent>
             <CardFooter className="text-xs text-muted-foreground">
                To update availability, please contact an administrator (Placeholder).
            </CardFooter>
          </Card>

          <Card className="shadow-lg">
            <CardHeader>
                <CardTitle className="flex items-center"><BarChart3 className="mr-2 h-5 w-5 text-primary"/>Interview Statistics</CardTitle>
                <CardDescription>Your recent interview activity.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
                <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Interviews Conducted:</span>
                    <Badge variant="secondary" className="text-sm">{mockInterviewStats.conducted}</Badge>
                </div>
                 <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Avg. Feedback Time:</span>
                    <Badge variant="secondary" className="text-sm">{mockInterviewStats.avgFeedbackTime}</Badge>
                </div>
                 <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Positive Feedback Rate:</span>
                    <Badge variant="secondary" className="text-sm">{mockInterviewStats.positiveFeedbackRate}</Badge>
                </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
