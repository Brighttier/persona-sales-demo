
import { AIInterviewClient } from "./components/AIInterviewClient";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";


export default function AIInterviewSimulationPage() { 
  const jobContext = {
    jobTitle: "Software Engineer", // Added for more direct use
    jobDescription: "We are looking for a proactive Software Engineer with experience in React and Node.js to join our innovative team. The ideal candidate should be a problem-solver and a great team player.",
    candidateResume: "Experienced Full Stack Developer with 5 years in web technologies including React, Angular, Node.js, Python. Proven ability to lead projects and mentor junior developers. BSc in Computer Science."
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl">AI Interview Simulation</CardTitle>
          <CardDescription>
            Engage in a conversational interview with our AI, Mira. She'll ask you questions, and your video response will be recorded and analyzed to provide you with feedback.
          </CardDescription>
        </CardHeader>
      </Card>
      
      <Alert variant="default" className="bg-primary/10 border-primary/30 shadow-lg">
        <AlertCircle className="h-4 w-4 !text-primary" />
        <AlertTitle className="text-primary">Important Notice</AlertTitle>
        <AlertDescription className="text-primary/80">
          This is an AI-driven interview simulation. For the best experience, ensure you have a working microphone and camera, and a quiet environment. The video recording will cover the entire interview session (max {MAX_SESSION_DURATION_MS / 60000} mins).
        </AlertDescription>
      </Alert>

      <AIInterviewClient jobContext={jobContext} />
    </div>
  );
}

const MAX_SESSION_DURATION_MS = 3 * 60 * 1000; // Keep in sync with client
