
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Camera, CheckCircle, Loader2, Timer, AlertCircle, BotMessageSquare, User, Film, Brain, ThumbsUp, ThumbsDown, MessageSquare as MessageSquareIcon, Star, Users as UsersIcon, Volume2, Mic, MicOff } from "lucide-react";
import { useEffect, useRef, useState, useCallback } from "react";
import * as ElevenReact from '@11labs/react';

import type { AiInterviewSimulationInput, AiInterviewSimulationOutput } from "@/ai/flows/ai-interview-simulation";
import { aiInterviewSimulation } from "@/ai/flows/ai-interview-simulation";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface AIInterviewClientProps {
  jobContext: {
    jobTitle: string;
    jobDescription: string;
    candidateResume: string;
  };
}

type InterviewStage = "consent" | "preparingStream" | "countdown" | "interviewing" | "submitting" | "feedback";
type Message = { sender: "user" | "agent"; text: string; timestamp: number };

const SESSION_COUNTDOWN_SECONDS = 3;
const MAX_SESSION_DURATION_MS = 10 * 60 * 1000; 
const ELEVENLABS_AGENT_ID = "EVQJtCNSo0L6uHQnImQu";

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
  const [fullTranscript, setFullTranscript] = useState<string>("");

  const [mediaError, setMediaError] = useState<string | null>(null);
  const [cameraPermission, setCameraPermission] = useState<boolean | null>(null);
  const [micPermission, setMicPermission] = useState<boolean | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const videoPreviewRef = useRef<HTMLVideoElement | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const sessionTimerIdRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const isInterviewActiveRef = useRef(false);
  const isStartingSessionRef = useRef(false);
  const isProcessingErrorRef = useRef(false);
  const chatMessagesEndRef = useRef<HTMLDivElement | null>(null);

  const [conversationMessages, setConversationMessages] = useState<Message[]>([]);
  const elevenLabsApiKey = process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY;

  const conversationRef = useRef<ReturnType<typeof ElevenReact.useConversation> | null>(null);

  const cleanupResources = useCallback(() => {
    console.log("Cleanup: Starting cleanup...");
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
      console.log("Cleanup: Cleared countdown interval.");
    }
    if (sessionTimerIdRef.current) {
      clearTimeout(sessionTimerIdRef.current);
      sessionTimerIdRef.current = null;
      console.log("Cleanup: Cleared session timer.");
    }

    if (mediaRecorderRef.current) {
      if (mediaRecorderRef.current.state === "recording" || mediaRecorderRef.current.state === "paused") {
        console.log("Cleanup: Stopping MediaRecorder.");
        mediaRecorderRef.current.onstop = null; 
        mediaRecorderRef.current.ondataavailable = null;
        try { mediaRecorderRef.current.stop(); } catch (e) { console.warn("Cleanup: Error stopping media recorder:", e); }
      }
      mediaRecorderRef.current = null;
    }
    recordedChunksRef.current = [];

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
      console.log("Cleanup: Stopped media stream tracks.");
    }
    if (videoPreviewRef.current && videoPreviewRef.current.srcObject) {
      const stream = videoPreviewRef.current.srcObject as MediaStream;
      stream?.getTracks().forEach(track => track.stop());
      videoPreviewRef.current.srcObject = null;
      console.log("Cleanup: Cleared video preview srcObject.");
    }
    
    const conv = conversationRef.current;
    if (conv && conv.status === "connected") { 
        console.log("Cleanup: Attempting to end ElevenLabs session.");
        conv.endSession().catch(e => console.error("Cleanup: Error ending ElevenLabs session:", e));
    }
    isInterviewActiveRef.current = false;
    console.log("Cleanup: Finished cleanup.");
  }, [/* conversationRef is accessed via .current */]);

  const resetFullInterview = useCallback(() => {
    console.log("resetFullInterview called.");
    cleanupResources(); 
    setStage("consent"); // Ensure stage is consent first
    setConsentGiven(false);
    setCountdown(null);
    setRecordedVideoBlob(null);
    setFeedbackResult(null);
    setMediaError(null);
    setCameraPermission(null);
    setMicPermission(null);
    setConversationMessages([]);
    setFullTranscript("");
    isProcessingErrorRef.current = false;
    isStartingSessionRef.current = false;
    isInterviewActiveRef.current = false;
  }, [cleanupResources]);


  const submitForFinalFeedback = useCallback(async (videoBlob: Blob) => {
    if (!videoBlob || videoBlob.size === 0) {
      toast({ variant: "destructive", title: "No Video Recorded", description: "Cannot submit feedback without a valid video." });
      resetFullInterview(); // Go back to clean consent state
      return;
    }
    setStage("submitting");
    try {
      const reader = new FileReader();
      reader.readAsDataURL(videoBlob);
      reader.onloadend = async () => {
        const videoDataUri = reader.result as string;
        const input: AiInterviewSimulationInput = {
          jobDescription: jobContext.jobDescription,
          candidateResume: jobContext.candidateResume,
          videoDataUri,
          fullTranscript: fullTranscript || "No transcript captured from AI agent.",
        };
        const result = await aiInterviewSimulation(input);
        setFeedbackResult(result);
        setStage("feedback");
        toast({ title: "Feedback Received!", description: "AI has analyzed your interview." });
      };
      reader.onerror = () => {
        toast({ variant: "destructive", title: "File Read Error", description: "Could not process video for submission." });
        resetFullInterview();
      }
    } catch (error) {
      console.error("Error getting feedback:", error);
      toast({ variant: "destructive", title: "Feedback Error", description: "Could not get AI feedback." });
      resetFullInterview();
    }
  }, [jobContext, toast, fullTranscript, resetFullInterview]);

  const handleFinishInterview = useCallback(async () => {
    console.log("handleFinishInterview called. Stage:", stage, "isInterviewActive:", isInterviewActiveRef.current);
    if (stage === 'submitting' || stage === 'feedback' || stage === 'consent') {
      console.warn("handleFinishInterview: Called in terminal or consent stage. Aborting.");
      return;
    }
    if (!isInterviewActiveRef.current && stage !== 'interviewing' && stage !== 'countdown') {
      console.warn("handleFinishInterview: Interview not active or not in appropriate stage. Resetting.");
      resetFullInterview();
      return;
    }
    
    isInterviewActiveRef.current = false; 

    if (sessionTimerIdRef.current) { clearTimeout(sessionTimerIdRef.current); sessionTimerIdRef.current = null; }
    if (countdownIntervalRef.current) { clearInterval(countdownIntervalRef.current); countdownIntervalRef.current = null; }
    
    const conv = conversationRef.current;
    if (conv && conv.status === "connected") {
        console.log("handleFinishInterview: Ending ElevenLabs session.");
        try { await conv.endSession(); } catch (e) { console.error("handleFinishInterview: Error ending EL session:", e); }
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      console.log("handleFinishInterview: Stopping MediaRecorder.");
      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        recordedChunksRef.current = []; 
        setRecordedVideoBlob(blob); 
        if (blob.size > 0) { submitForFinalFeedback(blob); } 
        else { 
          toast({ variant: "destructive", title: "Recording Issue", description: "No video data recorded." });
          resetFullInterview();
        }
        mediaRecorderRef.current = null;
      };
      try { mediaRecorderRef.current.stop(); } catch (e) {
        console.warn("handleFinishInterview: Error stopping media recorder:", e);
        toast({ variant: "destructive", title: "Recording Issue", description: "Problem stopping video." });
        resetFullInterview();
      }
    } else if (recordedVideoBlob && recordedVideoBlob.size > 0) {
      console.log("handleFinishInterview: Submitting existing blob.");
      submitForFinalFeedback(recordedVideoBlob);
    } else {
      console.warn("handleFinishInterview: No recording or blob to submit.");
      toast({ variant: "destructive", title: "Recording Issue", description: "No video to submit." });
      resetFullInterview();
    }
  }, [stage, recordedVideoBlob, submitForFinalFeedback, toast, resetFullInterview]);


  const conversation = ElevenReact.useConversation({
    onConnect: () => {
      console.log("EL onConnect: Agent connected.");
      toast({ title: "AI Interviewer Connected", description: "Mira is ready." });
      
      isInterviewActiveRef.current = true;
      isStartingSessionRef.current = false; 
      setStage("interviewing");
      
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "recording") {
        try {
          mediaRecorderRef.current.start();
          console.log("EL onConnect: Video recording started.");
        } catch (e) {
            console.error("EL onConnect: Error starting MediaRecorder:", e);
            setMediaError("Failed to start video recording.");
            toast({variant: "destructive", title: "Recording Error", description: "Could not start video recording."});
            
            isProcessingErrorRef.current = true;
            if (conversationRef.current && conversationRef.current.status === "connected") {
              conversationRef.current.endSession().catch(err => console.error("EL onConnect: Error ending EL session after mediarecorder fail:", err));
            }
            // cleanupResources(); // Less direct, rely on onError/onDisconnect if triggered
            // Direct reset:
            resetFullInterview();
            setTimeout(() => { isProcessingErrorRef.current = false; }, 1500); // Allow error processing to settle
        }
      }
      sessionTimerIdRef.current = setTimeout(() => {
        if (isInterviewActiveRef.current) {
          toast({ title: "Session Timeout", description: "Interview ended due to timeout." });
          handleFinishInterview();
        }
      }, MAX_SESSION_DURATION_MS);
    },
    onDisconnect: () => {
      console.log("EL onDisconnect: Agent disconnected.");
      if (isProcessingErrorRef.current) {
          console.warn("EL onDisconnect: Error processing is active, onDisconnect action skipped.");
          return;
      }
      if (isStartingSessionRef.current) { 
          console.warn("EL onDisconnect: Disconnected during session startup. isStartingSessionRef is true.");
          isStartingSessionRef.current = false; 
          resetFullInterview(); // Force full reset
          return;
      }
      if (isInterviewActiveRef.current && (stage === 'interviewing' || stage === 'countdown')) { 
         toast({ title: "AI Interviewer Disconnected", variant: "destructive" });
         handleFinishInterview(); 
      }
    },
    onMessage: (message: any) => {
      console.log("EL onMessage:", message);
      let sender: 'user' | 'agent' = 'agent';
      let textContent = '';

      if (message.type === 'user_transcript' && message.text) { 
        sender = 'user';
        textContent = message.text;
      } else if (message.type === 'agent_response' && message.text) {
        sender = 'agent';
        textContent = message.text;
      } else if (typeof message.text === 'string' && !message.type) { 
        textContent = message.text;
        const conv = conversationRef.current;
        if (conv && !conv.isSpeaking) sender = 'user';
      } else if (message.audio && message.text) { 
        sender = 'agent';
        textContent = message.text;
      }

      if (textContent) {
        setConversationMessages(prev => [...prev, { sender, text: textContent, timestamp: Date.now() }]);
        setFullTranscript(prev => prev + `\n${sender === 'user' ? 'Candidate' : 'Mira'}: ${textContent}`);
      }
    },
    onError: (error: Error) => {
      if (isProcessingErrorRef.current) {
          console.warn("EL onError: Error processing already in progress. Skipping.");
          return;
      }
      isProcessingErrorRef.current = true;
      
      console.error("EL onError:", error);
      const errorMessage = error.message || "AI Agent error.";
      setMediaError(`AI Agent Error: ${errorMessage}`);
      toast({ variant: "destructive", title: "AI Agent Error", description: errorMessage });

      resetFullInterview(); // Perform a full reset

      setTimeout(() => { isProcessingErrorRef.current = false; }, 1500);
    },
  });

  useEffect(() => {
    conversationRef.current = conversation;
  }, [conversation]);


  const scrollToBottom = () => {
    chatMessagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [conversationMessages]);


  const startInterviewSession = useCallback(async () => {
    console.log("startInterviewSession: Attempting. isStarting:", isStartingSessionRef.current, "isProcessingError:", isProcessingErrorRef.current);
    if (isStartingSessionRef.current || isProcessingErrorRef.current) {
        console.warn("startInterviewSession: Aborted, already starting or processing error.");
        if(isStartingSessionRef.current) toast({title: "Session Start In Progress", description: "Please wait..."});
        return;
    }
    if (stage !== "preparingStream") {
      console.warn("startInterviewSession: Called in unexpected stage:", stage);
      return;
    }
    
    // Minimal state reset here, full reset is done by resetFullInterview if called by button
    setMediaError(null); 
    recordedChunksRef.current = []; 
    isInterviewActiveRef.current = false;
    setFeedbackResult(null); 

    if (!elevenLabsApiKey) {
        setMediaError("Config Error: ElevenLabs API Key missing.");
        toast({variant: "destructive", title: "Config Error", description: "ElevenLabs API Key missing."});
        setStage("consent"); return;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setMediaError("Media recording not supported.");
      toast({ variant: "destructive", title: "Unsupported Browser", description: "Media recording not supported." });
      setStage("consent"); setCameraPermission(false); setMicPermission(false); return;
    }

    isStartingSessionRef.current = true; // Set flag: attempting to start session
    let tempCombinedStream: MediaStream | null = null;

    try {
      tempCombinedStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setCameraPermission(true);
      setMicPermission(true);
      console.log("startInterviewSession: Media permissions granted.");

      if (videoPreviewRef.current && tempCombinedStream.getVideoTracks().length > 0) {
        const previewStream = new MediaStream([tempCombinedStream.getVideoTracks()[0]]);
        videoPreviewRef.current.srcObject = previewStream;
        videoPreviewRef.current.muted = true;
        videoPreviewRef.current.play().catch(e => console.error("Preview play error", e));
      }
      
      streamRef.current = tempCombinedStream;

      mediaRecorderRef.current = new MediaRecorder(streamRef.current, { mimeType: 'video/webm' });
      mediaRecorderRef.current.ondataavailable = (e) => { if (e.data.size > 0) recordedChunksRef.current.push(e.data); };
      mediaRecorderRef.current.onstop = () => { console.log("MediaRecorder onstop (global handler)."); };
      
      setStage("countdown");
      setCountdown(SESSION_COUNTDOWN_SECONDS);
      countdownIntervalRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev === null || prev <= 1) {
            if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
            
            console.log("startInterviewSession: Countdown finished. Starting ElevenLabs session.");
            if (conversationRef.current) {
              conversationRef.current.startSession({ agentId: ELEVENLABS_AGENT_ID })
                .then(conversationId => {
                  console.log("startInterviewSession: EL session init request sent, ID:", conversationId);
                  // onConnect will handle isStartingSessionRef = false and other state changes
                })
                .catch(err => { 
                  console.error("startInterviewSession: Failed to start EL session:", err);
                  setMediaError(`AI Agent Error: ${err.message}`);
                  toast({variant: "destructive", title: "AI Agent Error", description: "Could not connect."});
                  
                  isProcessingErrorRef.current = true; // Mark error processing
                  cleanupResources(); // Cleanup media resources
                  setStage("consent"); // Go back to consent
                  isStartingSessionRef.current = false; // Reset flag: attempt failed
                  setTimeout(() => { isProcessingErrorRef.current = false; }, 1500);
                });
            }
            return null;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      console.error("startInterviewSession: Error accessing media devices.", err);
      const error = err as Error;
      let desc = "Media device error. Check permissions.";
      if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") desc = "No camera/mic found.";
      else if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") desc = "Camera/mic permission denied.";
      
      setMediaError(desc); setCameraPermission(false); setMicPermission(false);
      toast({ variant: "destructive", title: "Media Error", description: desc });
      
      if (tempCombinedStream) tempCombinedStream.getTracks().forEach(track => track.stop());
      streamRef.current = null;
      
      setStage("consent");
      isStartingSessionRef.current = false; // Reset flag: attempt failed
    }
  }, [stage, toast, elevenLabsApiKey, cleanupResources, resetFullInterview /* conversationRef is implicitly used */]); 

  useEffect(() => {
    return () => {
      console.log("AIInterviewClient: Unmounting. Performing cleanup.");
      cleanupResources();
    };
  }, [cleanupResources]);


  const renderConsentDialog = () => (
    <Dialog open={stage === "consent"}>
      <DialogContent className="sm:max-w-md shadow-xl">
        <DialogHeader>
          <DialogTitle>Realtime AI Interview Consent</DialogTitle>
          <DialogDescription>
            This Realtime AI Interview requires access to your camera (for video recording) and microphone (for interacting with the AI interviewer).
            The recording will begin after a short countdown and will last for the duration of the interview (up to {MAX_SESSION_DURATION_MS / 1000 / 60} minutes).
            Your entire session (video and conversation transcript) will be analyzed by AI to provide you with comprehensive feedback.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center space-x-2 py-4">
          <Checkbox id="consent-checkbox" checked={consentGiven} onCheckedChange={(checked) => setConsentGiven(Boolean(checked))} />
          <Label htmlFor="consent-checkbox">I consent to video recording and microphone usage for this AI interview.</Label>
        </div>
        <DialogFooter>
          <Button type="button" onClick={() => {
            if (consentGiven) {
                resetFullInterview(); // Call full reset *before* starting a new attempt
                setStage("preparingStream");
                // startInterviewSession() will be called AFTER stage is preparingStream by the useEffect below
                // No, call it directly here. The useEffect approach was removed.
                startInterviewSession(); 
            } else {
                toast({ variant: "destructive", title: "Consent Required", description: "You must consent to proceed." });
            }
          }} disabled={!consentGiven}>Start Interview</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  const renderInterviewContent = () => {
    if (!elevenLabsApiKey && stage !== "consent") {
      return (
        <Alert variant="destructive" className="shadow-lg">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Configuration Error</AlertTitle>
          <AlertDescription>
            The ElevenLabs API Key is missing. Please set NEXT_PUBLIC_ELEVENLABS_API_KEY.
          </AlertDescription>
        </Alert>
      );
    }
    
    return (
      <div className="grid md:grid-cols-2 gap-6 items-start">
        <Card className="shadow-lg md:sticky md:top-20 h-full min-h-[400px] md:min-h-[calc(100vh-10rem)] flex flex-col">
          <CardHeader className="text-center border-b pb-3">
            <div className="flex items-center justify-center gap-2">
              <BotMessageSquare className="h-8 w-8 text-primary" />
              <CardTitle className="text-xl">Mira - Your AI Interviewer</CardTitle>
              {conversationRef.current?.isSpeaking && <Volume2 className="h-6 w-6 text-accent animate-pulse" />}
            </div>
            <CardDescription>Status: {conversationRef.current?.status || "Initializing..."}</CardDescription>
          </CardHeader>
          <CardContent className="flex-grow p-0 relative">
            {(stage === 'interviewing' || stage === 'submitting') && (
              <div className="h-[300px] md:h-full w-full overflow-y-auto p-4 space-y-3">
                {conversationMessages.map((msg, index) => (
                  <div key={msg.timestamp + '-' + index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`p-2 px-3 rounded-lg max-w-[80%] text-sm shadow-md ${msg.sender === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
                <div ref={chatMessagesEndRef} />
              </div>
            )}
            {(stage === 'preparingStream' || stage === 'countdown') && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground bg-background/80 z-10">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-2" />
                <p>{stage === 'countdown' ? "Get Ready..." : (cameraPermission === null || micPermission === null) ? "Requesting Permissions..." : "Preparing Interview..."}</p>
              </div>
            )}
            {stage !== 'interviewing' && stage !== 'submitting' && stage !== 'preparingStream' && stage !== 'countdown' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
                <Mic className="h-12 w-12 text-primary mb-2" />
                <p>The AI Interviewer will appear here.</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Film className="text-primary" /> Your Video
            </CardTitle>
            <CardDescription>
              {stage === 'countdown' && "Get ready! The interview will start after the countdown."}
              {stage === 'interviewing' && mediaRecorderRef.current?.state === "recording" && "Interview in progress..."}
              {stage === 'interviewing' && mediaRecorderRef.current?.state !== "recording" && "Connecting..."}
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

            {(mediaError || cameraPermission === false || micPermission === false) && stage !== "consent" && (
              <Alert variant="destructive" className="shadow-md">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Media Error</AlertTitle>
                <AlertDescription>{mediaError || "Camera/microphone access was not granted or is unavailable."}</AlertDescription>
              </Alert>
            )}
             {(cameraPermission === false && stage === 'consent') && <AlertDescription>Camera permission is needed for video recording.</AlertDescription>}
             {(micPermission === false && stage === 'consent') && <AlertDescription>Microphone permission is needed for the AI Agent.</AlertDescription>}
          </CardContent>
          <CardFooter className="flex-col space-y-2">
            {stage === "interviewing" && (
              <Button onClick={handleFinishInterview} className="w-full" size="lg" variant="default">
                Finish Interview & Get Feedback
              </Button>
            )}
            {((stage === "preparingStream" && mediaError) || cameraPermission === false || micPermission === false) && stage !== "consent" && (
               <Button onClick={resetFullInterview} className="w-full" size="lg" variant="outline">
                Back to Consent & Retry
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
          <CardTitle className="text-xl flex items-center"><CheckCircle className="mr-2 h-6 w-6 text-green-500" /> Interview Analysis Complete</CardTitle>
          <CardDescription>Here's a breakdown of your AI interview performance for the {jobContext.jobTitle} role.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {feedbackResult?.overallAssessment && renderFeedbackSection("Overall Assessment", feedbackResult.overallAssessment, <Brain className="mr-2 h-5 w-5 text-primary" />)}
          {feedbackResult?.keyStrengths && renderFeedbackSection("Key Strengths", feedbackResult.keyStrengths, <ThumbsUp className="mr-2 h-5 w-5 text-green-500" />)}
          {feedbackResult?.areasForImprovement && renderFeedbackSection("Areas for Improvement", feedbackResult.areasForImprovement, <ThumbsDown className="mr-2 h-5 w-5 text-red-500" />)}
          {feedbackResult?.communicationClarity && renderFeedbackSection("Communication & Clarity", feedbackResult.communicationClarity, <MessageSquareIcon className="mr-2 h-5 w-5 text-blue-500" />)}
          {feedbackResult?.bodyLanguageAnalysis && renderFeedbackSection("Body Language & Presentation", feedbackResult.bodyLanguageAnalysis, <User className="mr-2 h-5 w-5 text-purple-500" />)}
          {feedbackResult?.relevanceToRole && renderFeedbackSection("Relevance to Role Context", feedbackResult.relevanceToRole, <Star className="mr-2 h-5 w-5 text-yellow-500" />)}
          {feedbackResult?.hiringRecommendationJustification && renderFeedbackSection("Hiring Recommendation Justification", feedbackResult.hiringRecommendationJustification, <UsersIcon className="mr-2 h-5 w-5 text-indigo-500" />)}

          {recordedVideoBlob && (
            <Card className="shadow-md">
              <CardHeader><CardTitle className="text-lg flex items-center"><Film className="mr-2 h-5 w-5 text-primary" /> Review Your Interview</CardTitle></CardHeader>
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
    </>
  );
}

