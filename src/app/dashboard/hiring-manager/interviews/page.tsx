
"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, CheckCircle, Clock, Edit, MessageSquare, User, Video, Users, UserCircle as UserCircleIcon } from "lucide-react"; // Added UserCircleIcon
import Link from "next/link";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface TeamInterview {
  id: string;
  candidateName: string;
  jobTitle: string;
  date: string;
  time: string;
  interviewer: string; // Could be 'You' or other team member's name
  status: "Upcoming" | "Completed" | "Canceled";
  feedbackProvided: boolean;
  interviewType: string; // e.g., "Technical", "Behavioral", "Panel"
  platformLink?: string; // e.g., Zoom/Meet link
}

const mockTeamInterviews: TeamInterview[] = [
  { id: "hmInt1", candidateName: "Alice Wonderland", jobTitle: "Software Engineer", date: "2024-08-15", time: "10:00 AM", interviewer: "Charles Brown (You)", status: "Upcoming", feedbackProvided: false, interviewType: "Technical Screen", platformLink: "#" },
  { id: "hmInt2", candidateName: "Bob The Builder", jobTitle: "Product Manager", date: "2024-08-16", time: "02:30 PM", interviewer: "Emily White", status: "Upcoming", feedbackProvided: false, interviewType: "Behavioral", platformLink: "#" },
  { id: "hmInt3", candidateName: "Carol Danvers", jobTitle: "UX Designer", date: "2024-07-28", time: "11:00 AM", interviewer: "Charles Brown (You)", status: "Completed", feedbackProvided: true, interviewType: "Portfolio Review" },
  { id: "hmInt4", candidateName: "David Copperfield", jobTitle: "Data Scientist", date: "2024-08-01", time: "09:00 AM", interviewer: "Fiona Green", status: "Completed", feedbackProvided: false, interviewType: "Final Round" },
  { id: "hmInt5", candidateName: "Edward Scissorhands", jobTitle: "Frontend Developer", date: "2024-08-05", time: "01:00 PM", interviewer: "Charles Brown (You)", status: "Canceled", feedbackProvided: false, interviewType: "Technical Deep Dive" },
];

