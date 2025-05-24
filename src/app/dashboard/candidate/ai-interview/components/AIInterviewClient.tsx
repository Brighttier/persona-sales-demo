
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Camera, CheckCircle, Loader2, Video, Timer, AlertCircle, BotMessageSquare, User, Film, Brain, ThumbsUp, ThumbsDown, MessageSquare, Star, Users } from "lucide-react";
import { useEffect, useRef, useState, useCallback } from "react";

import type { AiInterviewSimulationInput, AiInterviewSimulationOutput } from "@/ai/flows/ai-interview-simulation";
import { aiInterviewSimulation } from "@/ai/flows/ai-interview-simulation";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ElevenLabsProvider, Chat, AudioPlayer } from '@11labs/react';


interface AIInterviewClientProps {
  jobContext: {
    jobTitle: string;
    jobDescription: string;
    candidateResume: string;
  };
}

type InterviewStage = "consent" | "preparingStream" | "countdown" | "interviewing" | "submitting" | "feedback";
const SESSION_COUNTDOWN_SECONDS = 3; // Shortened for quicker start with Chat
const MAX_SESSION_DURATION_MS = 10 * 60 * 1000; // 10 minutes max for the session

const formatFeedbackText = (text: string | undefined): React.ReactNode => {
  if (!text) return "No content available.";
  const lines = text.split('\n');
  const output: JSX.Element[] = [];
  let listItems: JSX.Element[] = [];

  const renderTextWithBold = (line: string, keyPrefix: string): React.ReactNode[] => {
    const parts = line.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={`${keyPrefix}-bold-${index}`}>{part.substring(2, part.length - 2)}</strong>;
      }
      return part;
    });
  };

  lines.forEach((line, index) => {
    const trimmedLine = line.trim();
    const bulletMatch = trimmedLine.match(/^([*•-])\s(.*)/);

    if (bulletMatch) {
      const itemText = bulletMatch[2];
      listItems.push(<li key={`li-${index}`} className="ml-4">{renderTextWithBold(itemText, `li-${index}`)}</li>);
    } else {
      if (listItems.length > 0) {
        output.push(<ul key={`ul-${output.length}`} className="list-disc pl-5 space-y-1 my-2">{listItems}</ul>);
        listItems = [];
      }
      if (trimmedLine) {
        output.push(<p key={`p-${index}`} className="my-2">{renderTextWithBold(trimmedLine, `p-${index}`)}</p>);
      }
    }
  });

  if (listItems.length > 0) {
    output.push(<ul key={`ul-${output.length}`} className="list-disc pl-5 space-y-1 my-2">{listItems}</ul>);
  }
  return output.length > 0 ? <>{output}</> : "No content available.";
};


