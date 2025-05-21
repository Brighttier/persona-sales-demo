import { AIInterviewClient } from "./components/AIInterviewClient";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";


export default function AIPracticePage() {
  const jobContext = {
    jobDescription: "We are looking for a proactive Software Engineer with experience in React and Node.js to join our innovative team. The ideal candidate should be a problem-solver and a great team player.",
    candidateResume: "Experienced Full Stack Developer with 5 years in web technologies including React, Angular, Node.js, Python. Proven ability to lead projects and mentor junior developers. BSc in Computer Science."
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl">AI Interview Simulation</CardTitle>
          <CardDescription>
            Practice your interviewing skills with our AI. You'll be asked a question, and your video response will be recorded and analyzed.
          </CardDescription>
        </CardHeader>
      </Card>
      
      <Alert variant="default" className="bg-primary/10 border-primary/30">
        <AlertCircle className="h-4 w-4 !text-primary" />
        <AlertTitle className="text-primary">Important Notice</AlertTitle>
        <AlertDescription className="text-primary/80">
          This is a simulation. For the best experience, ensure you have a working microphone and camera, and a quiet environment. Your video will be recorded for up to 30 seconds after the countdown.
        </AlertDescription>
      </Alert>

      <AIInterviewClient jobContext={jobContext} />
    </div>
  );
}
