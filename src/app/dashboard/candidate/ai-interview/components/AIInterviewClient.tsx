
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Bot, Camera, CheckCircle, Loader2, Send, Video } from "lucide-react"; // Removed XCircle as it's not used
import { useEffect, useRef, useState, useCallback } from "react";
import type { AiInterviewSimulationInput, AiInterviewSimulationOutput } from "@/ai/flows/ai-interview-simulation";
import { aiInterviewSimulation } from "@/ai/flows/ai-interview-simulation";
import { getInitialInterviewUtterance, type InitialInterviewUtteranceInput } from "@/ai/flows/initial-interview-message";
import { cn } from "@/lib/utils";

interface AIInterviewClientProps {
  jobContext: {
    jobTitle: string; // Added jobTitle
    jobDescription: string;
    candidateResume: string;
  };
}

type InterviewStage = "consent" | "loadingMessage" | "ready" | "countdown" | "recording" | "review" | "feedback";

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
  
  const [aiGreeting, setAiGreeting] = useState<string | null>(null);
  const [currentAiQuestion, setCurrentAiQuestion] = useState<string | null>(null);
  const [isLoadingInitialMessage, setIsLoadingInitialMessage] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const videoPreviewRef = useRef<HTMLVideoElement | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (consentGiven && stage === "consent") { // Move to loading message stage once consent is given
        setStage("loadingMessage");
    }
  }, [consentGiven, stage]);


  useEffect(() => {
    // Fetch initial AI message when stage is loadingMessage and message not yet fetched
    if (stage === "loadingMessage" && !aiGreeting && !isLoadingInitialMessage) {
      const fetchInitialMessage = async () => {
        setIsLoadingInitialMessage(true);
        try {
          const input: InitialInterviewUtteranceInput = {
            jobTitle: jobContext.jobTitle,
          };
          const result = await getInitialInterviewUtterance(input);
          setAiGreeting(result.aiGreeting);
          setCurrentAiQuestion(result.firstQuestion);
          setStage("ready"); // Move to ready stage after fetching message
          toast({ title: "Mira is ready!", description: "Your AI interviewer has joined." });
        } catch (error) {
          console.error("Error fetching initial AI message:", error);
          toast({ variant: "destructive", title: "AI Error", description: "Could not load AI. Please try refreshing." });
          setAiGreeting("Hello! I'm Mira, your AI Interviewer. Apologies for the technical hiccup.");
          setCurrentAiQuestion("To start, could you tell me about yourself?");
          setStage("ready"); // Still move to ready with fallback
        } finally {
          setIsLoadingInitialMessage(false);
        }
      };
      fetchInitialMessage();
    }
  }, [stage, aiGreeting, jobContext, toast, isLoadingInitialMessage]);


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
                setTimeout(() => { 
                  if (mediaRecorderRef.current?.state === 'recording') {
                    mediaRecorderRef.current.stop();
                    toast({ title: "Recording Complete", description: "Maximum recording time reached." });
                  }
                }, 30000); // Max 30 seconds recording
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
          jobDescription: jobContext.jobDescription,
          candidateResume: jobContext.candidateResume,
          videoDataUri,
        };
        const result = await aiInterviewSimulation(input);
        setFeedback(result);
        setStage("feedback");
        toast({ title: "Feedback Received!", description: "Mira has analyzed your response." });
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
    // Don't reset AI greeting/question for retry, keep them.
    setStage("ready"); 
  };
  
  useEffect(() => {
    return () => {
      cleanupStream();
    };
  }, [cleanupStream]);


  return (
    <>
      <Dialog open={stage === "consent"} onOpenChange={(open) => !open && stage === "consent" && setStage("consent")}>
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
            <Button type="button" onClick={() => { 
                if(consentGiven) setStage("loadingMessage"); // Changed to loadingMessage
                else toast({variant: "destructive", title: "Consent Required", description: "Please provide consent to continue."})
            }}>
              Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl"><Bot /> Mira - AI Interviewer</CardTitle>
          {isLoadingInitialMessage || stage === "loadingMessage" ? (
            <div className="pt-2 space-y-1">
              <div className="h-4 bg-muted rounded w-3/4 animate-pulse"></div>
              <div className="h-4 bg-muted rounded w-1/2 animate-pulse"></div>
            </div>
          ) : (
            <>
              {aiGreeting && <CardDescription className="pt-2 text-lg">{aiGreeting}</CardDescription>}
              {currentAiQuestion && <CardDescription className="pt-1 text-lg font-semibold">{currentAiQuestion}</CardDescription>}
            </>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="aspect-video w-full bg-muted rounded-md flex items-center justify-center overflow-hidden">
            <video ref={videoPreviewRef} playsInline autoPlay muted className={cn("w-full h-full object-cover", ((stage === "review" || stage ==="feedback") && videoBlobUrl) && "hidden")} />
            {(stage === "review" || stage === "feedback") && videoBlobUrl && (
              <video src={videoBlobUrl} controls className="w-full h-full object-cover" />
            )}
            {stage !== "countdown" && stage !== "recording" && stage !== "review" && stage !== "feedback" && (
                <Camera className="h-24 w-24 text-muted-foreground" />
            )}
            {stage === "countdown" && countdown !== null && (
              <div className="absolute text-6xl font-bold text-white bg-black/50 p-4 rounded-lg">{countdown}</div>
            )}
          </div>
          
          {stage === "ready" && !isLoadingInitialMessage && (
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
            <CardTitle className="flex items-center gap-2"><CheckCircle className="text-green-500" /> Mira's Feedback</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea readOnly value={feedback.feedback} rows={10} className="bg-muted text-foreground" />
          </CardContent>
          <CardFooter>
            <Button onClick={() => { resetInterview(); setAiGreeting(null); setCurrentAiQuestion(null); setStage("loadingMessage"); }} className="w-full">
              Start New Simulation
            </Button>
          </CardFooter>
        </Card>
      )}
    </>
  );
}
