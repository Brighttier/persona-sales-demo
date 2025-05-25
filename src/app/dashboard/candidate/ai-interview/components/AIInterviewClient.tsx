
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Camera, CheckCircle, Loader2, Timer, AlertCircle, BotMessageSquare, User, Film, Brain, ThumbsUp, ThumbsDown, MessageSquare as MessageSquareIcon, Star, Users as UsersIcon, Volume2, Mic, MicOff } from "lucide-react";
import { useEffect, useRef, useState, useCallback } from "react";

import type { AiInterviewSimulationInput, AiInterviewSimulationOutput } from "@/ai/flows/ai-interview-simulation";
import { aiInterviewSimulation } from "@/ai/flows/ai-interview-simulation";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import * as ElevenReact from '@11labs/react'; // Use namespace import

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
  const streamRef = useRef<MediaStream | null>(null); // For camera
  const sessionTimerIdRef = useRef<NodeJS.Timeout | null>(null);
  const isInterviewActiveRef = useRef(false);
  const chatMessagesEndRef = useRef<HTMLDivElement | null>(null);

  const [conversationMessages, setConversationMessages] = useState<Message[]>([]);

  const elevenLabsApiKey = process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY;

  const conversation = ElevenReact.useConversation({
    onConnect: () => {
      console.log("ElevenLabs agent connected.");
      toast({ title: "AI Interviewer Connected", description: "Mira is ready." });
      setConversationMessages(prev => [...prev, { sender: 'agent', text: "Welcome! I'm Mira, your AI Interviewer. Let's begin.", timestamp: Date.now() }]);
    },
    onDisconnect: () => {
      console.log("ElevenLabs agent disconnected.");
      if (isInterviewActiveRef.current) { // Only show toast if disconnection was unexpected
         toast({ title: "AI Interviewer Disconnected", variant: "destructive" });
      }
    },
    onMessage: (message: any) => { // `any` for now, as message structure is not fully defined in docs
      console.log("ElevenLabs message:", message);
      // Attempt to interpret message structure based on typical conversational AI patterns
      let sender: 'user' | 'agent' = 'agent';
      let textContent = '';

      if (message.type === 'user_transcript' && message.isFinal) {
        sender = 'user';
        textContent = message.text;
        setFullTranscript(prev => prev + `\nCandidate: ${textContent}`);
      } else if (message.type === 'agent_response' && message.text) { // Assuming agent responses have a clear type
        sender = 'agent';
        textContent = message.text;
        setFullTranscript(prev => prev + `\nMira: ${textContent}`);
      } else if (typeof message.text === 'string') { // Fallback for simple text messages
        textContent = message.text;
        // Heuristic: if agent isn't speaking, assume it's a user transcript fragment
        if(!conversation.isSpeaking) sender = 'user';
        if (sender === 'agent') setFullTranscript(prev => prev + `\nMira: ${textContent}`);
        else setFullTranscript(prev => prev + `\nCandidate: ${textContent}`);
      } else if (message.audio && message.text) { // If it has audio, it's likely an agent speaking its text
        sender = 'agent';
        textContent = message.text;
        setFullTranscript(prev => prev + `\nMira: ${textContent}`);
      }


      if (textContent) {
        setConversationMessages(prev => [...prev, { sender, text: textContent, timestamp: Date.now() }]);
      }
    },
    onError: (error: Error) => {
      console.error("ElevenLabs error:", error);
      setMediaError(`AI Agent Error: ${error.message}`);
      toast({ variant: "destructive", title: "AI Agent Error", description: error.message });
      // Consider ending the interview session if a critical ElevenLabs error occurs
      if (isInterviewActiveRef.current) {
        handleFinishInterview();
      }
    },
  });

  const scrollToBottom = () => {
    chatMessagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [conversationMessages]);

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
    if (conversation.status === "connected") {
        console.log("Ending ElevenLabs session on cleanup.");
        conversation.endSession().catch(e => console.error("Error ending ElevenLabs session on cleanup:", e));
    }
  }, [conversation]);

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
        setStage("preparingStream");
      }
    } catch (error) {
      console.error("Error getting feedback:", error);
      toast({ variant: "destructive", title: "Feedback Error", description: "Could not get AI feedback." });
      setStage("preparingStream");
    }
  }, [jobContext, toast, fullTranscript]);

  const handleFinishInterview = useCallback(() => {
    console.log("handleFinishInterview called. Current stage:", stage);
    if (!isInterviewActiveRef.current && stage !== 'interviewing') {
      console.warn("Interview not active or not in interviewing stage, finish aborted.");
      return;
    }
    isInterviewActiveRef.current = false; // Mark interview as no longer active first
    if (sessionTimerIdRef.current) {
      clearTimeout(sessionTimerIdRef.current);
      sessionTimerIdRef.current = null;
    }

    if (conversation.status === "connected") {
        console.log("Ending ElevenLabs session via Finish button.");
        conversation.endSession().catch(e => console.error("Error ending ElevenLabs session:", e));
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      console.log("Stopping MediaRecorder via handleFinishInterview...");
      mediaRecorderRef.current.onstop = () => { // This onstop will be called
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        console.log("MediaRecorder stopped, blob size:", blob.size);
        setRecordedVideoBlob(blob);
        submitForFinalFeedback(blob);
        recordedChunksRef.current = [];
        // Clean up camera stream after recording stops AND session ends.
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
      toast({ variant: "destructive", title: "Recording Issue", description: "No video was recorded." });
    }
  }, [stage, recordedVideoBlob, submitForFinalFeedback, toast, conversation]);

  const startInterviewSession = useCallback(async () => {
    if (stage !== "preparingStream") return;
    
    setMediaError(null);
    setRecordedVideoBlob(null);
    setConversationMessages([]);
    setFullTranscript("");
    recordedChunksRef.current = [];

    if (!elevenLabsApiKey) {
        setMediaError("Configuration Error: ElevenLabs API Key is missing. Please set NEXT_PUBLIC_ELEVENLABS_API_KEY.");
        toast({variant: "destructive", title: "Config Error", description: "ElevenLabs API Key missing."});
        setStage("consent"); return;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setMediaError("Media recording (camera/microphone) is not supported in this browser.");
      toast({ variant: "destructive", title: "Unsupported Browser", description: "Media recording not supported." });
      setStage("consent"); setCameraPermission(false); setMicPermission(false); return;
    }

    try {
      // Request camera permission
      streamRef.current = await navigator.mediaDevices.getUserMedia({ video: true, audio: false }); // Audio for video is not from this stream
      setCameraPermission(true);
      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = streamRef.current;
        videoPreviewRef.current.muted = true; // Preview should be muted
        videoPreviewRef.current.play().catch(e => console.error("Preview play error", e));
      }

      // Request microphone permission for ElevenLabs (if not already granted by browser for the site)
      await navigator.mediaDevices.getUserMedia({ audio: true });
      setMicPermission(true);

      // Initialize MediaRecorder for video
      mediaRecorderRef.current = new MediaRecorder(streamRef.current);
      mediaRecorderRef.current.ondataavailable = (e) => { if (e.data.size > 0) recordedChunksRef.current.push(e.data); };
      mediaRecorderRef.current.onstop = () => {
          // This onstop is now primarily for when handleFinishInterview calls stop()
          // Or if the session times out and calls handleFinishInterview
          if (!isInterviewActiveRef.current) {
             const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
             setRecordedVideoBlob(blob);
             console.log("MediaRecorder stopped through onstop (likely via finish/timeout). Final blob size:", blob.size);
          } else {
              console.log("MediaRecorder onstop called, but interview still marked active. This shouldn't happen if cleanup is right.");
          }
        };
      
      setStage("countdown");
      setCountdown(SESSION_COUNTDOWN_SECONDS);
      const countdownInterval = setInterval(() => {
        setCountdown(prev => {
          if (prev === null || prev <= 1) {
            clearInterval(countdownInterval);
            setStage("interviewing");
            isInterviewActiveRef.current = true; // Mark interview as active
            
            if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "recording") {
              mediaRecorderRef.current.start(); // Start video recording
              console.log("Video recording started for the session.");
            }

            console.log("Starting ElevenLabs session...");
            conversation.startSession({ agentId: ELEVENLABS_AGENT_ID })
              .then(conversationId => {
                console.log("ElevenLabs session started, ID:", conversationId);
              })
              .catch(err => {
                console.error("Failed to start ElevenLabs session:", err);
                setMediaError(`Failed to start AI Agent: ${err.message}`);
                toast({variant: "destructive", title: "AI Agent Error", description: "Could not connect to the AI interviewer."});
                handleFinishInterview(); // Attempt to cleanup and end
              });

            sessionTimerIdRef.current = setTimeout(() => {
              if (isInterviewActiveRef.current) { // Check if still active before timeout forced finish
                toast({ title: "Session Timeout", description: "The interview session has ended due to timeout." });
                handleFinishInterview();
              }
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
      setCameraPermission(false); setMicPermission(false);
      toast({ variant: "destructive", title: "Media Device Error", description: desc });
      setStage("consent");
    }
  }, [stage, toast, handleFinishInterview, conversation, elevenLabsApiKey]);

  const resetFullInterview = useCallback(() => {
    cleanupResources();
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
  }, [cleanupResources]);

  useEffect(() => {
    if (consentGiven && stage === "consent") {
      setStage("preparingStream");
    }
  }, [consentGiven, stage]);

  useEffect(() => {
    if (stage === "preparingStream" && consentGiven) {
      startInterviewSession();
    }
  }, [stage, consentGiven, startInterviewSession]);

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
            if (consentGiven) setStage("preparingStream");
            else toast({ variant: "destructive", title: "Consent Required", description: "You must consent to proceed." })
          }} disabled={!consentGiven}>Start Interview</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  const renderInterviewContent = () => {
    if (!elevenLabsApiKey && stage !== "consent") { // Check only if past consent stage
      return (
        <Alert variant="destructive" className="shadow-lg">
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
          <CardHeader className="text-center border-b pb-3">
            <div className="flex items-center justify-center gap-2">
              <BotMessageSquare className="h-8 w-8 text-primary" />
              <CardTitle className="text-xl">Mira - Your AI Interviewer</CardTitle>
              {conversation.isSpeaking && <Volume2 className="h-6 w-6 text-accent animate-pulse" />}
            </div>
            <CardDescription>Status: {conversation.status}</CardDescription>
          </CardHeader>
          <CardContent className="flex-grow p-0 relative">
            {(stage === 'interviewing' || stage === 'submitting') && (
              <div className="h-[300px] md:h-full w-full overflow-y-auto p-4 space-y-3">
                {conversationMessages.map((msg, index) => (
                  <div key={msg.timestamp + '-' + index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`p-2 px-3 rounded-lg max-w-[80%] text-sm ${msg.sender === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
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
                <p>{stage === 'countdown' ? "Get Ready..." : "Preparing Interview..."}</p>
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

            {(mediaError || cameraPermission === false || micPermission === false) && (
              <Alert variant="destructive" className="shadow-md">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Media Error</AlertTitle>
                <AlertDescription>{mediaError || "Camera/microphone access was not granted or is unavailable."}</AlertDescription>
              </Alert>
            )}
             {!cameraPermission && stage === 'consent' && <AlertDescription>Camera permission is needed for video recording.</AlertDescription>}
             {!micPermission && stage === 'consent' && <AlertDescription>Microphone permission is needed for the AI Agent.</AlertDescription>}

          </CardContent>
          <CardFooter className="flex-col space-y-2">
            {stage === "interviewing" && (
              <Button onClick={handleFinishInterview} className="w-full" size="lg" variant="default">
                Finish Interview & Get Feedback
              </Button>
            )}
            {((stage === "preparingStream" && mediaError) || cameraPermission === false || micPermission === false) && stage !== "consent" && (
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

    