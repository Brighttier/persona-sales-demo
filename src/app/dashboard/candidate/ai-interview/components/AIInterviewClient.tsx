
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Camera, CheckCircle, Loader2, Timer, AlertCircle, BotMessageSquare, User, Film, Brain, ThumbsUp, ThumbsDown, MessageSquare as MessageSquareIcon, Star, Users as UsersIcon, Mic, Volume2 } from "lucide-react";
import { useEffect, useRef, useState, useCallback } from "react";
import * as ElevenReact from '@11labs/react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { cn } from "@/lib/utils";
import AIInterviewConsent from "./AIInterviewConsent";

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
  const lines = text.split(/\\n|\n/g);
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
    const bulletMatch = trimmedLine.match(/^([*•-])\s?(.*)/);

    if (bulletMatch) {
      const itemText = bulletMatch[2];
      listItems.push(<li key={`li-${index}`} className="ml-4">{renderTextWithBold(itemText, `li-${index}`)}</li>);
    } else {
      if (listItems.length > 0) {
        output.push(<ul key={`ul-${output.length}`} className="list-disc pl-5 space-y-1 my-2">{listItems}</ul>);
        listItems = [];
      }
      if (trimmedLine) {
        const headingMatch = trimmedLine.match(/^([\w\s&]+:)/);
        if (headingMatch && lines[index+1] && lines[index+1].trim().match(/^([*•-])\s?/)) {
           output.push(<p key={`p-${index}`} className="my-2">{renderTextWithBold(trimmedLine, `p-${index}`)}</p>);
        } else if (headingMatch) {
            output.push(<p key={`p-${index}`} className="my-2 font-semibold">{renderTextWithBold(trimmedLine, `p-${index}`)}</p>);
        } else {
            output.push(<p key={`p-${index}`} className="my-2">{renderTextWithBold(trimmedLine, `p-${index}`)}</p>);
        }
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
  const router = useRouter();
  const { role } = useAuth();

  const [stage, setStage] = useState<InterviewStage>("consent");
  const [countdown, setCountdown] = useState<number | null>(null);
  const [recordedVideoBlob, setRecordedVideoBlob] = useState<Blob | null>(null);
  const [feedbackResult, setFeedbackResult] = useState<AiInterviewSimulationOutput | null>(null);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [cameraPermission, setCameraPermission] = useState<boolean | null>(null);
  const [micPermission, setMicPermission] = useState<boolean | null>(null);
  const [conversationMessages, setConversationMessages] = useState<Message[]>([]);
  const [fullTranscript, setFullTranscript] = useState<string>("");
  const [elevenLabsFatalError, setElevenLabsFatalError] = useState(false);


  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const videoPreviewRef = useRef<HTMLVideoElement | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const previewStreamRef = useRef<MediaStream | null>(null);
  const combinedStreamRef = useRef<MediaStream | null>(null);
  const sessionTimerIdRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const isProcessingErrorRef = useRef(false);
  const isStartingSessionRef = useRef(false);
  const isInterviewActiveRef = useRef(false);
  const isIntentionalDisconnectRef = useRef(false);
  const stageRef = useRef(stage);
  useEffect(() => { stageRef.current = stage; }, [stage]);

  const elevenLabsApiKey = process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY;

  const resetFullInterview = useCallback(() => {
    console.log("ResetFullInterview: Resetting states and refs...");
    setStage("consent");
    setCountdown(null);
    setRecordedVideoBlob(null);
    setFeedbackResult(null);
    setMediaError(null);
    setCameraPermission(null);
    setMicPermission(null);
    setConversationMessages([]);
    setFullTranscript("");
    setElevenLabsFatalError(false); // Reset fatal error flag

    isStartingSessionRef.current = false;
    isInterviewActiveRef.current = false;
    isIntentionalDisconnectRef.current = false;
    // isProcessingErrorRef is reset asynchronously in error handlers
    console.log("ResetFullInterview: UI states and refs reset.");
  }, []);

  const cleanupResources = useCallback(() => {
    console.log("CleanupResources: Starting cleanup...");
    if (countdownIntervalRef.current) { clearInterval(countdownIntervalRef.current); countdownIntervalRef.current = null; }
    if (sessionTimerIdRef.current) { clearTimeout(sessionTimerIdRef.current); sessionTimerIdRef.current = null; }

    const conv = conversationRef.current;
    if (conv && conv.status === "connected") {
        console.log("CleanupResources: Attempting to end EL session.");
        isIntentionalDisconnectRef.current = true;
        conv.endSession().catch(e => console.error("CleanupResources: Error ending EL session:", e))
                         .finally(() => { isIntentionalDisconnectRef.current = false; });
    } else { console.log("CleanupResources: EL session not connected or already cleaned up."); }

    if (mediaRecorderRef.current) {
      if (mediaRecorderRef.current.state === "recording" || mediaRecorderRef.current.state === "paused") {
        console.log("CleanupResources: Attempting to stop MediaRecorder. State:", mediaRecorderRef.current.state);
        try { mediaRecorderRef.current.stop(); } catch (e) { console.warn("CleanupResources: Error stopping media recorder:", e); }
      } else { console.log("CleanupResources: MediaRecorder not recording or already stopped. State:", mediaRecorderRef.current.state); }
      mediaRecorderRef.current.ondataavailable = null; mediaRecorderRef.current.onstop = null; mediaRecorderRef.current.onerror = null;
      mediaRecorderRef.current = null;
    }

    if (previewStreamRef.current) { previewStreamRef.current.getTracks().forEach(track => track.stop()); previewStreamRef.current = null; }
    if (combinedStreamRef.current) { combinedStreamRef.current.getTracks().forEach(track => track.stop()); combinedStreamRef.current = null; }
    if (videoPreviewRef.current && videoPreviewRef.current.srcObject) {
      const stream = videoPreviewRef.current.srcObject as MediaStream; stream?.getTracks().forEach(track => track.stop()); videoPreviewRef.current.srcObject = null;
    }
    isInterviewActiveRef.current = false;
    console.log("CleanupResources: Finished.");
  }, []); // conversationRef removed from deps, will be accessed via current

  const conversation = ElevenReact.useConversation({
    onConnect: useCallback(() => {
      if (isProcessingErrorRef.current) { console.warn("EL onConnect: Prevented due to active error processing."); isStartingSessionRef.current = false; return; }
      console.log("EL onConnect: Agent connected. Setting up MediaRecorder.");
      toast({ title: "AI Interviewer Connected", description: "Mira is ready." });

      isStartingSessionRef.current = false;
      isInterviewActiveRef.current = true;
      setStage("interviewing");
      setElevenLabsFatalError(false); // Clear any previous fatal error

      if (!combinedStreamRef.current) {
        console.error("EL onConnect: combinedStreamRef is null. Cannot start MediaRecorder.");
        setMediaError("Media stream for recording not available.");
        toast({ variant: "destructive", title: "Recording Error", description: "Failed to initialize video recorder." });
        cleanupResources();
        resetFullInterview(); // Go back to consent
        return;
      }

      try {
          console.log("EL onConnect: Initializing MediaRecorder with combinedStream.");
          mediaRecorderRef.current = new MediaRecorder(combinedStreamRef.current, { mimeType: 'video/webm' });
          recordedChunksRef.current = [];
          mediaRecorderRef.current.ondataavailable = (event) => { if (event.data.size > 0) { recordedChunksRef.current.push(event.data); }};
          mediaRecorderRef.current.onstop = () => {
              console.log("MediaRecorder onstop triggered. Number of chunks:", recordedChunksRef.current.length);
              const newBlob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
              console.log("MediaRecorder onstop: New blob created. Size:", newBlob.size);
              setRecordedVideoBlob(newBlob);
              if (newBlob.size > 0 && (stageRef.current === 'interviewing' || stageRef.current === 'submitting' || isIntentionalDisconnectRef.current)) {
                  if (stageRef.current !== 'feedback' && stageRef.current !== 'submitting') { submitForFinalFeedback(newBlob); }
              } else if (newBlob.size === 0 && (stageRef.current === 'interviewing' || stageRef.current === 'submitting')) {
                  toast({ variant: "destructive", title: "Recording Issue", description: "No video data was recorded." });
                  if (!isProcessingErrorRef.current) { cleanupResources(); resetFullInterview(); }
              }
              recordedChunksRef.current = [];
          };
          mediaRecorderRef.current.onerror = (event: Event) => {
              console.error("MediaRecorder error during recording:", event);
              let errorMsg = "Video recording error. Please try again.";
              if (event instanceof DOMException) { errorMsg = `Video recording error: ${event.name} - ${event.message}.`; }
              setMediaError(errorMsg);
              toast({ variant: "destructive", title: "Recording Error", description: errorMsg });
              cleanupResources(); resetFullInterview();
          };
          mediaRecorderRef.current.start(1000);
          console.log("EL onConnect: MediaRecorder started with combinedStream. State:", mediaRecorderRef.current.state);
          if (sessionTimerIdRef.current) clearTimeout(sessionTimerIdRef.current);
          sessionTimerIdRef.current = setTimeout(() => { if (isInterviewActiveRef.current) { toast({ title: "Session Timeout", description: "Interview ended due to timeout." }); handleFinishInterview(); }}, MAX_SESSION_DURATION_MS);
      } catch (e) {
          console.error("EL onConnect: Error initializing or starting MediaRecorder:", e);
          const error = e as Error;
          setMediaError(`Recorder Init Error: ${error.message}`);
          toast({variant: "destructive", title: "Recording Setup Error", description: error.message});
          cleanupResources(); resetFullInterview();
      }
    }, [toast, cleanupResources, resetFullInterview]), // Dependencies made stable or using refs

    onDisconnect: useCallback(() => {
      console.log("ELEVENLABS useConversation onDisconnect. Intentional:", isIntentionalDisconnectRef.current, "ProcessingError:", isProcessingErrorRef.current, "StartingSession:", isStartingSessionRef.current, "InterviewActive:", isInterviewActiveRef.current);
      if (isIntentionalDisconnectRef.current || isProcessingErrorRef.current) {
        isIntentionalDisconnectRef.current = false; return;
      }
      // If disconnected during startup or not yet active, set fatal error to trigger useEffect reset
      if (isStartingSessionRef.current || !isInterviewActiveRef.current) {
        console.warn("EL onDisconnect: Disconnected during setup or inactive state.");
        setMediaError("AI Agent disconnected unexpectedly during setup.");
        setElevenLabsFatalError(true); // Trigger useEffect reset
        return;
      }
      // Unexpected disconnect during an active interview
      if (isInterviewActiveRef.current) {
        console.log("EL onDisconnect: Unexpected disconnect during active interview.");
        toast({ title: "AI Interviewer Disconnected Unexpectedly", variant: "destructive", description: "Attempting to finalize your interview." });
        handleFinishInterview(); // Try to finalize
      }
    }, [toast, handleFinishInterview]), // handleFinishInterview needs to be stable

    onMessage: useCallback((message: any) => {
      if (isProcessingErrorRef.current) return;
      console.log("EL onMessage:", message);
      let sender: 'user' | 'agent' = 'agent'; let textContent = '';
      if (message.type === 'user_transcript' && message.text) { sender = 'user'; textContent = message.text; }
      else if (message.type === 'agent_response' && message.text) { sender = 'agent'; textContent = message.text; }
      else if (message.type === 'agent_text_chunk' && message.text) {
        setConversationMessages(prev => {
            const lastMessage = prev[prev.length -1];
            if (lastMessage && lastMessage.sender === 'agent' && (message.type === 'agent_text_chunk' || message.isFinal === false)) {
                const updatedMessages = [...prev]; updatedMessages[prev.length -1] = { ...lastMessage, text: message.text, timestamp: Date.now() }; return updatedMessages;
            }
            return [...prev, { sender: 'agent', text: message.text, timestamp: Date.now() }];
        });
        if(message.isFinal === true) { setFullTranscript(prev => prev + `\nMira: ${message.text}`); }
        return;
      } else if (typeof message.text === 'string' && !message.type && conversationRef.current?.status === "connected" && !(conversationRef.current?.isSpeaking)) { sender = 'user'; textContent = message.text; }
      else if (message.audio && message.text) { sender = 'agent'; textContent = message.text; }

      if (textContent) {
         if (sender === 'agent') { if (message.type !== 'agent_text_chunk') { setConversationMessages(prev => [...prev, { sender, text: textContent, timestamp: Date.now() }]); setFullTranscript(prev => prev + `\nMira: ${textContent}`); } }
         else { setConversationMessages(prev => [...prev, { sender, text: textContent, timestamp: Date.now() }]); setFullTranscript(prev => prev + `\nCandidate: ${textContent}`); }
      }
    }, []), // setConversationMessages, setFullTranscript are stable setters

    onError: useCallback((error: Error) => {
      console.error("ELEVENLABS HOOK onError:", error);
      setMediaError(`AI Agent Error: ${error.message || "Connection issue."}`);
      setElevenLabsFatalError(true); // Trigger useEffect for full reset
    }, []),
  });
  const conversationRef = useRef(conversation);
  const { isSpeaking: agentIsSpeaking } = conversation;
  useEffect(() => { conversationRef.current = conversation; }, [conversation]);

  useEffect(() => {
    if (elevenLabsFatalError) {
      console.log("useEffect: elevenLabsFatalError detected, performing full cleanup and reset.");
      if (!isProcessingErrorRef.current) { // Check to avoid race condition if onError also sets it
        isProcessingErrorRef.current = true;
        toast({
          variant: "destructive",
          title: "AI Interviewer Error",
          description: mediaError || "A critical error occurred with the AI interviewer. Please restart.",
        });
        cleanupResources();
        resetFullInterview();
        setTimeout(() => { isProcessingErrorRef.current = false; }, 500); // Give time for state to settle
      }
    }
  }, [elevenLabsFatalError, mediaError, toast, cleanupResources, resetFullInterview]);


  const submitForFinalFeedback = useCallback(async (videoBlob: Blob | null) => {
    if (!videoBlob || videoBlob.size === 0) {
      toast({ variant: "destructive", title: "No Video Recorded", description: "Cannot submit feedback without a valid video recording." });
      cleanupResources(); resetFullInterview(); return;
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
          fullTranscript: fullTranscript || "No transcript captured.",
        };
        const result = await aiInterviewSimulation(input);
        setFeedbackResult(result);
        setStage("feedback");
        toast({ title: "Feedback Received!", description: "AI has analyzed your interview." });
      };
      reader.onerror = () => {
        toast({ variant: "destructive", title: "File Read Error", description: "Could not process video for submission." });
        cleanupResources(); resetFullInterview();
      }
    } catch (error) {
      console.error("Error getting feedback:", error);
      toast({ variant: "destructive", title: "Feedback Error", description: "Could not get AI feedback." });
      cleanupResources(); resetFullInterview();
    }
  }, [jobContext, toast, fullTranscript, cleanupResources, resetFullInterview]);

  const handleFinishInterview = useCallback(async () => {
    if (stageRef.current === 'submitting' || stageRef.current === 'feedback' || !isInterviewActiveRef.current) {
      console.warn("handleFinishInterview: Called in terminal stage or not active. Aborting. Stage:", stageRef.current, "ActiveRef:", isInterviewActiveRef.current);
      return;
    }
    console.log("handleFinishInterview: User initiated finish.");
    isIntentionalDisconnectRef.current = true;
    isInterviewActiveRef.current = false;
    if (sessionTimerIdRef.current) { clearTimeout(sessionTimerIdRef.current); sessionTimerIdRef.current = null; }

    const conv = conversationRef.current;
    if (conv && conv.status === 'connected') {
        try {
            console.log("handleFinishInterview: Ending EL session.");
            await conv.endSession();
        } catch (e) { console.error("handleFinishInterview: Error ending EL session:", e); }
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      console.log("handleFinishInterview: Stopping MediaRecorder. Current state:", mediaRecorderRef.current.state);
      mediaRecorderRef.current.stop(); // This will trigger its onstop handler for submission
    } else if (recordedChunksRef.current.length > 0 && (stageRef.current !== "feedback" && stageRef.current !== "submitting")) {
      console.warn("handleFinishInterview: MediaRecorder already stopped but chunks exist. Processing directly. Chunks:", recordedChunksRef.current.length);
      const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
      if (blob.size > 0) { submitForFinalFeedback(blob); }
      else {
        toast({ variant: "destructive", title: "Recording Issue", description: "No video data found from existing chunks." });
        cleanupResources(); resetFullInterview();
      }
    } else {
      console.warn("handleFinishInterview: No recording data or recorder active to stop. Stage:", stageRef.current);
      if (stageRef.current !== "feedback" && stageRef.current !== "submitting") {
        toast({ variant: "destructive", title: "Recording Issue", description: "No video available to submit." });
        cleanupResources(); resetFullInterview();
      }
    }
  }, [submitForFinalFeedback, toast, cleanupResources, resetFullInterview]); // conversationRef removed, accessed via current

  const startInterviewSession = useCallback(async () => {
    if (isStartingSessionRef.current || isProcessingErrorRef.current || isInterviewActiveRef.current) {
      console.warn("StartInterviewSession: Aborted due to active process/error/session. Starting:", isStartingSessionRef.current, "ProcessingError:", isProcessingErrorRef.current, "Active:", isInterviewActiveRef.current);
      if(isStartingSessionRef.current) toast({title: "Session Start In Progress", description: "Please wait..."});
      return;
    }
    setMediaError(null); setFeedbackResult(null); setElevenLabsFatalError(false);
    if (!elevenLabsApiKey) { setMediaError("Config Error: ElevenLabs API Key missing."); toast({variant: "destructive", title: "Config Error", description: "ElevenLabs API Key missing."}); resetFullInterview(); return; }
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { setMediaError("Media recording not supported."); toast({ variant: "destructive", title: "Unsupported Browser", description: "Media recording not supported." }); setCameraPermission(false); setMicPermission(false); resetFullInterview(); return; }

    isStartingSessionRef.current = true;
    try {
      console.log("Requesting media permissions...");
      let videoStream;
      try {
        videoStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        setCameraPermission(true);
        if (videoPreviewRef.current) {
          if (previewStreamRef.current) { previewStreamRef.current.getTracks().forEach(track => track.stop()); }
          previewStreamRef.current = videoStream; videoPreviewRef.current.srcObject = previewStreamRef.current; videoPreviewRef.current.muted = true;
          try { await videoPreviewRef.current.play(); } catch (e) { console.warn("Video preview play error:", e); }
        }
      } catch (vidErr) {
          console.error("Error getting video-only stream:", vidErr);
          setCameraPermission(false);
          setMediaError("Camera access denied or unavailable. Please check permissions.");
          toast({variant: "destructive", title: "Camera Error", description: "Could not access camera."});
          isStartingSessionRef.current = false; resetFullInterview(); return;
      }
      
      let audioVideoStream;
      try {
        audioVideoStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setMicPermission(true);
        if (combinedStreamRef.current) { combinedStreamRef.current.getTracks().forEach(track => track.stop()); }
        combinedStreamRef.current = audioVideoStream;
         // If preview was using video-only, replace its srcObject with the combined stream for recording consistency
        if (videoPreviewRef.current && previewStreamRef.current !== combinedStreamRef.current) {
            previewStreamRef.current?.getTracks().forEach(track => track.stop()); // Stop old video-only stream
            previewStreamRef.current = combinedStreamRef.current; // Update ref
            videoPreviewRef.current.srcObject = previewStreamRef.current; // Update preview
            // No need to play again if it was already playing
        }
      } catch (micErr) {
        console.error("Error getting audio/video stream:", micErr);
        setMicPermission(false);
        setMediaError("Microphone access denied or unavailable. Please check permissions.");
        toast({variant: "destructive", title: "Microphone Error", description: "Could not access microphone."});
        isStartingSessionRef.current = false; cleanupResources(); resetFullInterview(); return;
      }
      console.log("Media permissions granted for video and audio.");

      setStage("countdown");
      setCountdown(SESSION_COUNTDOWN_SECONDS);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev === null || prev <= 1) {
            if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current); countdownIntervalRef.current = null;
            console.log("Countdown finished. Starting EL session.");
            const conv = conversationRef.current;
            if (conv) {
                conv.startSession({ agentId: ELEVENLABS_AGENT_ID })
                  .catch(err => {
                    console.error("Failed to start EL session directly:", err);
                    setMediaError(`AI Agent Start Error: ${(err as Error).message}`);
                    setElevenLabsFatalError(true); // Trigger useEffect reset
                  });
            } else {
                console.error("conversationRef.current is null, cannot start EL session.");
                setMediaError("AI Agent not initialized.");
                setElevenLabsFatalError(true); // Trigger useEffect reset
            }
            return null;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      console.error("General error in startInterviewSession.", err);
      const error = err as Error; let desc = "Media device error. Check permissions.";
      if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") desc = "No camera/mic found.";
      else if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") { desc = "Camera/Microphone permission denied."; setCameraPermission(false); setMicPermission(false); }
      else if (error.name === "OverconstrainedError" || error.name === "ConstraintNotSatisfiedError") desc = "Camera/Mic doesn't support requested constraints.";
      else desc = error.message || desc;
      setMediaError(desc); toast({ variant: "destructive", title: "Media Error", description: desc });
      isStartingSessionRef.current = false; cleanupResources(); resetFullInterview();
    }
  }, [toast, elevenLabsApiKey, resetFullInterview, cleanupResources]); // Dependencies are stable or refs

  const handleConsentAndStart = () => {
    resetFullInterview();
    setStage("preparingStream");
    setTimeout(() => startInterviewSession(), 100);
  };

  useEffect(() => {
    return () => {
        console.log("AIInterviewClient: Unmounting. Stage:", stageRef.current);
        cleanupResources();
        resetFullInterview();
    };
  }, [cleanupResources, resetFullInterview]);

  const chatMessagesEndRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (stage === "interviewing") {
      chatMessagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [conversationMessages, stage]);

  if (!elevenLabsApiKey) {
    return (
      <Alert variant="destructive" className="shadow-lg mt-6">
        <AlertCircle className="h-4 w-4" /> <AlertTitle>Configuration Error</AlertTitle>
        <AlertDescription>The ElevenLabs API Key is missing. Please set NEXT_PUBLIC_ELEVENLABS_API_KEY.</AlertDescription>
      </Alert>
    );
  }

  const renderInterviewContent = () => (
     <Card className="shadow-xl relative overflow-hidden min-h-[500px] md:min-h-[600px] flex flex-col">
        <div className="flex-grow flex items-center justify-center p-2 md:p-4">
            <div className="w-full max-w-2xl aspect-video relative bg-black rounded-md shadow-lg">
                <video ref={videoPreviewRef} className="w-full h-full object-cover transform scale-x-[-1] rounded-md" playsInline autoPlay muted />
                <div className="absolute top-0 left-0 right-0 p-2 md:p-3 bg-black/60 backdrop-blur-sm text-white rounded-t-md z-20 shadow-lg flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                        <BotMessageSquare className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                        <span className="font-semibold text-xs md:text-sm">Mira - AI Interviewer</span>
                        <div className={cn('ai-speaking-orb', agentIsSpeaking && 'speaking')} />
                    </div>
                    <div className="flex items-center gap-2 md:gap-3">
                        {(stage === 'interviewing' && conversationRef.current?.status === "connected" && !agentIsSpeaking) && (
                            <div className="flex items-center text-xs text-white animate-pulse"> <Mic className="h-3 w-3 md:h-4 md:w-4 mr-1" /> Listening... </div>
                        )}
                        <span className="text-xs">Status: {conversationRef.current?.status || "Initializing..."}</span>
                    </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-2 md:p-3 max-h-[40%] overflow-y-auto bg-black/70 backdrop-blur-md z-10 space-y-2 flex flex-col-reverse pointer-events-auto">
                  <div ref={chatMessagesEndRef} />
                  {conversationMessages.slice().reverse().map((msg, index) => (
                    <div key={msg.timestamp + '-' + index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`p-1.5 md:p-2 px-2 md:px-3 rounded-lg max-w-[80%] text-xs md:text-sm shadow-md ${msg.sender === 'user' ? 'bg-primary text-primary-foreground' : 'bg-background/90 text-foreground border border-border/50 backdrop-blur-sm'}`}>
                        {msg.text}
                      </div>
                    </div>
                  ))}
                </div>
                {(stage === 'preparingStream') && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-white bg-black/70 z-30">
                    <Loader2 className="h-10 w-10 md:h-12 md:w-12 animate-spin text-primary mb-2" />
                    <p className="text-sm md:text-base">{ (cameraPermission === null || micPermission === null) ? "Requesting Permissions..." : "Preparing Interview..."}</p>
                    { isStartingSessionRef.current && <p className="text-xs mt-1">Connecting to AI Agent...</p>}
                  </div>
                )}
                {stage === "countdown" && countdown !== null && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-40"> <div className="text-6xl md:text-7xl font-bold text-white">{countdown}</div> </div>
                )}
                {mediaRecorderRef.current?.state === "recording" && (
                  <div className="absolute top-12 md:top-16 left-3 bg-red-500 text-white p-1 px-2 rounded text-xs flex items-center animate-pulse z-20"> <Timer className="h-3 w-3 md:h-4 md:w-4 mr-1" /> REC </div>
                )}
                {(mediaError && stage !== 'consent' && stage !== 'feedback' && stage !== 'submitting') && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/90 z-50 p-4">
                    <Alert variant="destructive" className="shadow-md max-w-sm mx-auto">
                      <AlertCircle className="h-4 w-4" /> <AlertTitle>Error Occurred</AlertTitle>
                      <AlertDescription>{mediaError || "An unexpected error occurred."}
                        <Button onClick={resetFullInterview} className="w-full mt-3" size="sm" variant="outline"> Try Again </Button>
                      </AlertDescription>
                    </Alert>
                  </div>
                )}
            </div>
        </div>
        <CardFooter className="border-t border-border/30 bg-background/80 backdrop-blur-sm p-3 md:p-4 z-10 relative">
           {(stage === "interviewing" && isInterviewActiveRef.current) && (
            <Button onClick={handleFinishInterview} className="w-full" size="lg" variant="default"> Finish Interview & Get Feedback </Button>
          )}
        </CardFooter>
      </Card>
  );

  const renderFeedbackSection = (title: string, content: string | undefined, icon: React.ReactNode) => (
    <Card className="shadow-md">
        <CardHeader className="pb-3"> <CardTitle className="text-lg flex items-center">{icon}{title}</CardTitle> </CardHeader>
        <CardContent className="text-sm prose prose-sm max-w-none prose-strong:font-semibold prose-ul:list-disc prose-ul:pl-5 prose-li:ml-4"> {formatFeedbackText(content)} </CardContent>
    </Card>
  );

  const renderFeedbackContent = () => (
    <div className="space-y-6 mt-6">
      <Card className="shadow-xl">
        <CardHeader> <CardTitle className="text-xl flex items-center"><CheckCircle className="mr-2 h-6 w-6 text-green-500" /> Interview Analysis Complete</CardTitle> <CardDescription>Here's a breakdown of your AI interview performance for the {jobContext.jobTitle} role.</CardDescription> </CardHeader>
        <CardContent className="space-y-6">
          {feedbackResult?.overallAssessment && renderFeedbackSection("Overall Assessment", feedbackResult.overallAssessment, <Brain className="mr-2 h-5 w-5 text-primary" />)}
          {feedbackResult?.keyStrengths && renderFeedbackSection("Key Strengths", feedbackResult.keyStrengths, <ThumbsUp className="mr-2 h-5 w-5 text-green-500" />)}
          {feedbackResult?.areasForImprovement && renderFeedbackSection("Areas for Improvement", feedbackResult.areasForImprovement, <ThumbsDown className="mr-2 h-5 w-5 text-red-500" />)}
          {feedbackResult?.communicationClarity && renderFeedbackSection("Communication & Clarity", feedbackResult.communicationClarity, <MessageSquareIcon className="mr-2 h-5 w-5 text-blue-500" />)}
          {feedbackResult?.bodyLanguageAnalysis && renderFeedbackSection("Body Language & Presentation", feedbackResult.bodyLanguageAnalysis, <User className="mr-2 h-5 w-5 text-purple-500" />)}
          {feedbackResult?.relevanceToRole && renderFeedbackSection("Relevance to Role Context", feedbackResult.relevanceToRole, <Star className="mr-2 h-5 w-5 text-yellow-500" />)}
          {feedbackResult?.hiringRecommendationJustification && renderFeedbackSection("Hiring Recommendation Justification", feedbackResult.hiringRecommendationJustification, <UsersIcon className="mr-2 h-5 w-5 text-indigo-500" />)}
          {recordedVideoBlob && (
            <Card className="shadow-md"> <CardHeader><CardTitle className="text-lg flex items-center"><Film className="mr-2 h-5 w-5 text-primary" /> Review Your Interview</CardTitle></CardHeader> <CardContent> <video src={URL.createObjectURL(recordedVideoBlob)} controls className="w-full rounded-md shadow-inner aspect-video" /> </CardContent> </Card>
          )}
          <Card className="shadow-md"> <CardHeader><CardTitle className="text-lg flex items-center"><MessageSquareIcon className="mr-2 h-5 w-5 text-primary"/>Full Conversation Transcript</CardTitle></CardHeader> <CardContent> <pre className="text-sm whitespace-pre-line bg-muted p-4 rounded-md max-h-96 overflow-y-auto"> {fullTranscript || "No transcript available."} </pre> </CardContent> </Card>
        </CardContent>
        <CardFooter> <Button onClick={resetFullInterview} className="w-full" size="lg">Start New AI Interview</Button> </CardFooter>
      </Card>
    </div>
  );

  return (
    <>
      <AIInterviewConsent
        open={stage === "consent"}
        onOpenChange={(open) => { if (!open && stage === "consent") { /* User explicitly cancelled consent */ } }}
        onAccept={handleConsentAndStart}
      />
      {stage === "submitting" && ( <div className="text-center p-8 space-y-2"> <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" /> <p className="text-muted-foreground">AI is analyzing your interview... This may take a moment.</p> </div> )}
      {(stage === "preparingStream" || stage === "countdown" || stage === "interviewing") && renderInterviewContent()}
      {stage === "feedback" && feedbackResult && renderFeedbackContent()}
    </>
  );
}

    