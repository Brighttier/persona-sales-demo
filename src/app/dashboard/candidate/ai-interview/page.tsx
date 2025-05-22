
import { AIInterviewClient } from "./components/AIInterviewClient";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";


export default function AIInterviewSimulationPage() { 
  const jobContext = {
    jobTitle: "Software Engineer",
    jobDescription: "We are looking for a proactive Software Engineer with experience in React and Node.js to join our innovative team. The ideal candidate should be a problem-solver and a great team player. You will be asked to introduce yourself and perhaps answer one or two questions.",
    candidateResume: "Experienced Full Stack Developer with 5 years in web technologies including React, Angular, Node.js, Python. Proven ability to lead projects and mentor junior developers. BSc in Computer Science."
  };

  // Corresponds to RECORDING_DURATION_MS in AIInterviewClient
  const MAX_RECORDING_DURATION_MS = 60 * 1000; // 1 minute

  return (
    <div className="space-y-6">
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl">AI Interview Simulation</CardTitle>
          <CardDescription>
            Engage with our AI for a brief interview simulation. Record your video response (up to {MAX_RECORDING_DURATION_MS / 1000} seconds) to an initial prompt or introduce yourself. Your video will be analyzed to provide you with feedback.
          </CardDescription>
        </CardHeader>
      </Card>
      
      <Alert variant="default" className="bg-primary/10 border-primary/30 shadow-lg">
        <AlertCircle className="h-4 w-4 !text-primary" />
        <AlertTitle className="text-primary">Important Notice</AlertTitle>
        <AlertDescription className="text-primary/80">
          For the best experience, ensure you have a working microphone and camera, and a quiet environment. The video recording will last up to {MAX_RECORDING_DURATION_MS / 1000} seconds.
        </AlertDescription>
      </Alert>

      <AIInterviewClient jobContext={jobContext} />
    </div>
  );
}

    