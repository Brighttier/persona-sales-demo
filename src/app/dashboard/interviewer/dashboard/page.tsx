
"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Calendar as CalendarIcon, CalendarDays, CheckCircle, Clock, Edit3, MessageSquare, Video, UserCircle as UserIcon, Check, Send } from "lucide-react"; // Added CalendarIcon
import Link from "next/link";
import { useState } from "react";
import { Calendar } from "@/components/ui/calendar"; // Added Calendar import

interface AssignedInterview {
  id: string;
  candidateName: string;
  jobTitle: string;
  date: string; // Keep as string for mock data simplicity, parse for Calendar if needed
  time: string;
  status: "Upcoming" | "Completed";
  feedbackProvided?: boolean;
  platformLink?: string;
  verdict?: "Recommend for Next Round" | "Hold" | "Do Not Recommend";
}

const mockAssignedInterviews: AssignedInterview[] = [
  { id: "intAssign1", candidateName: "Charlie Candidate", jobTitle: "Software Engineer", date: "2024-08-20", time: "10:00 AM", status: "Upcoming", platformLink: "#" },
  { id: "intAssign2", candidateName: "Dana Developer", jobTitle: "Product Manager", date: "2024-08-22", time: "02:30 PM", status: "Upcoming", platformLink: "#" },
  { id: "intAssign3", candidateName: "Eddie Eng", jobTitle: "UX Designer", date: "2024-08-10", time: "11:00 AM", status: "Completed", feedbackProvided: true, verdict: "Recommend for Next Round" },
  { id: "intAssign4", candidateName: "Fiona Future", jobTitle: "Data Scientist", date: "2024-08-05", time: "09:00 AM", status: "Completed", feedbackProvided: false },
];

type VerdictOption = "Recommend for Next Round" | "Hold" | "Do Not Recommend";

