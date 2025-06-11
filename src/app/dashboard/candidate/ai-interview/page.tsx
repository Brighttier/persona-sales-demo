
import { AIInterviewClient } from "./components/AIInterviewClient";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Bot } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";


export default function AIInterviewSimulationPage() { 
  const jobContext = {
    jobTitle: "Software Engineer",
    jobDescription: "We are looking for a proactive Software Engineer with experience in React and Node.js to join our innovative team. The ideal candidate should be a problem-solver and a great team player. You will be asked to introduce yourself and perhaps answer one or two questions.",
    candidateResume: "Experienced Full Stack Developer with 5 years in web technologies including React, Angular, Node.js, Python. Proven ability to lead projects and mentor junior developers. BSc in Computer Science."
  };

  // Corresponds to MAX_SESSION_DURATION_MS in AIInterviewClient
  // For 2 turns (intro + 1 follow-up), 3 minutes should be ample.
  const MAX_SESSION_DURATION_MS = 3 * 60 * 1000; 

  return (
    <div className="space-y-6">
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center">
            <Bot className="mr-3 h-7 w-7 text-primary"/> Realtime AI Interview
          </CardTitle>
          <CardDescription>
            Welcome to your AI-powered interview. Mira, your AI interviewer, will guide you through the session. 
            The interview will consist of a couple of questions. Your entire session (video and audio) will be recorded (up to {MAX_SESSION_DURATION_MS / 1000 / 60} minutes).
            After the interview, your recording will be analyzed to provide comprehensive feedback.
          </CardDescription>
        </CardHeader>
      </Card>
      
      <Alert variant="default" className="bg-primary/10 border-primary/30 shadow-lg">
        <AlertCircle className="h-4 w-4 !text-primary" />
        <AlertTitle className="text-primary">Important Notice</AlertTitle>
        <AlertDescription className="text-primary/80">
          For the best experience, ensure you have a working microphone and camera, and a quiet environment. The video recording will last up to {MAX_SESSION_DURATION_MS / 1000 / 60} minutes.
        </AlertDescription>
      </Alert>

      <AIInterviewClient jobContext={jobContext} />
    </div>
  );
}
