
"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, CheckCircle, Clock, MessageSquare, Video, UserCircle, BotMessageSquare } from "lucide-react"; // Added BotMessageSquare
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";

const mockInterviews = [
  { id: "int1", jobTitle: "Software Engineer, Frontend", company: "Tech Solutions Inc.", date: "2024-08-15", time: "10:00 AM", type: "Technical Interview", status: "Upcoming", platform: "Google Meet", interviewer: "Dr. Eva Smith" },
  { id: "int2", jobTitle: "Product Manager", company: "Innovate Hub", date: "2024-08-20", time: "02:30 PM", type: "Behavioral Interview", status: "Upcoming", platform: "Zoom", interviewer: "Mr. John Doe"},
  { id: "int3", jobTitle: "UX Designer", company: "Creative Designs Co.", date: "2024-07-25", time: "11:00 AM", type: "Portfolio Review", status: "Completed", feedback: "Positive, awaiting next steps.", interviewer: "Ms. Jane Roe" },
  { id: "int4", jobTitle: "Data Scientist", company: "Analytics Corp.", date: "2024-08-01", time: "09:00 AM", type: "AI Simulation", status: "Completed", platform: "Persona AI", interviewer: "AI Interviewer" }, // Changed type and interviewer
];

export default function CandidateInterviewsPage() {
  const { user, role } = useAuth();
  const upcomingInterviews = mockInterviews.filter(interview => interview.status === "Upcoming");
  const pastInterviews = mockInterviews.filter(interview => interview.status === "Completed");

  const renderInterviewCard = (interview: typeof mockInterviews[0]) => (
    <Card key={interview.id} className="shadow-sm hover:shadow-md transition-shadow">
      <CardHeader>
        <CardTitle className="text-lg">{interview.jobTitle} at {interview.company}</CardTitle>
        <CardDescription>{interview.type}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div className="flex items-center"><CalendarDays className="mr-2 h-4 w-4 text-muted-foreground" /> {interview.date}</div>
        <div className="flex items-center"><Clock className="mr-2 h-4 w-4 text-muted-foreground" /> {interview.time}</div>
        <div className="flex items-center"><Video className="mr-2 h-4 w-4 text-muted-foreground" /> Platform: {interview.platform}</div>
        <div className="flex items-center"><UserCircle className="mr-2 h-4 w-4 text-muted-foreground" /> Interviewer: {interview.interviewer}</div>
        {interview.status === "Completed" && interview.feedback && (
          <div className="flex items-start pt-1">
            <MessageSquare className="mr-2 h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
            <span className="text-xs italic">Feedback: {interview.feedback}</span>
          </div>
        )}
      </CardContent>
      <CardFooter className="mt-2">
        {interview.status === "Upcoming" && (
          <Button size="sm" variant="default" className="w-full">
            Join Interview (Mock Link)
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
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-2xl">My Interviews</CardTitle>
          <CardDescription>Keep track of your upcoming and past interviews. Prepare well and good luck!</CardDescription>
        </CardHeader>
        <CardContent>
            <Button asChild>
                <Link href={`/dashboard/${role}/ai-interview`}>
                    <BotMessageSquare className="mr-2 h-4 w-4" /> AI Interview Simulation
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
          <Card className="text-center py-10 shadow-sm">
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
          <Card className="text-center py-10 shadow-sm">
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
