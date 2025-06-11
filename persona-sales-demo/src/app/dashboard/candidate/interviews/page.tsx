
"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, CheckCircle, Clock, MessageSquare, Video, UserCircle, BotMessageSquare } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";

interface MockInterview {
  id: string;
  jobTitle: string;
  company: string;
  date: string;
  time: string;
  type: string;
  status: "Upcoming" | "Completed";
  platform: string;
  interviewer?: string; // Made optional and added
  platformLink?: string;
  feedback?: string;
}

const mockInterviews: MockInterview[] = [
  { id: "int1", jobTitle: "Software Engineer, Frontend", company: "Tech Solutions Inc.", date: "2024-08-15", time: "10:00 AM", type: "Technical Interview", status: "Upcoming", platform: "Video Call (Internal)", interviewer: "Dr. Eva Smith", platformLink: "#" },
  { id: "int2", jobTitle: "Product Manager", company: "Innovate Hub", date: "2024-08-20", time: "02:30 PM", type: "Behavioral Interview", status: "Upcoming", platform: "Video Call (Internal)", interviewer: "Mr. John Doe", platformLink: "#"},
  { id: "intAI", jobTitle: "AI Interview", company: "Persona AI", date: "Anytime", time: "On Demand", type: "AI Interview", status: "Upcoming", platform: "Persona AI Platform", interviewer: "Mira (AI Interviewer)"},
  { id: "int3", jobTitle: "UX Designer", company: "Creative Designs Co.", date: "2024-07-25", time: "11:00 AM", type: "Portfolio Review", status: "Completed", feedback: "Positive, awaiting next steps.", interviewer: "Ms. Jane Roe" },
  { id: "int4", jobTitle: "Data Scientist", company: "Analytics Corp.", date: "2024-08-01", time: "09:00 AM", type: "Final Round", status: "Completed", platform: "Persona AI Platform", interviewer: "AI Agent" , feedback: "Strong analytical skills demonstrated." },
];

export default function CandidateInterviewsPage() {
  const { user, role } = useAuth();
  const upcomingInterviews = mockInterviews.filter(interview => interview.status === "Upcoming");
  const pastInterviews = mockInterviews.filter(interview => interview.status === "Completed");

  const renderInterviewCard = (interview: MockInterview) => (
    <Card key={interview.id} className="shadow-lg hover:shadow-xl transition-shadow duration-200 ease-in-out">
      <CardHeader>
        <CardTitle className="text-lg">{interview.jobTitle} at {interview.company}</CardTitle>
        <CardDescription>{interview.type}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div className="flex items-center"><CalendarDays className="mr-2 h-4 w-4 text-muted-foreground" /> {interview.date}</div>
        <div className="flex items-center"><Clock className="mr-2 h-4 w-4 text-muted-foreground" /> {interview.time}</div>
        <div className="flex items-center">
            {interview.type === "AI Interview" ?
                <BotMessageSquare className="mr-2 h-4 w-4 text-muted-foreground"/> :
                <Video className="mr-2 h-4 w-4 text-muted-foreground" />
            }
             Platform: {interview.platform}
        </div>
        {interview.interviewer && (
          <div className="flex items-center"><UserCircle className="mr-2 h-4 w-4 text-muted-foreground" /> Interviewer: {interview.interviewer}</div>
        )}
        {interview.status === "Completed" && interview.feedback && (
          <div className="flex items-start pt-1">
            <MessageSquare className="mr-2 h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
            <span className="text-xs italic">Feedback: {interview.feedback}</span>
          </div>
        )}
      </CardContent>
      <CardFooter className="mt-2">
        {interview.status === "Upcoming" && interview.type === "AI Interview" && (
            <Button size="sm" variant="default" className="w-full" asChild>
                <Link href={`/dashboard/${role}/ai-interview`}>
                    <BotMessageSquare className="mr-2 h-4 w-4" /> Start AI Interview
                </Link>
            </Button>
        )}
        {interview.status === "Upcoming" && interview.type !== "AI Interview" && interview.platformLink && (
          <Button size="sm" variant="default" className="w-full" asChild>
            <Link href={interview.platformLink}>Join Interview (Mock Link)</Link>
          </Button>
        )}
         {interview.status === "Completed" && (
          <Badge variant="secondary" className="w-full justify-center py-2 bg-green-100 text-green-700 border-green-300">
            <CheckCircle className="mr-2 h-4 w-4" /> Completed
          </Badge>
        )}
      </CardFooter>
    </Card>
  );

  return (
    <div className="space-y-8">
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl">My Interviews</CardTitle>
          <CardDescription>Keep track of your upcoming and past interviews. Prepare well and good luck!</CardDescription>
        </CardHeader>
        <CardContent>
            <Button asChild>
                <Link href={`/dashboard/${role}/ai-interview`}>
                    <BotMessageSquare className="mr-2 h-4 w-4" /> Realtime AI Interview
                </Link>
            </Button>
        </CardContent>
      </Card>

      <div>
        <h2 className="text-xl font-semibold mb-4">Upcoming Interviews ({upcomingInterviews.length})</h2>
        {upcomingInterviews.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {upcomingInterviews.map(renderInterviewCard)}
          </div>
        ) : (
          <Card className="text-center py-10 shadow-lg">
            <CardContent>
              <CalendarDays className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No upcoming interviews scheduled. Keep applying!</p>
            </CardContent>
          </Card>
        )}
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Past Interviews ({pastInterviews.length})</h2>
         {pastInterviews.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pastInterviews.map(renderInterviewCard)}
          </div>
        ) : (
          <Card className="text-center py-10 shadow-lg">
            <CardContent>
              <CheckCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No past interviews recorded yet.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