export default function HMInterviewsPage() {
  const { user } = useAuth(); // Assuming Charles Brown is the logged-in HM
  const [selectedInterview, setSelectedInterview] = useState<TeamInterview | null>(null);
  const [feedbackText, setFeedbackText] = useState("");
  const { toast } = useToast();

  const handleProvideFeedback = () => {
    if (!selectedInterview || !feedbackText.trim()) {
        toast({variant: "destructive", title: "Error", description: "Feedback text cannot be empty."});
        return;
    }
    // API call to submit feedback
    console.log(`Feedback for ${selectedInterview.candidateName} (Interview ID ${selectedInterview.id}): ${feedbackText}`);
    // Update local state:
    const updatedInterviews = mockTeamInterviews.map(i => i.id === selectedInterview.id ? {...i, feedbackProvided: true} : i);
    // setMockTeamInterviews(updatedInterviews) // If mockTeamInterviews was state

    toast({title: "Feedback Submitted", description: `Feedback for ${selectedInterview.candidateName} saved successfully.`});
    setSelectedInterview(null); // Close dialog
    setFeedbackText("");
  };

  const yourInterviews = mockTeamInterviews.filter(i => i.interviewer.includes(user?.name.split(" ")[0] || "Charles Brown"));
  const teamInterviews = mockTeamInterviews.filter(i => !i.interviewer.includes(user?.name.split(" ")[0] || "Charles Brown"));


  const renderInterviewCard = (interview: TeamInterview, isYourInterview: boolean) => (
    <Card key={interview.id} className="shadow-lg hover:shadow-xl transition-shadow duration-200 ease-in-out">
      <CardHeader>
        <div className="flex justify-between items-start">
            <div>
                <CardTitle className="text-lg">{interview.candidateName}</CardTitle>
                <CardDescription>{interview.jobTitle} - {interview.interviewType}</CardDescription>
            </div>
            {interview.status === "Upcoming" && <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-300">{interview.status}</Badge>}
            {interview.status === "Completed" && <Badge className="bg-green-100 text-green-700 border-green-300"><CheckCircle className="mr-1 h-3 w-3"/>{interview.status}</Badge>}
            {interview.status === "Canceled" && <Badge variant="destructive" className="bg-red-100 text-red-700 border-red-300">{interview.status}</Badge>}
        </div>
      </CardHeader>
      <CardContent className="space-y-1.5 text-sm">
        <div className="flex items-center"><CalendarDays className="mr-2 h-4 w-4 text-muted-foreground" /> {interview.date} at {interview.time}</div>
        <div className="flex items-center"><UserCircleIcon className="mr-2 h-4 w-4 text-muted-foreground" /> Interviewer: {interview.interviewer}</div>
         {interview.platformLink && <div className="flex items-center"><Video className="mr-2 h-4 w-4 text-muted-foreground" /> Platform: <Link href={interview.platformLink} target="_blank" className="text-primary hover:underline ml-1">Meeting Link</Link></div>}
      </CardContent>
      <CardFooter>
        {interview.status === "Upcoming" && isYourInterview && (
            <Button size="sm" variant="default" className="w-full" asChild><Link href={interview.platformLink || "#"} target="_blank">Join Interview</Link></Button>
        )}
        {interview.status === "Upcoming" && !isYourInterview && (
            <Button size="sm" variant="outline" disabled className="w-full">View Details</Button>
        )}
        {interview.status === "Completed" && isYourInterview && !interview.feedbackProvided && (
            <DialogTrigger asChild onClick={() => {setSelectedInterview(interview); setFeedbackText("")}}>
                <Button size="sm" variant="outline" className="w-full border-primary text-primary hover:bg-primary/10"><Edit className="mr-2 h-4 w-4" /> Provide Feedback</Button>
            </DialogTrigger>
        )}
        {interview.status === "Completed" && interview.feedbackProvided && (
            <Button size="sm" variant="ghost" disabled className="w-full text-green-600"><CheckCircle className="mr-2 h-4 w-4"/> Feedback Provided</Button>
        )}
        {interview.status === "Canceled" && (
             <Button size="sm" variant="outline" disabled className="w-full">Interview Canceled</Button>
        )}
      </CardFooter>
    </Card>
  );

  return (
    <Dialog onOpenChange={(open) => !open && setSelectedInterview(null)}>
      <div className="space-y-8">
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl">Manage Team Interviews</CardTitle>
            <CardDescription>View upcoming interviews, provide feedback, and track candidate progress.</CardDescription>
          </CardHeader>
        </Card>

        <Tabs defaultValue="your-interviews" className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:w-[400px] mb-6">
            <TabsTrigger value="your-interviews"><User className="mr-2 h-4 w-4"/>Your Interviews ({yourInterviews.length})</TabsTrigger>
            <TabsTrigger value="team-interviews"><Users className="mr-2 h-4 w-4"/>Team's Interviews ({teamInterviews.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="your-interviews">
            <h2 className="text-xl font-semibold mb-4">Your Schedule</h2>
            {yourInterviews.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {yourInterviews.map(interview => renderInterviewCard(interview, true))}
              </div>
            ) : <Card className="text-center py-10 shadow-lg"><CardContent><CalendarDays className="mx-auto h-12 w-12 text-muted-foreground mb-4" /><p className="text-muted-foreground">No upcoming interviews assigned directly to you.</p></CardContent></Card>}
          </TabsContent>

          <TabsContent value="team-interviews">
            <h2 className="text-xl font-semibold mb-4">Team's Full Schedule</h2>
            {teamInterviews.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {teamInterviews.map(interview => renderInterviewCard(interview, false))}
              </div>
            ) : <Card className="text-center py-10 shadow-lg"><CardContent><Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" /><p className="text-muted-foreground">No other team interviews scheduled at the moment.</p></CardContent></Card>}
          </TabsContent>
        </Tabs>
      </div>

      {selectedInterview && (
        <DialogContent className="sm:max-w-md">
            <DialogHeader>
                <DialogTitle>Provide Feedback for {selectedInterview.candidateName}</DialogTitle>
                <DialogDescription>Job: {selectedInterview.jobTitle} ({selectedInterview.interviewType})</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="space-y-2">
                    <Label htmlFor="feedback" className="text-sm font-medium">Your Feedback</Label>
                    <Textarea id="feedback" value={feedbackText} onChange={(e) => setFeedbackText(e.target.value)} className="min-h-[120px]" placeholder="Overall impression, strengths, weaknesses, technical skills, cultural fit, recommendation (e.g., Proceed / Hold / Reject)..." />
                </div>
            </div>
            <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setSelectedInterview(null)}>Cancel</Button>
                <Button type="button" onClick={handleProvideFeedback} disabled={!feedbackText.trim()}>Submit Feedback</Button>
            </DialogFooter>
        </DialogContent>
      )}
    </Dialog>
  );
}
