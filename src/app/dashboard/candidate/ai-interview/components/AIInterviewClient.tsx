
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Camera, CheckCircle, Loader2, Timer, AlertCircle, BotMessageSquare, User, Film, Brain, ThumbsUp, ThumbsDown, MessageSquare as MessageSquareIcon, Star, Users as UsersIcon, Mic, MicOff } from "lucide-react";
import { useEffect, useRef, useState, useCallback } from "react";
import * as ElevenReact from '@11labs/react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { cn } from "@/lib/utils";

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
const MAX_SESSION_DURATION_MS = 10 * 60 * 1000; // 10 minutes for the whole session
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
  const router = useRouter();
  const { role } = useAuth();
  const [stage, setStage] = useState<InterviewStage>("consent");
  const [consentGiven, setConsentGiven] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);

  const [recordedVideoBlob, setRecordedVideoBlob] = useState<Blob | null>(null);
  const [feedbackResult, setFeedbackResult] = useState<AiInterviewSimulationOutput | null>(null);
  
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [cameraPermission, setCameraPermission] = useState<boolean | null>(null);
  const [micPermission, setMicPermission] = useState<boolean | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const videoPreviewRef = useRef<HTMLVideoElement | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const combinedStreamRef = useRef<MediaStream | null>(null);
  
  const sessionTimerIdRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const conversationRef = useRef<ReturnType<typeof ElevenReact.useConversation> | null>(null);
  const isInterviewActiveRef = useRef(false);
  const isStartingSessionRef = useRef(false); // To prevent multiple startSession calls
  const isProcessingErrorRef = useRef(false); // To prevent re-entrant error handling
  const isIntentionalDisconnectRef = useRef(false);

  const chatMessagesEndRef = useRef<HTMLDivElement | null>(null);

  const [conversationMessages, setConversationMessages] = useState<Message[]>([]);
  const [fullTranscript, setFullTranscript] = useState<string>("");
  const elevenLabsApiKey = process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY;

  const stageRef = useRef(stage); // Ref to track current stage in callbacks
  useEffect(() => { stageRef.current = stage; }, [stage]);


  const resetFullInterview = useCallback(() => {
    console.log("ResetFullInterview: Resetting UI states and refs...");
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
    recordedChunksRef.current = [];

    isProcessingErrorRef.current = false;
    isStartingSessionRef.current = false;
    isInterviewActiveRef.current = false;
    isIntentionalDisconnectRef.current = false;
    console.log("ResetFullInterview: UI states and refs reset.");
  }, []);

  const cleanupResources = useCallback(() => {
    console.log("CleanupResources: Starting cleanup...");
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    if (sessionTimerIdRef.current) {
      clearTimeout(sessionTimerIdRef.current);
      sessionTimerIdRef.current = null;
    }
    
    const conv = conversationRef.current;
    if (conv && conv.status === "connected") {
        console.log("CleanupResources: Attempting to end ElevenLabs session.");
        conv.endSession().catch(e => console.error("CleanupResources: Error ending ElevenLabs session:", e));
    }
    
    if (mediaRecorderRef.current) {
      if (mediaRecorderRef.current.state === "recording" || mediaRecorderRef.current.state === "paused") {
        console.log("CleanupResources: Stopping MediaRecorder (if active).");
        // Detach event handlers before stopping to prevent onstop from firing during cleanup
        mediaRecorderRef.current.onstop = null; 
        mediaRecorderRef.current.ondataavailable = null;
        mediaRecorderRef.current.onerror = null;
        try { mediaRecorderRef.current.stop(); } catch (e) { console.warn("CleanupResources: Error stopping media recorder:", e); }
      }
      mediaRecorderRef.current = null;
    }
    recordedChunksRef.current = [];

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (combinedStreamRef.current) {
      combinedStreamRef.current.getTracks().forEach(track => track.stop());
      combinedStreamRef.current = null;
    }
    if (videoPreviewRef.current && videoPreviewRef.current.srcObject) {
      const stream = videoPreviewRef.current.srcObject as MediaStream;
      stream?.getTracks().forEach(track => track.stop());
      videoPreviewRef.current.srcObject = null;
    }
    
    isInterviewActiveRef.current = false; 
    console.log("CleanupResources: Finished cleanup.");
  }, []);


  const submitForFinalFeedback = useCallback(async (videoBlob: Blob) => {
    if (!videoBlob || videoBlob.size === 0) {
      toast({ variant: "destructive", title: "No Video Recorded", description: "Cannot submit feedback without a valid video." });
      cleanupResources();
      resetFullInterview();
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
        cleanupResources(); 
        resetFullInterview();
      }
    } catch (error) {
      console.error("Error getting feedback:", error);
      toast({ variant: "destructive", title: "Feedback Error", description: "Could not get AI feedback." });
      cleanupResources();
      resetFullInterview();
    }
  }, [jobContext, toast, fullTranscript, cleanupResources, resetFullInterview, role, router]);


  const handleFinishInterview = useCallback(async () => {
     if (stageRef.current === 'submitting' || stageRef.current === 'feedback') {
      console.warn("handleFinishInterview called in terminal stage. Aborting. Stage:", stageRef.current);
      return;
    }
    if (!isInterviewActiveRef.current && stageRef.current !== "interviewing") {
      console.warn("handleFinishInterview called when interview not active or not in interviewing stage. Stage:", stageRef.current);
      // If no active interview, but maybe there's a recording? Or just reset?
      // This path might be hit if EL disconnects then user clicks finish.
      // For now, let's just cleanup and reset if not active.
      cleanupResources();
      resetFullInterview();
      return;
    }

    console.log("handleFinishInterview: User initiated finish. Setting intentional disconnect.");
    isIntentionalDisconnectRef.current = true;
    isInterviewActiveRef.current = false; // Mark interview as no longer active

    if (sessionTimerIdRef.current) { // Clear session timer if active
        clearTimeout(sessionTimerIdRef.current);
        sessionTimerIdRef.current = null;
    }
    
    const conv = conversationRef.current;
    if (conv && conv.status === 'connected') {
      try {
        console.log("handleFinishInterview: Ending ElevenLabs session.");
        await conv.endSession(); // This will trigger onDisconnect, which should now be benign due to isIntentionalDisconnectRef
      } catch (e) {
        console.error("handleFinishInterview: Error ending ElevenLabs session:", e);
      }
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      console.log("handleFinishInterview: Stopping MediaRecorder.");
      mediaRecorderRef.current.onstop = () => { // Define onstop here to ensure it uses current state
        console.log("MediaRecorder onstop triggered from handleFinishInterview. Chunks collected:", recordedChunksRef.current.length);
        if (recordedChunksRef.current.length > 0) {
            const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
            setRecordedVideoBlob(blob);
            if (blob.size > 0) {
                console.log("MediaRecorder onstop: Submitting blob of size", blob.size);
                submitForFinalFeedback(blob);
            } else {
                toast({ variant: "destructive", title: "Recording Issue", description: "No video data was recorded." });
                cleanupResources(); resetFullInterview();
            }
        } else {
            toast({ variant: "destructive", title: "Recording Issue", description: "No video chunks were recorded." });
            cleanupResources(); resetFullInterview();
        }
        recordedChunksRef.current = [];
        mediaRecorderRef.current = null; // Nullify after stopping and processing
      };
      mediaRecorderRef.current.stop();
    } else if (recordedVideoBlob && recordedVideoBlob.size > 0 && stageRef.current !== "feedback" && stageRef.current !== "submitting") {
      // If recorder was already stopped (e.g., by timeout) but we have a blob
      console.log("handleFinishInterview: MediaRecorder already stopped, processing existing blob.");
      submitForFinalFeedback(recordedVideoBlob);
    } else if (recordedChunksRef.current.length > 0 && stageRef.current !== "feedback" && stageRef.current !== "submitting") {
      // If recorder stopped but onstop didn't fire or blob not set, try processing chunks
      console.log("handleFinishInterview: Processing existing chunks as recorder was stopped.");
      const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
      setRecordedVideoBlob(blob);
      if (blob.size > 0) {
          submitForFinalFeedback(blob);
      } else {
          toast({ variant: "destructive", title: "Recording Issue", description: "No video data found to submit." });
          cleanupResources(); resetFullInterview();
      }
      recordedChunksRef.current = [];
    } else {
      console.warn("handleFinishInterview: No recording data or recorder active to stop.");
      if (stageRef.current !== "feedback" && stageRef.current !== "submitting") { // Avoid toast if already in feedback
        toast({ variant: "destructive", title: "Recording Issue", description: "No video available to submit." });
        cleanupResources(); resetFullInterview();
      }
    }
  }, [submitForFinalFeedback, toast, recordedVideoBlob, cleanupResources, resetFullInterview]);

  const handleElevenError = useCallback((error: Error, context?: string) => {
    if (isProcessingErrorRef.current) {
      console.warn(`EL onError (${context || 'general'}): Already processing an error. Skipping.`, error);
      return;
    }
    isProcessingErrorRef.current = true;
    console.error(`EL onError (${context || 'general'}):`, error);
    const errorMessage = error.message || "AI Agent connection error.";
    setMediaError(`AI Agent Error: ${errorMessage}`);
    toast({ variant: "destructive", title: `AI Agent Error (${context || 'General'})`, description: errorMessage });

    cleanupResources();
    resetFullInterview();
    
    isStartingSessionRef.current = false;
    setTimeout(() => { isProcessingErrorRef.current = false; }, 3000); // Cooldown for error processing
  }, [toast, cleanupResources, resetFullInterview]);

  const conversation = ElevenReact.useConversation({
    onConnect: () => {
      if (isProcessingErrorRef.current) {
          console.warn("EL onConnect: Prevented due to active error processing.");
          isStartingSessionRef.current = false; 
          return;
      }
      console.log("EL onConnect: Agent connected.");
      toast({ title: "AI Interviewer Connected", description: "Mira is ready." });

      isStartingSessionRef.current = false; // Successfully started
      isInterviewActiveRef.current = true;
      setStage("interviewing");

      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "recording") {
        try {
          mediaRecorderRef.current.onstop = () => {
            console.log("MediaRecorder onstop (auto-stop/timeout). Chunks:", recordedChunksRef.current.length);
            if (isInterviewActiveRef.current) { // If interview was still meant to be active, this is unexpected
                console.warn("MediaRecorder stopped unexpectedly during active interview.");
            } // Submission logic is handled by handleFinishInterview or its onstop
            if (recordedChunksRef.current.length > 0) {
                const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
                setRecordedVideoBlob(blob); // Save blob for potential later submission if handleFinish triggers
            }
          };
          mediaRecorderRef.current.onerror = (event: Event) => {
              console.error("MediaRecorder error during recording:", event);
              setMediaError("Video recording error. Please try again.");
              toast({variant: "destructive", title: "Recording Error", description: "An error occurred during video recording."});
              handleElevenError(new Error("MediaRecorder error during recording."), "MediaRecorder on Error");
          };
          mediaRecorderRef.current.start();
          console.log("EL onConnect: Video recording started.");
        } catch (e) {
            console.error("EL onConnect: Error starting MediaRecorder:", e);
            setMediaError("Failed to start video recording.");
            toast({variant: "destructive", title: "Recording Error", description: "Could not start video recording."});
            handleElevenError(e as Error, "MediaRecorder Start"); // This will reset to consent
            return; 
        }
      } else if (!mediaRecorderRef.current) {
          console.error("EL onConnect: MediaRecorder is not initialized!");
          setMediaError("Recording system error.");
          toast({variant: "destructive", title: "Recording Error", description: "Recording system not ready."});
          handleElevenError(new Error("MediaRecorder not initialized in onConnect."), "MediaRecorder Init");
          return;
      }

      sessionTimerIdRef.current = setTimeout(() => {
        if (isInterviewActiveRef.current) {
          toast({ title: "Session Timeout", description: "Interview ended due to timeout." });
          isIntentionalDisconnectRef.current = true; // Treat timeout as intentional for disconnect logic
          handleFinishInterview();
        }
      }, MAX_SESSION_DURATION_MS);
    },
    onDisconnect: () => {
      console.log("EL onDisconnect: Agent disconnected. Intentional:", isIntentionalDisconnectRef.current, "isProcessingError:", isProcessingErrorRef.current, "isStartingSession:", isStartingSessionRef.current, "isInterviewActive (at disconnect):", isInterviewActiveRef.current, "stage:", stageRef.current);

      if (isIntentionalDisconnectRef.current) {
        console.log("EL onDisconnect: Intentional disconnect processed. Resetting flag.");
        isIntentionalDisconnectRef.current = false;
        return; // This was an intentional disconnect, handleFinishInterview or cleanupResources manages.
      }
      if (isProcessingErrorRef.current) {
        console.warn("EL onDisconnect: Error processing is active, onDisconnect action skipped.");
        return;
      }
      if (isStartingSessionRef.current) {
        console.warn("EL onDisconnect: Disconnected during session startup. Forcing full reset via handleElevenError.");
        handleElevenError(new Error("Agent disconnected during startup."), "Disconnect During Startup");
        return;
      }

      // If it's an unexpected disconnect of an active session
      if (isInterviewActiveRef.current && stageRef.current === 'interviewing') {
        console.log("EL onDisconnect: Unexpected disconnect during active interview. Attempting graceful finish.");
        toast({ title: "AI Interviewer Disconnected Unexpectedly", variant: "destructive", description: "Attempting to finalize your interview." });
        handleFinishInterview(); 
      } else {
        console.log("EL onDisconnect: Disconnected in non-active/non-interviewing state, or already handled. Performing basic cleanup.");
        cleanupResources(); // Perform basic cleanup if not an active interview unexpected disconnect
        if (stageRef.current !== "feedback" && stageRef.current !== "submitting") {
            resetFullInterview(); // Reset to consent if not already in a terminal state
        }
      }
    },
    onMessage: (message: any) => {
      if (isProcessingErrorRef.current) return;
      console.log("EL onMessage:", message);
      let sender: 'user' | 'agent' = 'agent';
      let textContent = '';

      if (message.type === 'user_transcript' && message.text) {
        sender = 'user';
        textContent = message.text;
      } else if (message.type === 'agent_response' && message.text) {
        sender = 'agent';
        textContent = message.text;
      } else if (message.type === 'agent_text_chunk' && message.text) { 
        sender = 'agent';
        textContent = message.text; 
      } else if (typeof message.text === 'string' && !message.type && conversationRef.current && !conversationRef.current.isSpeaking) {
        sender = 'user';
        textContent = message.text;
      } else if (message.audio && message.text) {
        sender = 'agent';
        textContent = message.text;
      }

      if (textContent) {
        if (sender === 'agent') {
            setConversationMessages(prev => {
                const lastMessage = prev[prev.length -1];
                if (lastMessage && lastMessage.sender === 'agent' && message.type === 'agent_text_chunk') {
                    const updatedMessages = [...prev];
                    updatedMessages[prev.length -1] = { ...lastMessage, text: lastMessage.text + textContent, timestamp: Date.now() };
                    return updatedMessages;
                }
                return [...prev, { sender, text: textContent, timestamp: Date.now() }];
            });
        } else { 
            setConversationMessages(prev => [...prev, { sender, text: textContent, timestamp: Date.now() }]);
        }
        setFullTranscript(prev => prev + `\n${sender === 'user' ? 'Candidate' : 'Mira'}: ${textContent}`);
      }
    },
    onError: (error: Error) => {
      handleElevenError(error, "useConversation onError");
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
    if (isStartingSessionRef.current || isProcessingErrorRef.current || isInterviewActiveRef.current) {
        console.warn("StartInterviewSession: Aborted. Starting:", isStartingSessionRef.current, "ProcessingError:", isProcessingErrorRef.current, "Active:", isInterviewActiveRef.current);
        if(isStartingSessionRef.current) toast({title: "Session Start In Progress", description: "Please wait..."});
        return;
    }
    
    setMediaError(null);
    setFeedbackResult(null); // Clear previous feedback

    if (!elevenLabsApiKey) {
        setMediaError("Config Error: ElevenLabs API Key missing.");
        toast({variant: "destructive", title: "Config Error", description: "ElevenLabs API Key missing."});
        resetFullInterview(); return;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setMediaError("Media recording not supported.");
      toast({ variant: "destructive", title: "Unsupported Browser", description: "Media recording not supported." });
      setCameraPermission(false); setMicPermission(false);
      resetFullInterview(); return;
    }

    isStartingSessionRef.current = true;
    
    try {
      console.log("Requesting media permissions...");
      // Get camera stream for preview first
      const cameraStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      setCameraPermission(true);
      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = cameraStream;
        videoPreviewRef.current.muted = true;
        videoPreviewRef.current.play().catch(e => console.error("Preview play error", e));
      }
      streamRef.current = cameraStream; // Store camera-only stream

      // Now get combined stream for MediaRecorder and microphone access for ElevenLabs
      const micAndCamStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setMicPermission(true);
      if (combinedStreamRef.current) { 
          combinedStreamRef.current.getTracks().forEach(track => track.stop());
      }
      combinedStreamRef.current = micAndCamStream;
      console.log("Media permissions granted for video and audio.");

      // Initialize MediaRecorder (but don't start it yet, onConnect will start it)
      mediaRecorderRef.current = new MediaRecorder(combinedStreamRef.current, { mimeType: 'video/webm' });
      recordedChunksRef.current = []; // Reset chunks for new recording
      mediaRecorderRef.current.ondataavailable = (e) => { 
        if (e.data.size > 0) {
          recordedChunksRef.current.push(e.data); 
          console.log("MediaRecorder ondataavailable: chunk size", e.data.size, "total chunks:", recordedChunksRef.current.length);
        }
      };
      // onstop and onerror are now set in onConnect for recorder
      
      setStage("countdown");
      setCountdown(SESSION_COUNTDOWN_SECONDS);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev === null || prev <= 1) {
            if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;

            console.log("Countdown finished. Starting ElevenLabs session.");
            const conv = conversationRef.current;
            if (conv) {
              conv.startSession({ agentId: ELEVENLABS_AGENT_ID })
                .then(conversationId => {
                  console.log("EL session init request sent, ID:", conversationId);
                })
                .catch(err => {
                  console.error("Failed to start EL session directly:", err);
                  isStartingSessionRef.current = false;
                  handleElevenError(err as Error, "EL StartSession"); 
                });
            } else {
                console.error("conversationRef.current is null, cannot start EL session.");
                isStartingSessionRef.current = false;
                handleElevenError(new Error("ElevenLabs conversation hook not initialized."), "EL Init");
            }
            return null;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      console.error("Error accessing media devices.", err);
      const error = err as Error;
      let desc = "Media device error. Check permissions.";
      if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") desc = "No camera/mic found.";
      else if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
        desc = error.message.toLowerCase().includes("microphone") ? "Microphone permission denied." : "Camera permission denied.";
        if(error.message.toLowerCase().includes("microphone")) setMicPermission(false); else setCameraPermission(false);
      } else if (error.name === "OverconstrainedError" || error.name === "ConstraintNotSatisfiedError") {
        desc = "Camera/Mic doesn't support requested constraints.";
      }

      setMediaError(desc);
      toast({ variant: "destructive", title: "Media Error", description: desc });

      if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
      if (combinedStreamRef.current) combinedStreamRef.current.getTracks().forEach(track => track.stop());
      combinedStreamRef.current = null;
      
      isStartingSessionRef.current = false; 
      resetFullInterview();
    }
  }, [toast, elevenLabsApiKey, handleElevenError, resetFullInterview]);


  useEffect(() => {
    const currentStageVal = stageRef.current; // Capture value at effect setup
    return () => {
        console.log("AIInterviewClient: Unmounting or dependencies changed. Current stage on cleanup trigger:", currentStageVal);
        isIntentionalDisconnectRef.current = true; // Mark as intentional on unmount
        cleanupResources();
        if (currentStageVal !== "feedback" && currentStageVal !== "submitting") {
            resetFullInterview(); // Reset UI only if not in a terminal state
        }
    };
  }, [cleanupResources, resetFullInterview]);


  const handleConsentAndStart = () => {
    if (consentGiven) {
        resetFullInterview(); // Ensure a clean slate before starting
        setStage("preparingStream");
        // Delay startInterviewSession slightly to allow state to update
        setTimeout(() => startInterviewSession(), 100);
    } else {
        toast({ variant: "destructive", title: "Consent Required", description: "You must consent to proceed." });
    }
  };

  const renderConsentDialog = () => (
    <Dialog open={stage === "consent"}>
      <DialogContent className="sm:max-w-md shadow-xl">
        <DialogHeader>
          <DialogTitle>Realtime AI Interview Consent</DialogTitle>
          <DialogDescription>
            This Realtime AI Interview requires access to your camera (for video recording) and microphone (for interacting with the AI interviewer, "Mira").
            The recording will begin after a short countdown and will last for the duration of the interview (up to {MAX_SESSION_DURATION_MS / 1000 / 60} minutes).
            Your entire session (video and conversation transcript) will be analyzed by AI to provide you with comprehensive feedback.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center space-x-2 py-4">
          <Checkbox id="consent-checkbox" checked={consentGiven} onCheckedChange={(checked) => setConsentGiven(Boolean(checked))} />
          <Label htmlFor="consent-checkbox">I consent to video recording and microphone usage for this AI interview.</Label>
        </div>
        <DialogFooter>
          <Button type="button" onClick={handleConsentAndStart} disabled={!consentGiven}>Start Interview</Button>
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
    const conv = conversationRef.current;

    return (
      <div className="grid md:grid-cols-2 gap-6 items-start">
        <Card className="shadow-lg md:sticky md:top-20 h-full min-h-[400px] md:min-h-[calc(100vh-10rem)] flex flex-col">
          <CardHeader className="text-center border-b pb-3">
            <div className="flex items-center justify-center gap-2">
              <BotMessageSquare className="h-8 w-8 text-primary" />
              <CardTitle className="text-xl">Mira - Your AI Interviewer</CardTitle>
              <div
                className={cn(
                  'ai-speaking-orb',
                  conv?.isSpeaking && 'speaking'
                )}
              />
            </div>
            <CardDescription>Status: {conv?.status || "Initializing..."}</CardDescription>
          </CardHeader>
          <CardContent className="flex-grow p-0 relative">
             <div className="h-[300px] md:h-full w-full overflow-y-auto p-4 space-y-3">
                {conversationMessages.map((msg, index) => (
                  <div key={msg.timestamp + '-' + index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`p-2 px-3 rounded-lg max-w-[80%] text-sm shadow-md ${msg.sender === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
                {stage === 'interviewing' && !conv?.isSpeaking && conv?.status === "connected" && (
                   <div className="flex justify-center pt-2">
                       <Mic className="h-5 w-5 text-muted-foreground animate-pulse" /> 
                       <p className="ml-1 text-xs text-muted-foreground">Listening...</p>
                   </div>
                )}
                <div ref={chatMessagesEndRef} />
              </div>

            {(stage === 'preparingStream' || stage === 'countdown') && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground bg-background/80 z-10">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-2" />
                <p>{stage === 'countdown' ? "Get Ready..." : (cameraPermission === null || micPermission === null) ? "Requesting Permissions..." : "Preparing Interview..."}</p>
              </div>
            )}
             {micPermission === false && stage !== 'consent' && stage !== 'feedback' && stage !== 'submitting' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground bg-background/90 z-10 p-4">
                    <MicOff className="h-12 w-12 text-destructive mb-2" />
                    <p className="text-center">Microphone permission denied. Please enable microphone access in your browser settings to proceed.</p>
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
              {stage === 'interviewing' && mediaRecorderRef.current?.state !== "recording" && conv?.status === "connected" && "Starting recording..."}
              {stage === 'interviewing' && conv?.status !== "connected" && "Connecting to AI..."}
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
                stage !== "preparingStream" && stage !== "countdown" && stage !== 'consent' && mediaRecorderRef.current?.state !== "recording" && !mediaError) && (
                <Camera className="absolute h-24 w-24 text-muted-foreground" />
              )}
            </div>

            {(mediaError || (cameraPermission === false && stage !== 'consent' && stage !== 'feedback' && stage !== 'submitting') || (micPermission === false && stage !== 'consent' && stage !== 'feedback' && stage !== 'submitting')) && (
              <Alert variant="destructive" className="shadow-md">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Media Error</AlertTitle>
                <AlertDescription>{mediaError || "Camera/microphone access was not granted or is unavailable."}</AlertDescription>
              </Alert>
            )}
          </CardContent>
          <CardFooter className="flex-col space-y-2">
            {stage === "interviewing" && isInterviewActiveRef.current && (
              <Button onClick={handleFinishInterview} className="w-full" size="lg" variant="default">
                Finish Interview & Get Feedback
              </Button>
            )}
            {((stage === "preparingStream" && mediaError) || (cameraPermission === false && stage !== 'consent' && stage !== 'feedback' && stage !== 'submitting') || (micPermission === false && stage !== 'consent' && stage !== 'feedback' && stage !== 'submitting') ) && (
               <Button onClick={() => { resetFullInterview(); }} className="w-full" size="lg" variant="outline">
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
          <Button onClick={() => { resetFullInterview(); }} className="w-full" size="lg">Start New AI Interview</Button>
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

