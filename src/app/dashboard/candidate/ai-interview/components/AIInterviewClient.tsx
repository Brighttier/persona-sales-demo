
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
const MAX_SESSION_DURATION_MS = 10 * 60 * 1000; // 10 minutes max for the session
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
  const streamRef = useRef<MediaStream | null>(null); // For camera and mic stream
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
    console.log("Cleaning up resources...");
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    if (sessionTimerIdRef.current) {
      clearTimeout(sessionTimerIdRef.current);
      sessionTimerIdRef.current = null;
    }

    if (mediaRecorderRef.current && (mediaRecorderRef.current.state === "recording" || mediaRecorderRef.current.state === "paused")) {
      console.log("Stopping MediaRecorder on cleanup...");
      mediaRecorderRef.current.onstop = null;
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {
        console.warn("Error stopping media recorder during cleanup:", e);
      }
    }
    mediaRecorderRef.current = null;
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
    
    const conv = conversationRef.current;
    if (conv && conv.status === "connected" && !isStartingSessionRef.current) {
        console.log("Attempting to end ElevenLabs session on cleanup (if connected and not starting).");
        conv.endSession().catch(e => console.error("Error ending ElevenLabs session on cleanup:", e));
    }
    isInterviewActiveRef.current = false;
    // isStartingSessionRef.current = false; // Should be managed by start/end of session attempt
  }, [/* No dependency on conversation directly */]);

  const submitForFinalFeedback = useCallback(async (videoBlob: Blob) => {
    if (!videoBlob) {
      toast({ variant: "destructive", title: "No Video Recorded", description: "Cannot submit feedback without a video." });
      setStage("consent"); 
      cleanupResources();
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
        setStage("consent");
        cleanupResources();
      }
    } catch (error) {
      console.error("Error getting feedback:", error);
      toast({ variant: "destructive", title: "Feedback Error", description: "Could not get AI feedback." });
      setStage("consent");
      cleanupResources();
    }
  }, [jobContext, toast, fullTranscript, cleanupResources]);

  const handleFinishInterview = useCallback(async () => {
    if (!isInterviewActiveRef.current && stage !== 'interviewing') {
      console.warn("Interview not active or not in interviewing stage during handleFinishInterview, finish aborted or already handled. Stage:", stage);
      if (stage !== 'submitting' && stage !== 'feedback') {
         // If somehow called in an invalid state, just try to cleanup and go to consent
        cleanupResources();
        setStage("consent");
      }
      return;
    }
    
    isInterviewActiveRef.current = false; 
    isStartingSessionRef.current = false;

    if (sessionTimerIdRef.current) {
      clearTimeout(sessionTimerIdRef.current);
      sessionTimerIdRef.current = null;
    }
    
    const conv = conversationRef.current;
    if (conv && conv.status === "connected") {
        console.log("Ending ElevenLabs session via Finish button.");
        try {
            await conv.endSession();
        } catch (e) {
            console.error("Error ending ElevenLabs session in handleFinishInterview:", e);
        }
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      console.log("Stopping MediaRecorder via handleFinishInterview...");
      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        console.log("MediaRecorder stopped, blob size:", blob.size);
        recordedChunksRef.current = [];
        if (blob.size > 0) {
            submitForFinalFeedback(blob);
        } else {
            toast({ variant: "destructive", title: "Recording Issue", description: "No video data was recorded. Please try again." });
            setStage("consent");
            // No need to call cleanupResources here as it's implied by reaching consent
        }
      };
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {
        console.warn("Error stopping media recorder in handleFinishInterview:", e);
        // If stop fails, we might have a problem. Still try to proceed to consent.
        setStage("consent");
      }
    } else if (recordedVideoBlob && recordedVideoBlob.size > 0 && stage !== 'submitting' && stage !== 'feedback') {
      console.log("MediaRecorder already stopped, submitting existing blob if available.");
      submitForFinalFeedback(recordedVideoBlob);
    } else {
      console.warn("No recording or blob found to submit, or already submitted/failed.");
      if(stage !== 'submitting' && stage !== 'feedback') {
        setStage("consent");
        toast({ variant: "destructive", title: "Recording Issue", description: "No video was recorded or found to submit." });
      }
    }
  }, [stage, recordedVideoBlob, submitForFinalFeedback, toast, cleanupResources]);


  const conversation = ElevenReact.useConversation({
    onConnect: () => {
      console.log("ElevenLabs agent connected.");
      toast({ title: "AI Interviewer Connected", description: "Mira is ready." });
      
      isInterviewActiveRef.current = true;
      isStartingSessionRef.current = false;
      setStage("interviewing");
      
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "recording") {
        try {
          mediaRecorderRef.current.start();
          console.log("Video recording started for the session.");
        } catch (e) {
            console.error("Error starting MediaRecorder in onConnect:", e);
            setMediaError("Failed to start video recording. Please try again.");
            toast({variant: "destructive", title: "Recording Error", description: "Could not start video recording."});
            handleFinishInterview(); // Attempt graceful shutdown
        }
      }
      sessionTimerIdRef.current = setTimeout(() => {
        if (isInterviewActiveRef.current) {
          toast({ title: "Session Timeout", description: "The interview session has ended due to timeout." });
          handleFinishInterview();
        }
      }, MAX_SESSION_DURATION_MS);
    },
    onDisconnect: () => {
      console.log("ElevenLabs agent disconnected.");
      if (isProcessingErrorRef.current) return; 

      if (isStartingSessionRef.current) {
        console.warn("ElevenLabs disconnected during session start attempt.");
        setMediaError("AI Interviewer disconnected during startup. Please try again.");
        toast({ variant: "destructive", title: "Connection Issue", description: "AI Interviewer disconnected during startup." });
        // Basic cleanup and reset to consent
        isStartingSessionRef.current = false;
        cleanupResources(); // Call cleanup without relying on handleFinishInterview here
        setStage("consent");
        setRecordedVideoBlob(null);
        setConversationMessages([]);
        setFullTranscript("");
        setCountdown(null);
        setCameraPermission(null);
        setMicPermission(null);
        return;
      }

      if (isInterviewActiveRef.current && stage === 'interviewing') { 
         toast({ title: "AI Interviewer Disconnected", variant: "destructive" });
         handleFinishInterview(); // This will attempt cleanup including ElevenLabs session
      }
      isStartingSessionRef.current = false;
    },
    onMessage: (message: any) => {
      console.log("ElevenLabs message:", message);
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
          console.warn("Error processing already in progress, skipping additional error handling.");
          return;
      }
      isProcessingErrorRef.current = true;
      
      console.error("ElevenLabs onError:", error);
      const errorMessage = error.message || "An unknown error occurred with the AI Agent.";
      setMediaError(`AI Agent Error: ${errorMessage}`);
      toast({ variant: "destructive", title: "AI Agent Error", description: errorMessage });

      // Clear timers directly
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      if (sessionTimerIdRef.current) clearTimeout(sessionTimerIdRef.current);
      countdownIntervalRef.current = null;
      sessionTimerIdRef.current = null;

      // Stop local media streams and recorder if they were started
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.onstop = null; // Remove listener
        try { mediaRecorderRef.current.stop(); } catch(e) { console.warn("Error stopping media recorder in onError", e); }
      }
      mediaRecorderRef.current = null;
      recordedChunksRef.current = [];

      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
       if (videoPreviewRef.current?.srcObject) {
        (videoPreviewRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
        videoPreviewRef.current.srcObject = null;
      }

      // Force reset to consent stage
      setStage("consent");
      setRecordedVideoBlob(null);
      setConversationMessages([]);
      setFullTranscript("");
      setCountdown(null);
      setCameraPermission(null); 
      setMicPermission(null);   
      isInterviewActiveRef.current = false;
      isStartingSessionRef.current = false;

      setTimeout(() => {
        isProcessingErrorRef.current = false;
      }, 1000); 
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
    if (stage !== "preparingStream") {
      console.warn("startInterviewSession called in unexpected stage:", stage);
      return;
    }
    
    setMediaError(null);
    setRecordedVideoBlob(null); // Clear previous recording
    setConversationMessages([]); // Clear previous messages
    setFullTranscript(""); // Clear previous transcript
    recordedChunksRef.current = [];
    isInterviewActiveRef.current = false;
    setFeedbackResult(null);
    setCameraPermission(null);
    setMicPermission(null);

    if (!elevenLabsApiKey) {
        setMediaError("Configuration Error: ElevenLabs API Key is missing.");
        toast({variant: "destructive", title: "Config Error", description: "ElevenLabs API Key missing."});
        setStage("consent"); return;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setMediaError("Media recording (camera/microphone) is not supported in this browser.");
      toast({ variant: "destructive", title: "Unsupported Browser", description: "Media recording not supported." });
      setStage("consent"); setCameraPermission(false); setMicPermission(false); return;
    }

    let tempStream: MediaStream | null = null;
    try {
      // 1. Get Camera Permission & Preview
      tempStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      setCameraPermission(true);
      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = tempStream;
        videoPreviewRef.current.muted = true; // Preview is always muted
        videoPreviewRef.current.play().catch(e => console.error("Preview play error", e));
      }

      // 2. Get Microphone Permission (for ElevenLabs)
      await navigator.mediaDevices.getUserMedia({ audio: true });
      setMicPermission(true);

      // 3. Get combined stream for MediaRecorder
      const fullStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      // Stop the temporary video-only stream if it's different
      if (tempStream && tempStream.id !== fullStream.id) {
          tempStream.getTracks().forEach(track => track.stop());
      }
      streamRef.current = fullStream; // Store the full stream for recorder and potential cleanup

      // Re-assign video preview if it got cleared or was using the temp stream
      if (videoPreviewRef.current && videoPreviewRef.current.srcObject !== streamRef.current) {
          const videoOnlyForPreview = new MediaStream(streamRef.current.getVideoTracks());
          videoPreviewRef.current.srcObject = videoOnlyForPreview;
          if (!videoPreviewRef.current.muted) videoPreviewRef.current.muted = true;
          videoPreviewRef.current.play().catch(e => console.error("Full stream preview play error", e));
      }
      
      mediaRecorderRef.current = new MediaRecorder(streamRef.current, { mimeType: 'video/webm' });
      mediaRecorderRef.current.ondataavailable = (e) => { if (e.data.size > 0) recordedChunksRef.current.push(e.data); };
      mediaRecorderRef.current.onstop = () => { 
          // This onstop is primarily for when recording is stopped by handleFinishInterview or error
          // The blob is processed there.
          console.log("MediaRecorder stopped. Chunks:", recordedChunksRef.current.length);
      };
      
      setStage("countdown");
      setCountdown(SESSION_COUNTDOWN_SECONDS);
      countdownIntervalRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev === null || prev <= 1) {
            if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
            
            isStartingSessionRef.current = true;
            console.log("Starting ElevenLabs session...");
            conversation.startSession({ agentId: ELEVENLABS_AGENT_ID })
              .then(conversationId => {
                console.log("ElevenLabs session initialization request sent, ID:", conversationId);
                // onConnect callback will handle setting stage to 'interviewing' and starting recorder
              })
              .catch(err => { 
                console.error("Failed to start ElevenLabs session (in startInterviewSession .catch):", err);
                setMediaError(`Failed to start AI Agent: ${err.message}`);
                toast({variant: "destructive", title: "AI Agent Error", description: "Could not connect to the AI interviewer."});
                isStartingSessionRef.current = false;
                cleanupResources(); // Cleanup media resources
                setStage("consent"); // Reset to consent
              });
            return null;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      console.error("Error accessing media devices.", err);
      const error = err as Error;
      let desc = "Could not access media devices. Please check permissions.";
      if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") desc = "No camera or microphone found.";
      else if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") desc = "Permission to access camera/microphone was denied.";
      setMediaError(desc);
      if (!cameraPermission) setCameraPermission(false); // If error before mic check
      if (!micPermission) setMicPermission(false);
      toast({ variant: "destructive", title: "Media Error", description: desc });
      
      if (tempStream) tempStream.getTracks().forEach(track => track.stop());
      if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop()); // Clean up full stream if obtained
      streamRef.current = null;
      
      setStage("consent");
    }
  }, [stage, toast, elevenLabsApiKey, conversation]); 

  const resetFullInterview = useCallback(() => {
    cleanupResources(); // This will attempt to end ElevenLabs session if active
    setStage("consent");
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
  }, [cleanupResources]);

  useEffect(() => {
    // ComponentWillUnmount
    return () => {
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
                setStage("preparingStream");
                // Call startInterviewSession directly after setting stage
                // This ensures permissions are requested before starting.
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
              {conversation.isSpeaking && <Volume2 className="h-6 w-6 text-accent animate-pulse" />}
            </div>
            <CardDescription>Status: {conversation.status || "Initializing..."}</CardDescription>
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
             {cameraPermission === false && stage === 'consent' && <AlertDescription>Camera permission is needed for video recording.</AlertDescription>}
             {micPermission === false && stage === 'consent' && <AlertDescription>Microphone permission is needed for the AI Agent.</AlertDescription>}
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

