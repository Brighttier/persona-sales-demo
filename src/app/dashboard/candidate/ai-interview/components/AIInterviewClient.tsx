"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Bot, Camera, CheckCircle, Loader2, Send, Video, XCircle } from "lucide-react";
import { useEffect, useRef, useState, useCallback } from "react";
import type { AiInterviewSimulationInput, AiInterviewSimulationOutput } from "@/ai/flows/ai-interview-simulation";
import { aiInterviewSimulation } from "@/ai/flows/ai-interview-simulation"; // Actual AI flow
import { cn } from "@/lib/utils";

interface AIInterviewClientProps {
  jobContext: {
    jobDescription: string;
    candidateResume: string;
  };
}

type InterviewStage = "consent" | "ready" | "countdown" | "recording" | "review" | "feedback";

export function AIInterviewClient({ jobContext }: AIInterviewClientProps) {
  const { toast } = useToast();
  const [stage, setStage] = useState<InterviewStage>("consent");
  const [consentGiven, setConsentGiven] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [videoBlobUrl, setVideoBlobUrl] = useState<string | null>(null);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [feedback, setFeedback] = useState<AiInterviewSimulationOutput | null>(null);
  const [isLoadingFeedback, setIsLoadingFeedback] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const videoPreviewRef = useRef<HTMLVideoElement | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const aiQuestion = "Tell me about a challenging project you worked on and how you overcame the obstacles."; // Mock AI question

  const cleanupStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoPreviewRef.current) {
      videoPreviewRef.current.srcObject = null;
    }
  }, []);

  const startCountdownAndRecording = useCallback(async () => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        streamRef.current = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (videoPreviewRef.current) {
          videoPreviewRef.current.srcObject = streamRef.current;
        }
        setStage("countdown");
        setCountdown(5);
        const countdownInterval = setInterval(() => {
          setCountdown(prev => {
            if (prev === null || prev <= 1) {
              clearInterval(countdownInterval);
              setStage("recording");
              setIsRecording(true);
              
              if (streamRef.current) {
                mediaRecorderRef.current = new MediaRecorder(streamRef.current);
                recordedChunksRef.current = [];
                mediaRecorderRef.current.ondataavailable = (event) => {
                  if (event.data.size > 0) recordedChunksRef.current.push(event.data);
                };
                mediaRecorderRef.current.onstop = () => {
                  const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
                  const url = URL.createObjectURL(blob);
                  setVideoBlobUrl(url);
                  setVideoBlob(blob);
                  setStage("review");
                  cleanupStream();
                };
                mediaRecorderRef.current.start();
                setTimeout(() => { // Max 30 seconds recording
                  if (mediaRecorderRef.current?.state === 'recording') {
                    mediaRecorderRef.current.stop();
                  }
                }, 30000);
              }
              return null;
            }
            return prev - 1;
          });
        }, 1000);
      } catch (err) {
        console.error("Error accessing media devices.", err);
        toast({ variant: "destructive", title: "Camera Error", description: "Could not access camera/microphone." });
        setStage("ready");
      }
    } else {
      toast({ variant: "destructive", title: "Unsupported Browser", description: "Video recording not supported." });
      setStage("ready");
    }
  }, [toast, cleanupStream]);
  
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    // stream cleanup is handled in onstop
  }, []);

  const submitForFeedback = async () => {
    if (!videoBlob) {
      toast({ variant: "destructive", title: "No Video", description: "Please record a video first." });
      return;
    }
    setIsLoadingFeedback(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(videoBlob);
      reader.onloadend = async () => {
        const videoDataUri = reader.result as string;
        const input: AiInterviewSimulationInput = {
          ...jobContext,
          videoDataUri,
        };
        const result = await aiInterviewSimulation(input);
        setFeedback(result);
        setStage("feedback");
        toast({ title: "Feedback Received!", description: "AI has analyzed your response." });
      };
    } catch (error) {
      console.error("Error getting feedback:", error);
      toast({ variant: "destructive", title: "Feedback Error", description: "Could not get AI feedback." });
    } finally {
      setIsLoadingFeedback(false);
    }
  };

  const resetInterview = () => {
    cleanupStream();
    setVideoBlobUrl(null);
    setVideoBlob(null);
    setFeedback(null);
    setIsRecording(false);
    setCountdown(null);
    // Do not reset consent, allow multiple attempts.
    setStage("ready"); 
  };
  
  // Cleanup stream on unmount
  useEffect(() => {
    return () => {
      cleanupStream();
    };
  }, [cleanupStream]);


  return (
    <>
      <Dialog open={stage === "consent"} onOpenChange={(open) => !open && stage === "consent" && setStage("consent") /* Keep dialog open if not consented */}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Consent for Recording</DialogTitle>
            <DialogDescription>
              To proceed with the AI interview simulation, we need your consent to access your camera and microphone for recording your response. Your recording will be used solely for providing you with AI-generated feedback.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center space-x-2 py-4">
            <Checkbox id="consent-checkbox" checked={consentGiven} onCheckedChange={(checked) => setConsentGiven(Boolean(checked))} />
            <Label htmlFor="consent-checkbox" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              I consent to the recording of my video and audio for this AI interview simulation.
            </Label>
          </div>
          <DialogFooter>
            <Button type="button" onClick={() => { if(consentGiven) setStage("ready"); else toast({variant: "destructive", title: "Consent Required", description: "Please provide consent to continue."})}}>
              Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Bot /> AI Interviewer Question</CardTitle>
          <CardDescription className="pt-2 text-lg">{aiQuestion}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="aspect-video w-full bg-muted rounded-md flex items-center justify-center overflow-hidden">
            <video ref={videoPreviewRef} playsInline autoPlay muted className={cn("w-full h-full object-cover", (stage === "review" && videoBlobUrl) && "hidden")} />
            {stage === "review" && videoBlobUrl && (
              <video src={videoBlobUrl} controls className="w-full h-full object-cover" />
            )}
            {stage !== "countdown" && stage !== "recording" && stage !== "review" && (
                <Camera className="h-24 w-24 text-muted-foreground" />
            )}
            {stage === "countdown" && countdown !== null && (
              <div className="absolute text-6xl font-bold text-white bg-black/50 p-4 rounded-lg">{countdown}</div>
            )}
          </div>
          
          {stage === "ready" && (
            <Button onClick={startCountdownAndRecording} className="w-full" size="lg">
              <Video className="mr-2 h-5 w-5" /> Start Recording Answer
            </Button>
          )}
          {stage === "recording" && (
            <Button onClick={stopRecording} variant="destructive" className="w-full" size="lg">
              Stop Recording
            </Button>
          )}
          {stage === "review" && videoBlobUrl && (
            <div className="grid grid-cols-2 gap-4">
              <Button onClick={resetInterview} variant="outline" size="lg">Record Again</Button>
              <Button onClick={submitForFeedback} disabled={isLoadingFeedback} size="lg">
                {isLoadingFeedback ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Send className="mr-2 h-5 w-5" />}
                Submit for Feedback
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {stage === "feedback" && feedback && (
        <Card className="shadow-md mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><CheckCircle className="text-green-500" /> AI Feedback</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea readOnly value={feedback.feedback} rows={10} className="bg-muted text-foreground" />
          </CardContent>
          <CardFooter>
            <Button onClick={resetInterview} className="w-full">Try Another Question (Reset)</Button>
          </CardFooter>
        </Card>
      )}
    </>
  );
}
