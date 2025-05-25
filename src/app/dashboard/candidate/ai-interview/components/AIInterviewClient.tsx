
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
const ELEVENLABS_AGENT_ID = "EVQJtCNSo0L6uHQnImQu"; // User provided Agent ID

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
  const previewStreamRef = useRef<MediaStream | null>(null); 
  const combinedStreamRef = useRef<MediaStream | null>(null);
  
  const sessionTimerIdRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const isProcessingErrorRef = useRef(false);
  const isStartingSessionRef = useRef(false);
  const isInterviewActiveRef = useRef(false);
  const isIntentionalDisconnectRef = useRef(false);

  const chatMessagesEndRef = useRef<HTMLDivElement | null>(null);
  const [conversationMessages, setConversationMessages] = useState<Message[]>([]);
  const [fullTranscript, setFullTranscript] = useState<string>("");
  
  const elevenLabsApiKey = process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY;

  const stageRef = useRef(stage);
  useEffect(() => { stageRef.current = stage; }, [stage]);

  const conversation = ElevenReact.useConversation({
    onConnect: () => {
      if (isProcessingErrorRef.current) {
          console.warn("EL onConnect: Prevented due to active error processing.");
          isStartingSessionRef.current = false; return;
      }
      console.log("EL onConnect: Agent connected. Attempting to start MediaRecorder.");
      toast({ title: "AI Interviewer Connected", description: "Mira is ready." });

      isStartingSessionRef.current = false;
      isInterviewActiveRef.current = true;
      setStage("interviewing");

      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "recording") {
        try {
            console.log("EL onConnect: Attempting to start MediaRecorder. Current state:", mediaRecorderRef.current.state);
            recordedChunksRef.current = []; 

            mediaRecorderRef.current.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    console.log("MediaRecorder ondataavailable: chunk size", event.data.size);
                    recordedChunksRef.current.push(event.data);
                } else {
                    console.warn("MediaRecorder ondataavailable: received empty chunk");
                }
            };
            mediaRecorderRef.current.onstop = () => {
                console.log("MediaRecorder onstop triggered. Number of chunks:", recordedChunksRef.current.length);
                const newBlob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
                console.log("MediaRecorder onstop: New blob created. Size:", newBlob.size);

                setRecordedVideoBlob(newBlob); 

                if (newBlob.size > 0 && (stageRef.current === 'interviewing' || stageRef.current === 'submitting' || isIntentionalDisconnectRef.current || isProcessingErrorRef.current )) {
                    console.log("MediaRecorder onstop: Submitting blob of size", newBlob.size, "Current stage:", stageRef.current);
                    if (stageRef.current !== 'feedback' && stageRef.current !== 'submitting') {
                        submitForFinalFeedback(newBlob);
                    } else {
                        console.warn("MediaRecorder onstop: Submission skipped, already in feedback/submitting stage or processing error.");
                    }
                } else if (newBlob.size === 0 && (stageRef.current === 'interviewing' || stageRef.current === 'submitting')) {
                    console.error("MediaRecorder onstop: No video data was recorded. Chunks:", recordedChunksRef.current.length);
                    toast({ variant: "destructive", title: "Recording Issue", description: "No video data was recorded. Please ensure your camera is working and permissions are granted." });
                    if (!isProcessingErrorRef.current && !isIntentionalDisconnectRef.current) {
                        cleanupResources(); 
                        resetFullInterview(); 
                    }
                }
                 recordedChunksRef.current = [];
            };
            mediaRecorderRef.current.onerror = (event: Event) => {
                console.error("MediaRecorder error during recording:", event);
                let errorMsg = "Video recording error. Please try again.";
                if (event instanceof DOMException) {
                    console.error("MediaRecorder DOMException:", event.name, event.message);
                    errorMsg = `Video recording error: ${event.name} - ${event.message}. Please try again.`;
                }
                setMediaError(errorMsg);
                toast({variant: "destructive", title: "Recording Error", description: "An error occurred during video recording."});
                
                isProcessingErrorRef.current = true;
                cleanupResources();
                resetFullInterview();
                setTimeout(() => { isProcessingErrorRef.current = false; }, 3000);
            };
            
            mediaRecorderRef.current.start(1000); 
            console.log("EL onConnect: MediaRecorder started. State:", mediaRecorderRef.current.state);
            
            sessionTimerIdRef.current = setTimeout(() => {
              if (isInterviewActiveRef.current) {
                toast({ title: "Session Timeout", description: "Interview ended due to timeout." });
                handleFinishInterview();
              }
            }, MAX_SESSION_DURATION_MS);

        } catch (e) {
            console.error("EL onConnect: Error starting MediaRecorder:", e);
            setMediaError("Failed to start video recording.");
            toast({variant: "destructive", title: "Recording Error", description: "Could not start video recording."});
            
            isProcessingErrorRef.current = true;
            if (conversationRef.current && conversationRef.current.status === "connected") {
              conversationRef.current.endSession().catch(err => console.error("Error ending EL session after media start fail:", err));
            }
            cleanupResources(); 
            resetFullInterview(); 
            setTimeout(() => { isProcessingErrorRef.current = false; }, 3000);
            return; 
        }
      } else if (!mediaRecorderRef.current) {
          console.error("EL onConnect: MediaRecorder is not initialized!");
          setMediaError("Recording system error.");
          toast({variant: "destructive", title: "Recording Error", description: "Recording system not ready."});
          isProcessingErrorRef.current = true;
          if (conversationRef.current && conversationRef.current.status === "connected") {
            conversationRef.current.endSession().catch(err => console.error("Error ending EL session after media init fail:", err));
          }
          cleanupResources(); 
          resetFullInterview();
          setTimeout(() => { isProcessingErrorRef.current = false; }, 3000);
          return;
      } else {
         console.warn("EL onConnect: MediaRecorder already recording or in an unexpected state:", mediaRecorderRef.current.state);
      }
    },
    onDisconnect: () => {
      console.log("EL onDisconnect. Intentional:", isIntentionalDisconnectRef.current, "ProcessingError:", isProcessingErrorRef.current, "StartingSession:", isStartingSessionRef.current, "InterviewActive:", isInterviewActiveRef.current, "Stage:", stageRef.current);
      
      if (isIntentionalDisconnectRef.current) {
        console.log("EL onDisconnect: Intentional, flag already set or was part of finish/error flow.");
        isIntentionalDisconnectRef.current = false; 
        return;
      }
      if (isProcessingErrorRef.current) {
        console.warn("EL onDisconnect: Skipped due to active error processing.");
        return;
      }
       if (isStartingSessionRef.current) {
        console.warn("EL onDisconnect: Disconnected during startup. Forcing full reset.");
        isProcessingErrorRef.current = true; 
        isStartingSessionRef.current = false;
        setMediaError("AI Agent disconnected during connection setup.");
        toast({ variant: "destructive", title: "Connection Failed", description: "AI Agent disconnected during setup." });
        cleanupResources();
        resetFullInterview();
        setTimeout(() => { isProcessingErrorRef.current = false; }, 3000);
        return;
      }

      if (isInterviewActiveRef.current && stageRef.current === 'interviewing') {
        console.log("EL onDisconnect: Unexpected disconnect during active interview.");
        toast({ title: "AI Interviewer Disconnected Unexpectedly", variant: "destructive", description: "Attempting to finalize your interview." });
        handleFinishInterview(); 
      } else {
        console.log("EL onDisconnect: Non-active/non-interviewing disconnect or already handled.");
         if (stageRef.current !== "feedback" && stageRef.current !== "submitting") {
            // cleanupResources(); 
            // resetFullInterview();
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
        setConversationMessages(prev => {
            const lastMessage = prev[prev.length -1];
            if (lastMessage && lastMessage.sender === 'agent' && (message.type === 'agent_text_chunk')) {
                const updatedMessages = [...prev];
                updatedMessages[prev.length -1] = { ...lastMessage, text: message.text, timestamp: Date.now() };
                return updatedMessages;
            }
            return [...prev, { sender: 'agent', text: message.text, timestamp: Date.now() }];
        });
        if(message.isFinal) { 
          setFullTranscript(prev => prev + `\nMira: ${message.text}`);
        }
        return; 
      } else if (typeof message.text === 'string' && !message.type && conversationRef.current?.status === "connected" && !conversationRef.current?.isSpeaking) {
        sender = 'user';
        textContent = message.text;
      } else if (message.audio && message.text) { 
        sender = 'agent';
        textContent = message.text;
      }

      if (textContent) {
         if (sender === 'agent') {
            setConversationMessages(prev => [...prev, { sender, text: textContent, timestamp: Date.now() }]);
            setFullTranscript(prev => prev + `\nMira: ${textContent}`);
        } else { 
             setConversationMessages(prev => [...prev, { sender, text: textContent, timestamp: Date.now() }]);
             setFullTranscript(prev => prev + `\nCandidate: ${textContent}`);
        }
      }
    },
    onError: (error: Error) => {
      if (isProcessingErrorRef.current) { console.warn("EL onError: Re-entrant, skipping.", error); return; }
      isProcessingErrorRef.current = true;
      console.error("EL onError Hook:", error);
      
      const errorMessage = error.message || "AI Agent encountered an error.";
      setMediaError(`AI Agent Error: ${errorMessage}`);
      toast({ variant: "destructive", title: "AI Agent Error", description: errorMessage });

      if (countdownIntervalRef.current) { clearInterval(countdownIntervalRef.current); countdownIntervalRef.current = null; }
      if (sessionTimerIdRef.current) { clearTimeout(sessionTimerIdRef.current); sessionTimerIdRef.current = null; }
      
      if (mediaRecorderRef.current && (mediaRecorderRef.current.state === "recording" || mediaRecorderRef.current.state === "paused")) {
        try { mediaRecorderRef.current.stop(); } catch (e) { console.warn("EL onError: Error stopping media recorder:", e); }
      }
      mediaRecorderRef.current = null;
      if (previewStreamRef.current) { previewStreamRef.current.getTracks().forEach(track => track.stop()); previewStreamRef.current = null; }
      if (combinedStreamRef.current) { combinedStreamRef.current.getTracks().forEach(track => track.stop()); combinedStreamRef.current = null; }
      if (videoPreviewRef.current && videoPreviewRef.current.srcObject) {
        const stream = videoPreviewRef.current.srcObject as MediaStream;
        stream?.getTracks().forEach(track => track.stop());
        videoPreviewRef.current.srcObject = null;
      }

      isStartingSessionRef.current = false; 
      isInterviewActiveRef.current = false;
      
      setStage("consent");
      setCountdown(null);
      setRecordedVideoBlob(null);
      setFeedbackResult(null);
      setConversationMessages([]);
      setFullTranscript("");
      setCameraPermission(null);
      setMicPermission(null);

      setTimeout(() => { isProcessingErrorRef.current = false; }, 3500);
    },
  });
  const conversationRef = useRef(conversation);
  useEffect(() => { conversationRef.current = conversation; }, [conversation]);
  const { isSpeaking: agentIsSpeaking } = conversation;

  const resetFullInterview = useCallback(() => {
    console.log("ResetFullInterview: Resetting states and refs...");
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
    isInterviewActiveRef.current = false;
    isIntentionalDisconnectRef.current = false;

    if (previewStreamRef.current) {
        previewStreamRef.current.getTracks().forEach(track => track.stop());
        previewStreamRef.current = null;
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
    recordedChunksRef.current = [];
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.ondataavailable = null;
      mediaRecorderRef.current.onstop = null;
      mediaRecorderRef.current.onerror = null;
      mediaRecorderRef.current = null;
    }

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
        conv.endSession().catch(e => console.error("CleanupResources: Error ending EL session:", e));
    } else {
        console.log("CleanupResources: EL session not connected or already cleaned up.");
    }
    
    if (mediaRecorderRef.current) {
      if (mediaRecorderRef.current.state === "recording" || mediaRecorderRef.current.state === "paused") {
        console.log("CleanupResources: Attempting to stop MediaRecorder. State:", mediaRecorderRef.current.state);
        try { mediaRecorderRef.current.stop(); } catch (e) { console.warn("CleanupResources: Error stopping media recorder:", e); }
      } else {
        console.log("CleanupResources: MediaRecorder not recording or already stopped. State:", mediaRecorderRef.current.state);
      }
      mediaRecorderRef.current.ondataavailable = null;
      mediaRecorderRef.current.onstop = null;
      mediaRecorderRef.current.onerror = null;
      mediaRecorderRef.current = null;
    }
    
    if (previewStreamRef.current) { previewStreamRef.current.getTracks().forEach(track => track.stop()); previewStreamRef.current = null; }
    if (combinedStreamRef.current) { combinedStreamRef.current.getTracks().forEach(track => track.stop()); combinedStreamRef.current = null; }
    if (videoPreviewRef.current && videoPreviewRef.current.srcObject) {
      const stream = videoPreviewRef.current.srcObject as MediaStream;
      stream?.getTracks().forEach(track => track.stop());
      videoPreviewRef.current.srcObject = null;
    }
    
    isInterviewActiveRef.current = false; 
    console.log("CleanupResources: Finished.");
  }, []); 


  const submitForFinalFeedback = useCallback(async (videoBlob: Blob | null) => {
    if (!videoBlob || videoBlob.size === 0) {
      toast({ variant: "destructive", title: "No Video Recorded", description: "Cannot submit feedback without a valid video recording." });
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
        cleanupResources(); resetFullInterview();
      }
    } catch (error) {
      console.error("Error getting feedback:", error);
      toast({ variant: "destructive", title: "Feedback Error", description: "Could not get AI feedback." });
      cleanupResources(); resetFullInterview();
    }
  }, [jobContext, toast, fullTranscript, cleanupResources, resetFullInterview]);

  const handleFinishInterview = useCallback(async () => {
    if (stageRef.current === 'submitting' || stageRef.current === 'feedback') {
      console.warn("handleFinishInterview: Called in terminal stage. Aborting. Stage:", stageRef.current);
      return;
    }
    if (!isInterviewActiveRef.current && stageRef.current !== "interviewing") {
      console.warn("handleFinishInterview: Interview not active or not in interviewing stage. Stage:", stageRef.current, "ActiveRef:", isInterviewActiveRef.current);
      cleanupResources(); resetFullInterview(); return;
    }

    console.log("handleFinishInterview: User initiated finish.");
    isInterviewActiveRef.current = false; 
    isIntentionalDisconnectRef.current = true; 

    if (sessionTimerIdRef.current) { clearTimeout(sessionTimerIdRef.current); sessionTimerIdRef.current = null; }
    
    const conv = conversationRef.current;
    if (conv && conv.status === 'connected') {
      try {
        console.log("handleFinishInterview: Ending EL session.");
        await conv.endSession(); 
      } catch (e) { console.error("handleFinishInterview: Error ending EL session:", e); }
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      console.log("handleFinishInterview: Stopping MediaRecorder.");
      mediaRecorderRef.current.stop(); 
    } else if (recordedVideoBlob && recordedVideoBlob.size > 0 && stageRef.current !== "feedback" && stageRef.current !== "submitting") {
      console.log("handleFinishInterview: MediaRecorder already stopped, processing existing blob. Stage:", stageRef.current);
      submitForFinalFeedback(recordedVideoBlob);
    } else if (recordedChunksRef.current.length > 0 && stageRef.current !== "feedback" && stageRef.current !== "submitting") {
      console.log("handleFinishInterview: Processing existing chunks as recorder was stopped. Stage:", stageRef.current);
      const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
      if (blob.size > 0) { submitForFinalFeedback(blob); } 
      else { 
        toast({ variant: "destructive", title: "Recording Issue", description: "No video data found to submit." });
        cleanupResources(); 
        resetFullInterview(); 
      }
    } else {
      console.warn("handleFinishInterview: No recording data or recorder active to stop. Stage:", stageRef.current);
      if (stageRef.current !== "feedback" && stageRef.current !== "submitting") {
        toast({ variant: "destructive", title: "Recording Issue", description: "No video available to submit." });
        cleanupResources();
        resetFullInterview();
      }
    }
  }, [submitForFinalFeedback, toast, recordedVideoBlob, cleanupResources, resetFullInterview]);


  const startInterviewSession = useCallback(async () => {
    if (isStartingSessionRef.current || isProcessingErrorRef.current || isInterviewActiveRef.current) {
      console.warn("StartInterviewSession: Aborted due to active process/error/session. Starting:", isStartingSessionRef.current, "ProcessingError:", isProcessingErrorRef.current, "Active:", isInterviewActiveRef.current);
      if(isStartingSessionRef.current) toast({title: "Session Start In Progress", description: "Please wait..."});
      return;
    }
    
    setMediaError(null); setFeedbackResult(null);
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
      // Request Camera for Preview
      const cameraStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      setCameraPermission(true);
      if (videoPreviewRef.current) {
        if (previewStreamRef.current) { previewStreamRef.current.getTracks().forEach(track => track.stop()); }
        previewStreamRef.current = cameraStream;
        videoPreviewRef.current.srcObject = previewStreamRef.current;
        videoPreviewRef.current.muted = true; 
        videoPreviewRef.current.play().catch(e => console.error("Preview play error", e));
      }
      
      // Request Mic (and implicitly Camera again for combined stream)
      const micAndCamStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setMicPermission(true); 
      if (combinedStreamRef.current) { combinedStreamRef.current.getTracks().forEach(track => track.stop()); }
      combinedStreamRef.current = micAndCamStream;
      console.log("Media permissions granted for video and audio.");

      mediaRecorderRef.current = new MediaRecorder(combinedStreamRef.current, { mimeType: 'video/webm' });
      
      setStage("countdown");
      setCountdown(SESSION_COUNTDOWN_SECONDS);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev === null || prev <= 1) {
            if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
            console.log("Countdown finished. Starting EL session.");
            const conv = conversationRef.current;
            if (conv) {
              conv.startSession({ agentId: ELEVENLABS_AGENT_ID })
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
      console.error("Error accessing media devices or setting up recorder.", err);
      const error = err as Error;
      let desc = "Media device error. Check permissions.";
      if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") desc = "No camera/mic found.";
      else if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
        desc = "Camera/Microphone permission denied by user or system.";
        setCameraPermission(false); setMicPermission(false);
      }
      else if (error.name === "OverconstrainedError" || error.name === "ConstraintNotSatisfiedError") desc = "Camera/Mic doesn't support requested constraints.";
      setMediaError(desc);
      toast({ variant: "destructive", title: "Media Error", description: desc });
      
      isStartingSessionRef.current = false; 
      cleanupResources(); resetFullInterview();
    }
  }, [toast, elevenLabsApiKey, resetFullInterview]); 

  const handleElevenError = useCallback((error: Error, context?: string) => { 
    if (isProcessingErrorRef.current) {
      console.warn(`EL onError (${context || 'general'}): Already processing an error. Skipping. Error:`, error);
      return;
    }
    isProcessingErrorRef.current = true;
    console.error(`EL onError (${context || 'general'}):`, error);
    
    const errorMessage = error.message || "AI Agent connection error.";
    setMediaError(`AI Agent Error: ${errorMessage}`);
    toast({ variant: "destructive", title: `AI Agent Error (${context || 'General'})`, description: errorMessage });

    cleanupResources();
    resetFullInterview(); 
    
    setTimeout(() => { isProcessingErrorRef.current = false; }, 3000); 
  }, [toast, cleanupResources, resetFullInterview]);


  useEffect(() => {
    return () => {
        console.log("AIInterviewClient: Unmounting. Stage:", stageRef.current);
        isIntentionalDisconnectRef.current = true; 
        cleanupResources();
    };
  }, [cleanupResources]);

  const handleConsentAndStart = () => {
    if (consentGiven) {
        resetFullInterview(); 
        setStage("preparingStream");
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
          <AlertDescription>The ElevenLabs API Key is missing. Please set NEXT_PUBLIC_ELEVENLABS_API_KEY.</AlertDescription>
        </Alert>
      );
    }

    return (
      <Card className="shadow-xl relative overflow-hidden min-h-[500px] md:min-h-[600px] flex flex-col">
        {/* Base Video Feed */}
        <div className="absolute inset-0 w-full h-full">
            <video ref={videoPreviewRef} className="w-full h-full object-cover transform scale-x-[-1]" playsInline autoPlay muted />
        </div>
        
        {/* AI Agent Status Overlay (Top) */}
        <div className="absolute top-0 left-0 right-0 p-3 bg-black/60 backdrop-blur-sm text-white rounded-t-md z-20 shadow-lg flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <BotMessageSquare className="h-6 w-6 text-primary" />
              <span className="font-semibold">Mira - AI Interviewer</span>
              <div
                className={cn(
                  'ai-speaking-orb',
                  agentIsSpeaking && 'speaking' 
                )}
              />
            </div>
            <div className="flex items-center gap-2">
                {(stage === 'interviewing' && conversationRef.current?.status === "connected" && !agentIsSpeaking) && (
                <div className="flex items-center text-xs text-white/70">
                    <Mic className="h-4 w-4 mr-1 animate-pulse" /> 
                    Listening...
                </div>
                )}
                <span className="text-xs">Status: {conversationRef.current?.status || "Initializing..."}</span>
            </div>
        </div>
        
        {/* Chat Messages Overlay (Bottom) */}
        <div className="absolute bottom-16 left-0 right-0 p-3 max-h-[40%] overflow-y-auto bg-black/70 backdrop-blur-md z-10 space-y-2 flex flex-col-reverse pointer-events-auto">
          <div ref={chatMessagesEndRef} />
          {conversationMessages.slice().reverse().map((msg, index) => ( 
            <div key={msg.timestamp + '-' + index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`p-2 px-3 rounded-lg max-w-[80%] text-sm shadow-md ${msg.sender === 'user' ? 'bg-primary text-primary-foreground' : 'bg-background/90 text-foreground border border-border/50 backdrop-blur-sm'}`}>
                {msg.text}
              </div>
            </div>
          ))}
        </div>

        {(stage === 'preparingStream') && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white bg-black/70 z-30">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-2" />
            <p>{ (cameraPermission === null || micPermission === null) ? "Requesting Permissions..." : "Preparing Interview..."}</p>
            { isStartingSessionRef.current && <p className="text-xs mt-1">Connecting to AI Agent...</p>}
          </div>
        )}
         {stage === "countdown" && countdown !== null && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-40">
            <div className="text-7xl font-bold text-white">{countdown}</div>
          </div>
        )}
        {mediaRecorderRef.current?.state === "recording" && (
          <div className="absolute top-16 left-3 bg-red-500 text-white p-1 px-2 rounded text-xs flex items-center animate-pulse z-20">
            <Timer className="h-4 w-4 mr-1" /> REC
          </div>
        )}

        {(mediaError || (cameraPermission === false && stage !== 'consent' && stage !== 'feedback' && stage !== 'submitting') || (micPermission === false && stage !== 'consent' && stage !== 'feedback' && stage !== 'submitting')) && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/90 z-50 p-4">
            <Alert variant="destructive" className="shadow-md max-w-sm mx-auto">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Media Error</AlertTitle>
              <AlertDescription>{mediaError || "Camera/microphone access was not granted or is unavailable."}
                <Button onClick={() => { resetFullInterview(); }} className="w-full mt-3" size="sm" variant="outline">
                    Back to Consent & Retry
                </Button>
              </AlertDescription>
            </Alert>
          </div>
        )}
        <div className="flex-grow pointer-events-none"> </div>
        <CardFooter className="border-t border-border/30 bg-background/80 backdrop-blur-sm p-4 z-10 relative mt-auto">
           {stage === "interviewing" && isInterviewActiveRef.current && (
            <Button onClick={handleFinishInterview} className="w-full" size="lg" variant="default">
              Finish Interview & Get Feedback
            </Button>
          )}
        </CardFooter>
      </Card>
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
          <Card className="shadow-md">
              <CardHeader><CardTitle className="text-lg flex items-center"><MessageSquareIcon className="mr-2 h-5 w-5 text-primary"/>Full Conversation Transcript</CardTitle></CardHeader>
              <CardContent>
                <pre className="text-sm whitespace-pre-line bg-muted p-4 rounded-md max-h-96 overflow-y-auto">
                  {fullTranscript || "No transcript available."}
                </pre>
              </CardContent>
            </Card>
        </CardContent>
        <CardFooter>
          <Button onClick={() => { resetFullInterview(); }} className="w-full" size="lg">Start New AI Interview</Button>
        </CardFooter>
      </Card>
    </div>
  );

  useEffect(() => {
    if (stage === "interviewing") {
      chatMessagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [conversationMessages, stage]);


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
    

