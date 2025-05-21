"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, CheckCircle, Clock, Edit, MessageSquare, User, Video } from "lucide-react";
import Link from "next/link";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const mockTeamInterviews = [
  { id: "hmInt1", candidateName: "Alice Wonderland", jobTitle: "Software Engineer", date: "2024-08-15", time: "10:00 AM", interviewer: "Charles Brown (You)", status: "Upcoming", feedbackProvided: false },
  { id: "hmInt2", candidateName: "Bob The Builder", jobTitle: "Product Manager", date: "2024-08-16", time: "02:30 PM", interviewer: "Emily White", status: "Upcoming", feedbackProvided: false },
  { id: "hmInt3", candidateName: "Carol Danvers", jobTitle: "UX Designer", date: "2024-07-28", time: "11:00 AM", interviewer: "Charles Brown (You)", status: "Completed", feedbackProvided: true },
  { id: "hmInt4", candidateName: "David Copperfield", jobTitle: "Data Scientist", date: "2024-08-01", time: "09:00 AM", interviewer: "Fiona Green", status: "Completed", feedbackProvided: false },
];

export default function HMInterviewsPage() {
  const [selectedInterview, setSelectedInterview] = useState<typeof mockTeamInterviews[0] | null>(null);
  const [feedbackText, setFeedbackText] = useState("");
  const { toast } = useToast();

  const handleProvideFeedback = () => {
    if (!selectedInterview || !feedbackText.trim()) {
        toast({variant: "destructive", title: "Error", description: "Feedback text cannot be empty."});
        return;
    }
    // API call to submit feedback
    console.log(`Feedback for ${selectedInterview.candidateName}: ${feedbackText}`);
    toast({title: "Feedback Submitted", description: `Feedback for ${selectedInterview.candidateName} saved.`});
    // Update local state or re-fetch. For demo, just close dialog.
    setSelectedInterview(null);
    setFeedbackText("");
  }

  const upcomingInterviews = mockTeamInterviews.filter(i => i.status === "Upcoming");
  const pastInterviews = mockTeamInterviews.filter(i => i.status === "Completed");

  const renderInterviewCard = (interview: typeof mockTeamInterviews[0]) => (
    <Card key={interview.id} className="shadow-md">
      <CardHeader>
        <CardTitle className="text-lg">{interview.candidateName} - {interview.jobTitle}</CardTitle>
        <CardDescription>Interviewer: {interview.interviewer}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div className="flex items-center"><CalendarDays className="mr-2 h-4 w-4 text-muted-foreground" /> {interview.date}</div>
        <div className="flex items-center"><Clock className="mr-2 h-4 w-4 text-muted-foreground" /> {interview.time}</div>
        <div className="flex items-center">
            {interview.status === "Upcoming" ? <Badge variant="secondary">Upcoming</Badge> : <Badge variant="outline"><CheckCircle className="mr-1 h-3 w-3 text-green-600"/>Completed</Badge>}
        </div>
      </CardContent>
      <CardFooter>
        {interview.status === "Upcoming" && (
            <Button size="sm" variant="default" className="w-full">View Details / Join</Button>
        )}
        {interview.status === "Completed" && !interview.feedbackProvided && (
            <DialogTrigger asChild onClick={() => {setSelectedInterview(interview); setFeedbackText("")}}>
                <Button size="sm" variant="outline" className="w-full"><Edit className="mr-2 h-4 w-4" /> Provide Feedback</Button>
            </DialogTrigger>
        )}
        {interview.status === "Completed" && interview.feedbackProvided && (
            <Button size="sm" variant="ghost" disabled className="w-full text-green-600"><CheckCircle className="mr-2 h-4 w-4"/> Feedback Provided</Button>
        )}
      </CardFooter>
    </Card>
  );


  return (
    <Dialog>
      <div className="space-y-8">
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="text-2xl">Manage Team Interviews</CardTitle>
            <CardDescription>View upcoming interviews, provide feedback, and track candidate progress.</CardDescription>
          </CardHeader>
        </Card>

        <div>
          <h2 className="text-xl font-semibold mb-4">Your Upcoming Interviews ({upcomingInterviews.filter(i => i.interviewer.includes("(You)")).length})</h2>
          {upcomingInterviews.filter(i => i.interviewer.includes("(You)")).length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcomingInterviews.filter(i => i.interviewer.includes("(You)")).map(renderInterviewCard)}
            </div>
          ) : <p className="text-muted-foreground">No upcoming interviews assigned to you.</p>}
        </div>

         <div>
          <h2 className="text-xl font-semibold mb-4">Team's Upcoming Interviews ({upcomingInterviews.filter(i => !i.interviewer.includes("(You)")).length})</h2>
          {upcomingInterviews.filter(i => !i.interviewer.includes("(You)")).length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcomingInterviews.filter(i => !i.interviewer.includes("(You)")).map(renderInterviewCard)}
            </div>
          ) : <p className="text-muted-foreground">No other upcoming team interviews.</p>}
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Past Interviews ({pastInterviews.length})</h2>
          {pastInterviews.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pastInterviews.map(renderInterviewCard)}
            </div>
          ) : <p className="text-muted-foreground">No past interviews recorded.</p>}
        </div>
      </div>
      
      {selectedInterview && (
        <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
                <DialogTitle>Provide Feedback for {selectedInterview.candidateName}</DialogTitle>
                <DialogDescription>Job: {selectedInterview.jobTitle}. Share your thoughts on the candidate's performance.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="feedback" className="text-right col-span-1">Feedback</Label>
                    <Textarea id="feedback" value={feedbackText} onChange={(e) => setFeedbackText(e.target.value)} className="col-span-3" rows={5} placeholder="Strengths, weaknesses, overall recommendation..." />
                </div>
            </div>
            <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setSelectedInterview(null)}>Cancel</Button>
                <Button type="button" onClick={handleProvideFeedback}>Submit Feedback</Button>
            </DialogFooter>
        </DialogContent>
      )}
    </Dialog>
  );
}
