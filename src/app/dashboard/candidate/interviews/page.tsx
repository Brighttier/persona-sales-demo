"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, CheckCircle, Clock, MessageSquare, Video } from "lucide-react";
import Link from "next/link";

const mockInterviews = [
  { id: "int1", jobTitle: "Software Engineer, Frontend", company: "Tech Solutions Inc.", date: "2024-08-15", time: "10:00 AM", type: "Technical Interview", status: "Upcoming", platform: "Google Meet" },
  { id: "int2", jobTitle: "Product Manager", company: "Innovate Hub", date: "2024-08-20", time: "02:30 PM", type: "Behavioral Interview", status: "Upcoming", platform: "Zoom" },
  { id: "int3", jobTitle: "UX Designer", company: "Creative Designs Co.", date: "2024-07-25", time: "11:00 AM", type: "Portfolio Review", status: "Completed", feedback: "Positive, awaiting next steps." },
  { id: "int4", jobTitle: "Data Scientist", company: "Analytics Corp.", date: "2024-08-01", time: "09:00 AM", type: "AI Practice Session", status: "Completed", platform: "TalentVerse AI" },
];

export default function CandidateInterviewsPage() {
  const upcomingInterviews = mockInterviews.filter(interview => interview.status === "Upcoming");
  const pastInterviews = mockInterviews.filter(interview => interview.status === "Completed");

  const renderInterviewCard = (interview: typeof mockInterviews[0]) => (
    <Card key={interview.id} className="shadow-md hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle className="text-lg">{interview.jobTitle} at {interview.company}</CardTitle>
        <CardDescription>{interview.type}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div className="flex items-center">
          <CalendarDays className="mr-2 h-4 w-4 text-muted-foreground" />
          <span>{interview.date}</span>
        </div>
        <div className="flex items-center">
          <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
          <span>{interview.time}</span>
        </div>
        <div className="flex items-center">
          <Video className="mr-2 h-4 w-4 text-muted-foreground" />
          <span>Platform: {interview.platform}</span>
        </div>
        {interview.status === "Completed" && interview.feedback && (
          <div className="flex items-start pt-1">
            <MessageSquare className="mr-2 h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
            <span className="text-xs">Feedback: {interview.feedback}</span>
          </div>
        )}
      </CardContent>
      <CardFooter>
        {interview.status === "Upcoming" && (
          <Button size="sm" variant="default" className="w-full">
            Join Interview (Mock)
          </Button>
        )}
         {interview.status === "Completed" && (
          <Badge variant="secondary" className="w-full justify-center py-2">
            <CheckCircle className="mr-2 h-4 w-4" /> Completed
          </Badge>
        )}
      </CardFooter>
    </Card>
  );

  return (
    <div className="space-y-8">
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-2xl">My Interviews</CardTitle>
          <CardDescription>Keep track of your upcoming and past interviews. Prepare well and good luck!</CardDescription>
        </CardHeader>
        <CardContent>
            <Button asChild>
                <Link href={`/dashboard/candidate/ai-interview`}>
                    <Video className="mr-2 h-4 w-4" /> Practice with AI Interviewer
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
          <p className="text-muted-foreground">No upcoming interviews scheduled. Keep applying!</p>
        )}
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Past Interviews ({pastInterviews.length})</h2>
         {pastInterviews.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pastInterviews.map(renderInterviewCard)}
          </div>
        ) : (
          <p className="text-muted-foreground">No past interviews recorded yet.</p>
        )}
      </div>
    </div>
  );
}