export default function InterviewerDashboardPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [interviews, setInterviews] = useState<AssignedInterview[]>(mockAssignedInterviews);
  const [selectedInterviewForFeedback, setSelectedInterviewForFeedback] = useState<AssignedInterview | null>(null);
  const [feedbackText, setFeedbackText] = useState("");
  const [verdict, setVerdict] = useState<VerdictOption | undefined>(undefined);
  const [calendarDate, setCalendarDate] = useState<Date | undefined>(new Date());

  const upcomingInterviews = interviews.filter(i => i.status === "Upcoming");
  const pastInterviews = interviews.filter(i => i.status === "Completed");

  const handleOpenFeedbackDialog = (interview: AssignedInterview) => {
    setSelectedInterviewForFeedback(interview);
    setFeedbackText(""); // Clear previous feedback
    setVerdict(undefined); // Clear previous verdict
  };

  const handleSubmitFeedback = () => {
    if (!selectedInterviewForFeedback) return;
    if (!feedbackText.trim()) {
      toast({ variant: "destructive", title: "Feedback Required", description: "Please provide your feedback notes." });
      return;
    }
    if (!verdict) {
      toast({ variant: "destructive", title: "Verdict Required", description: "Please select a verdict." });
      return;
    }

    console.log("Feedback Submitted (Placeholder):", {
      interviewId: selectedInterviewForFeedback.id,
      candidateName: selectedInterviewForFeedback.candidateName,
      feedback: feedbackText,
      verdict: verdict,
    });

    setInterviews(prev =>
      prev.map(i =>
        i.id === selectedInterviewForFeedback.id ? { ...i, feedbackProvided: true, verdict: verdict } : i
      )
    );

    toast({ title: "Feedback Submitted", description: `Your feedback for ${selectedInterviewForFeedback.candidateName} has been saved.` });
    setSelectedInterviewForFeedback(null);
  };

  const renderInterviewCard = (interview: AssignedInterview) => (
    <Card key={interview.id} className="shadow-lg">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{interview.candidateName}</CardTitle>
            <CardDescription>{interview.jobTitle}</CardDescription>
          </div>
          {interview.status === "Upcoming" && <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-300">{interview.status}</Badge>}
          {interview.status === "Completed" && <Badge className="bg-green-100 text-green-700 border-green-300"><CheckCircle className="mr-1 h-3 w-3"/>{interview.status}</Badge>}
        </div>
      </CardHeader>
      <CardContent className="space-y-1.5 text-sm">
        <div className="flex items-center"><CalendarDays className="mr-2 h-4 w-4 text-muted-foreground" /> {interview.date} at {interview.time}</div>
        {interview.platformLink && <div className="flex items-center"><Video className="mr-2 h-4 w-4 text-muted-foreground" /> Platform: <Link href={interview.platformLink} target="_blank" className="text-primary hover:underline ml-1">Meeting Link</Link></div>}
        {interview.status === "Completed" && interview.feedbackProvided && (
          <div className="pt-1">
            <Badge variant={interview.verdict === "Recommend for Next Round" ? "default" : interview.verdict === "Do Not Recommend" ? "destructive" : "secondary"}
                   className={
                    interview.verdict === "Recommend for Next Round" ? "bg-green-100 text-green-700 border-green-300" :
                    interview.verdict === "Do Not Recommend" ? "bg-red-100 text-red-700 border-red-300" : ""
                   }>
              Verdict: {interview.verdict}
            </Badge>
          </div>
        )}
      </CardContent>
      <CardFooter className="mt-2">
        {interview.status === "Upcoming" && (
          <div className="flex gap-2 w-full">
            <Button size="sm" variant="outline" className="flex-1" asChild><Link href={interview.platformLink || "#"} target="_blank">Join Interview</Link></Button>
            <DialogTrigger asChild>
              <Button size="sm" variant="default" className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground" onClick={() => handleOpenFeedbackDialog(interview)}>
                <Edit3 className="mr-2 h-4 w-4"/> Enter Feedback
              </Button>
            </DialogTrigger>
          </div>
        )}
        {interview.status === "Completed" && !interview.feedbackProvided && (
          <DialogTrigger asChild>
            <Button size="sm" variant="default" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" onClick={() => handleOpenFeedbackDialog(interview)}>
              <Edit3 className="mr-2 h-4 w-4"/> Provide Feedback
            </Button>
          </DialogTrigger>
        )}
         {interview.status === "Completed" && interview.feedbackProvided && (
            <Button size="sm" variant="ghost" disabled className="w-full text-green-600"><Check className="mr-2 h-4 w-4"/> Feedback Submitted</Button>
        )}
      </CardFooter>
    </Card>
  );

  return (
    <Dialog onOpenChange={(open) => !open && setSelectedInterviewForFeedback(null)}>
      <div className="space-y-8">
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl">Interviewer Dashboard</CardTitle>
            <CardDescription>Welcome, {user?.name?.split(" ")[0]}! View your scheduled interviews and submit feedback.</CardDescription>
          </CardHeader>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl flex items-center"><CalendarIcon className="mr-2 h-5 w-5 text-primary"/> My Interview Calendar</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Calendar
              mode="single"
              selected={calendarDate}
              onSelect={setCalendarDate}
              className="rounded-md border shadow-inner"
              // disabled={(date) => date < new Date(new Date().setDate(new Date().getDate() - 1))} // Example: disable past dates
            />
          </CardContent>
        </Card>

        <div>
          <h2 className="text-xl font-semibold mb-4">Upcoming Interviews ({upcomingInterviews.length})</h2>
          {upcomingInterviews.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcomingInterviews.map(interview => renderInterviewCard(interview))}
            </div>
          ) : (
            <Card className="text-center py-10 shadow-lg">
              <CardContent>
                <CalendarDays className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No upcoming interviews scheduled for you.</p>
              </CardContent>
            </Card>
          )}
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Past Interviews ({pastInterviews.length})</h2>
          {pastInterviews.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pastInterviews.map(interview => renderInterviewCard(interview))}
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

      {selectedInterviewForFeedback && (
        <DialogContent className="sm:max-w-lg">
            <DialogHeader>
                <DialogTitle>Submit Feedback: {selectedInterviewForFeedback.candidateName}</DialogTitle>
                <DialogDescription>For job: {selectedInterviewForFeedback.jobTitle}</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="space-y-2">
                    <Label htmlFor="feedbackText" className="font-medium">Feedback Notes</Label>
                    <Textarea
                        id="feedbackText"
                        value={feedbackText}
                        onChange={(e) => setFeedbackText(e.target.value)}
                        placeholder="Strengths, weaknesses, technical ability, communication skills, overall impression..."
                        rows={6}
                    />
                </div>
                <div className="space-y-2">
                    <Label className="font-medium">Overall Verdict *</Label>
                    <RadioGroup value={verdict} onValueChange={(value: VerdictOption) => setVerdict(value)}>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="Recommend for Next Round" id="verdict-recommend" />
                            <Label htmlFor="verdict-recommend">Recommend for Next Round</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="Hold" id="verdict-hold" />
                            <Label htmlFor="verdict-hold">Hold / Needs Further Discussion</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="Do Not Recommend" id="verdict-reject" />
                            <Label htmlFor="verdict-reject">Do Not Recommend</Label>
                        </div>
                    </RadioGroup>
                </div>
            </div>
            <DialogFooter>
                <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                <Button type="button" onClick={handleSubmitFeedback} disabled={!feedbackText.trim() || !verdict}>
                    <Send className="mr-2 h-4 w-4" /> Submit Feedback & Verdict
                </Button>
            </DialogFooter>
        </DialogContent>
      )}
    </Dialog>
  );
}

    