export function AIInterviewClient({ jobContext }: AIInterviewClientProps) {
  const { toast } = useToast();
  const [stage, setStage] = useState<InterviewStage>("consent");
  const [consentGiven, setConsentGiven] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  
  const [recordedVideoBlob, setRecordedVideoBlob] = useState<Blob | null>(null);
  const [feedbackResult, setFeedbackResult] = useState<AiInterviewSimulationOutput | null>(null);
  
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [cameraPermission, setCameraPermission] = useState<boolean | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const videoPreviewRef = useRef<HTMLVideoElement | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const sessionTimerIdRef = useRef<NodeJS.Timeout | null>(null);
  const isInterviewActiveRef = useRef(false);

  const elevenLabsApiKey = process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY;
  const elevenLabsAgentId = "EVQJtCNSo0L6uHQnImQu"; // Your agent ID

  const cleanupResources = useCallback(() => {
    console.log("Cleaning up resources...");
    isInterviewActiveRef.current = false;
    if (sessionTimerIdRef.current) {
      clearTimeout(sessionTimerIdRef.current);
      sessionTimerIdRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        console.log("Stopping MediaRecorder on cleanup...");
        mediaRecorderRef.current.stop(); 
    }
    mediaRecorderRef.current = null; 
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoPreviewRef.current && videoPreviewRef.current.srcObject) {
        const stream = videoPreviewRef.current.srcObject as MediaStream;
        stream?.getTracks().forEach(track => track.stop());
        videoPreviewRef.current.srcObject = null;
    }
  }, []);

  const submitForFinalFeedback = useCallback(async (videoBlob: Blob) => {
    if (!videoBlob) {
      toast({ variant: "destructive", title: "No Video Recorded", description: "Cannot submit feedback without a video." });
      setStage("preparingStream"); 
      return;
    }
    setStage("submitting");
    try {
      const reader = new FileReader();
      reader.readAsDataURL(videoBlob);
      reader.onloadend = async () => {
        const videoDataUri = reader.result as string;
        // TODO: Find a way to extract transcript from ElevenLabs Chat if possible.
        // For now, sending a placeholder.
        const placeholderTranscript = "Transcript from ElevenLabs Chat session (feature to extract actual transcript TBD).";
        const input: AiInterviewSimulationInput = {
          jobDescription: jobContext.jobDescription,
          candidateResume: jobContext.candidateResume,
          videoDataUri,
          fullTranscript: placeholderTranscript, 
        };
        const result = await aiInterviewSimulation(input);
        setFeedbackResult(result);
        setStage("feedback");
        toast({ title: "Feedback Received!", description: "AI has analyzed your interview." });
      };
      reader.onerror = () => {
        toast({ variant: "destructive", title: "File Read Error", description: "Could not process video for submission." });
        setStage("preparingStream"); 
      }
    } catch (error) {
      console.error("Error getting feedback:", error);
      toast({ variant: "destructive", title: "Feedback Error", description: "Could not get AI feedback." });
      setStage("preparingStream");
    }
  }, [jobContext, toast]);

  const handleFinishInterview = useCallback(() => {
    console.log("handleFinishInterview called. Current stage:", stage);
    if (!isInterviewActiveRef.current && stage !== 'interviewing') {
        console.warn("Interview not active or not in interviewing stage, finish aborted.");
        return;
    }
    isInterviewActiveRef.current = false; 
    if (sessionTimerIdRef.current) {
        clearTimeout(sessionTimerIdRef.current);
        sessionTimerIdRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        console.log("Stopping MediaRecorder via handleFinishInterview...");
        mediaRecorderRef.current.onstop = () => { 
            const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
            console.log("MediaRecorder stopped, blob size:", blob.size);
            setRecordedVideoBlob(blob); 
            submitForFinalFeedback(blob); 
            recordedChunksRef.current = [];
             if (streamRef.current) { 
                streamRef.current.getTracks().forEach(track => track.stop());
                streamRef.current = null;
            }
            if (videoPreviewRef.current && videoPreviewRef.current.srcObject) {
                const stream = videoPreviewRef.current.srcObject as MediaStream;
                stream?.getTracks().forEach(track => track.stop());
                videoPreviewRef.current.srcObject = null;
            }
        };
        mediaRecorderRef.current.stop();
    } else if (recordedVideoBlob) { 
        console.log("MediaRecorder already stopped, submitting existing blob.");
        submitForFinalFeedback(recordedVideoBlob);
    } else {
        console.warn("No recording or blob found to submit.");
        setStage("preparingStream"); 
        toast({variant: "destructive", title: "Recording Issue", description: "No video was recorded."});
    }
  }, [stage, recordedVideoBlob, submitForFinalFeedback, toast]);

  const startInterviewSession = useCallback(async () => {
    if (stage !== "preparingStream") return;
    isInterviewActiveRef.current = true;
    setMediaError(null);
    setRecordedVideoBlob(null);
    recordedChunksRef.current = [];

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setMediaError("Media recording (camera/microphone) is not supported in this browser.");
        toast({ variant: "destructive", title: "Unsupported Browser", description: "Media recording not supported." });
        isInterviewActiveRef.current = false; setStage("preparingStream"); setCameraPermission(false); return;
    }
    
    try {
        streamRef.current = await navigator.mediaDevices.getUserMedia({ video: true, audio: false }); // Audio handled by ElevenLabs Chat
        setCameraPermission(true);
        if (videoPreviewRef.current) {
          videoPreviewRef.current.srcObject = streamRef.current;
          videoPreviewRef.current.muted = true; 
          videoPreviewRef.current.play().catch(e => console.error("Preview play error", e));
        }

        mediaRecorderRef.current = new MediaRecorder(streamRef.current);
        mediaRecorderRef.current.ondataavailable = (e) => { if (e.data.size > 0) recordedChunksRef.current.push(e.data); };
        mediaRecorderRef.current.onstop = () => { 
          if (!isInterviewActiveRef.current) { 
             const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
             setRecordedVideoBlob(blob);
             console.log("MediaRecorder stopped through onstop. Final blob size:", blob.size);
          } else {
              console.log("MediaRecorder onstop called, but interview still active. Ignoring blob processing here.");
          }
        };
        
        setStage("countdown");
        setCountdown(SESSION_COUNTDOWN_SECONDS);
        const countdownInterval = setInterval(() => {
          setCountdown(prev => {
            if (prev === null || prev <= 1) {
              clearInterval(countdownInterval);
              setStage("interviewing");
              if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "recording") {
                  mediaRecorderRef.current.start(); 
                  console.log("MediaRecorder started for the session.");
              }
              
              sessionTimerIdRef.current = setTimeout(() => {
                toast({ title: "Session Timeout", description: "The interview session has ended due to timeout."});
                handleFinishInterview();
              }, MAX_SESSION_DURATION_MS);
              return null;
            }
            return prev - 1;
          });
        }, 1000);
      } catch (err) {
        console.error("Error accessing media devices.", err);
        const error = err as Error;
        let desc = "Could not access camera/microphone. Please check permissions and ensure they are not in use by another app.";
        if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
            desc = "No camera/microphone found. Please ensure they are connected and enabled.";
        } else if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
            desc = "Permission to access camera/microphone was denied. Please enable it in your browser settings.";
        }
        setMediaError(desc);
        setCameraPermission(false);
        toast({ variant: "destructive", title: "Media Device Error", description: desc });
        isInterviewActiveRef.current = false; setStage("preparingStream"); 
      }
  }, [stage, toast, handleFinishInterview]);

  const resetFullInterview = useCallback(() => {
    cleanupResources();
    setStage("consent");
    setConsentGiven(false);
    setCountdown(null);
    setRecordedVideoBlob(null);
    setFeedbackResult(null);
    setMediaError(null);
    setCameraPermission(null);
  }, [cleanupResources]);

  useEffect(() => {
    if (consentGiven && stage === "consent") {
      setStage("preparingStream");
    }
  }, [consentGiven, stage]);

  useEffect(() => {
    if (stage === "preparingStream" && consentGiven) {
      if (!elevenLabsApiKey) {
        setMediaError("ElevenLabs API Key is not configured. Please set NEXT_PUBLIC_ELEVENLABS_API_KEY in your environment.");
        toast({variant: "destructive", title: "Configuration Error", description: "ElevenLabs API Key missing."});
        return;
      }
      startInterviewSession();
    }
  }, [stage, consentGiven, startInterviewSession, elevenLabsApiKey, toast]);

  useEffect(() => {
    return () => { 
      cleanupResources();
    };
  }, [cleanupResources]);

  const renderConsentDialog = () => (
    <Dialog open={stage === "consent"} onOpenChange={(open) => !open && stage === "consent" && setStage("consent")}>
      <DialogContent className="sm:max-w-md shadow-xl">
        <DialogHeader>
          <DialogTitle>Realtime AI Interview Consent</DialogTitle>
          <DialogDescription>
            This Realtime AI Interview requires access to your camera to record your video responses. 
            Your audio will be handled by the ElevenLabs AI Agent.
            The recording will begin after a short countdown and will last for the duration of the interview (up to {MAX_SESSION_DURATION_MS / 1000 / 60} minutes). 
            Your entire session will be analyzed by AI to provide you with comprehensive feedback.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center space-x-2 py-4">
          <Checkbox id="consent-checkbox" checked={consentGiven} onCheckedChange={(checked) => setConsentGiven(Boolean(checked))} />
          <Label htmlFor="consent-checkbox">I consent to video recording and interaction with the AI agent for this interview.</Label>
        </div>
        <DialogFooter>
          <Button type="button" onClick={() => {
            if(consentGiven) setStage("preparingStream");
            else toast({variant: "destructive", title: "Consent Required", description: "You must consent to proceed."})
          }} disabled={!consentGiven}>Start Interview</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  const renderInterviewContent = () => {
    if (!elevenLabsApiKey) {
      return (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Configuration Error</AlertTitle>
          <AlertDescription>
            The ElevenLabs API Key is missing. Please ensure `NEXT_PUBLIC_ELEVENLABS_API_KEY` is set in your environment variables.
            The AI Interview feature cannot start without it.
          </AlertDescription>
        </Alert>
      );
    }

    return (
      <div className="grid md:grid-cols-2 gap-6 items-start">
        <Card className="shadow-lg md:sticky md:top-20 h-full min-h-[400px] md:min-h-[calc(100vh-10rem)] flex flex-col">
          <CardHeader className="text-center">
             <BotMessageSquare className="h-10 w-10 text-primary mx-auto mb-2" />
            <CardTitle className="text-xl">Mira - Your AI Interviewer</CardTitle>
            <CardDescription>Agent ID: {elevenLabsAgentId}</CardDescription>
          </CardHeader>
          <CardContent className="flex-grow p-0 md:p-2">
            {stage === 'interviewing' && (
              <ElevenLabsProvider apiKey={elevenLabsApiKey}>
                <div className="h-full w-full overflow-y-auto rounded-md border border-input">
                   {/* The Chat component takes up available space. Its internal height might need to be managed by its own styling or props if available. */}
                  <Chat 
                    agentId={elevenLabsAgentId} 
                    // You might need to pass initial system prompt or context here if supported
                    // For example: systemPrompt={`You are Mira, conducting an interview for the ${jobContext.jobTitle} role. The candidate's resume mentions: ${jobContext.candidateResume}. The job description is: ${jobContext.jobDescription}. Start by introducing yourself and asking the candidate to tell you about themselves.`}
                  />
                </div>
              </ElevenLabsProvider>
            )}
            {(stage === 'preparingStream' || stage === 'countdown') && (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                    <Loader2 className="h-12 w-12 animate-spin text-primary mb-2" />
                    <p>{stage === 'countdown' ? "Get Ready..." : "Preparing Interview..."}</p>
                </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Film className="text-primary"/> Your Video
            </CardTitle>
             <CardDescription>
              {stage === 'countdown' && "Get ready! The interview will start after the countdown."}
              {stage === 'interviewing' && mediaRecorderRef.current?.state === "recording" && "Interview in progress..."}
              {stage === 'interviewing' && mediaRecorderRef.current?.state !== "recording" && "Preparing camera..."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="aspect-video w-full max-w-lg mx-auto bg-muted rounded-md flex items-center justify-center overflow-hidden relative shadow-inner border border-border">
              <video ref={videoPreviewRef} className="w-full h-full object-cover transform scale-x-[-1]" playsInline autoPlay muted />
              {stage === "preparingStream" && !streamRef.current && !mediaError && cameraPermission === null && <Loader2 className="absolute h-16 w-16 text-primary animate-spin" />}
              {stage === "countdown" && countdown !== null && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/70">
                    <div className="text-7xl font-bold text-white">{countdown}</div>
                </div>
              )}
              {mediaRecorderRef.current?.state === "recording" && (
                <div className="absolute top-2 left-2 bg-red-500 text-white p-1 px-2 rounded text-xs flex items-center animate-pulse">
                  <Timer className="h-4 w-4 mr-1" /> REC
                </div>
              )}
               {((cameraPermission === false || (!streamRef.current && videoPreviewRef.current?.srcObject === null)) &&
                 stage !== "preparingStream" && stage !== "countdown" && mediaRecorderRef.current?.state !== "recording" && !mediaError) && (
                   <Camera className="absolute h-24 w-24 text-muted-foreground" />
               )}
            </div>
            
            {(mediaError || cameraPermission === false) && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Media Error</AlertTitle>
                <AlertDescription>{mediaError || "Camera/microphone access was not granted or is unavailable."}</AlertDescription>
              </Alert>
            )}
          </CardContent>
          <CardFooter className="flex-col space-y-2">
            {stage === "interviewing" && (
              <Button onClick={handleFinishInterview} className="w-full" size="lg" variant="default">
                Finish Interview & Get Feedback
              </Button>
            )}
            {((stage === "preparingStream" && mediaError) || cameraPermission === false) && (
               <Button onClick={startInterviewSession} className="w-full" size="lg">
                  Try Again
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    );
  };

  const renderFeedbackSection = (title: string, content: string | undefined, icon: React.ReactNode) => (
    <Card className="shadow-md">
        <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">{icon}{title}</CardTitle>
        </CardHeader>
        <CardContent className="text-sm prose prose-sm max-w-none prose-strong:font-semibold prose-ul:list-disc prose-ul:pl-5 prose-li:ml-4">
             {formatFeedbackText(content)}
        </CardContent>
    </Card>
  );

  const renderFeedbackContent = () => (
    <div className="space-y-6 mt-6">
        <Card className="shadow-xl">
            <CardHeader>
                <CardTitle className="text-xl flex items-center"><CheckCircle className="mr-2 h-6 w-6 text-green-500"/> Interview Analysis Complete</CardTitle>
                <CardDescription>Here's a breakdown of your AI interview performance for the {jobContext.jobTitle} role.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {renderFeedbackSection("Overall Assessment", feedbackResult?.overallAssessment, <Brain className="mr-2 h-5 w-5 text-primary"/>)}
                {renderFeedbackSection("Key Strengths", feedbackResult?.keyStrengths, <ThumbsUp className="mr-2 h-5 w-5 text-green-500"/>)}
                {renderFeedbackSection("Areas for Improvement", feedbackResult?.areasForImprovement, <ThumbsDown className="mr-2 h-5 w-5 text-red-500"/>)}
                {renderFeedbackSection("Communication & Clarity", feedbackResult?.communicationClarity, <MessageSquare className="mr-2 h-5 w-5 text-blue-500"/>)}
                {renderFeedbackSection("Body Language & Presentation", feedbackResult?.bodyLanguageAnalysis, <User className="mr-2 h-5 w-5 text-purple-500"/>)}
                {renderFeedbackSection("Relevance to Role Context", feedbackResult?.relevanceToRole, <Star className="mr-2 h-5 w-5 text-yellow-500"/>)}
                {renderFeedbackSection("Hiring Recommendation Justification", feedbackResult?.hiringRecommendationJustification, <Users className="mr-2 h-5 w-5 text-indigo-500"/>)}

                {recordedVideoBlob && (
                <Card className="shadow-md">
                    <CardHeader><CardTitle className="text-lg flex items-center"><Film className="mr-2 h-5 w-5 text-primary"/> Review Your Interview</CardTitle></CardHeader>
                    <CardContent>
                         <video src={URL.createObjectURL(recordedVideoBlob)} controls className="w-full rounded-md shadow-inner aspect-video" />
                    </CardContent>
                </Card>
                )}
            </CardContent>
            <CardFooter>
                <Button onClick={resetFullInterview} className="w-full" size="lg">Start New AI Interview</Button>
            </CardFooter>
        </Card>
    </div>
  );

  return (
    <>
      {renderConsentDialog()}
      
      {stage === "submitting" && (
          <div className="text-center p-8 space-y-2">
              <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
              <p className="text-muted-foreground">AI is analyzing your interview... This may take a moment.</p>
          </div>
      )}

      {(stage === "preparingStream" || stage === "countdown" || stage === "interviewing") && renderInterviewContent()}
      {stage === "feedback" && feedbackResult && renderFeedbackContent()}
      
      {/* Render AudioPlayer outside the main flow, if ElevenLabsProvider wraps it. This is often for global playback controls. */}
      {elevenLabsApiKey && stage === 'interviewing' && (
          <ElevenLabsProvider apiKey={elevenLabsApiKey}>
            <AudioPlayer className="fixed bottom-4 right-4 z-[10000] opacity-50 hover:opacity-100 transition-opacity"/>
          </ElevenLabsProvider>
      )}
    </>
  );
}
