
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Camera, CheckCircle, Loader2, MicOff, Video, Timer, AlertCircle, BotMessageSquare, User, Film } from "lucide-react";
import { useEffect, useRef, useState, useCallback } from "react";
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

type InterviewStage = "consent" | "preparingStream" | "countdown" | "recording" | "submitting" | "feedback";

const RECORDING_DURATION_MS = 60 * 1000; // 1 minute for the single recording

const formatFeedbackText = (text: string | undefined): React.ReactNode => {
  if (!text) return "No feedback content available.";

  const lines = text.split('\n');
  const output: JSX.Element[] = [];
  let listItems: JSX.Element[] = [];

  const renderTextWithBold = (line: string, keyPrefix: string): React.ReactNode[] => {
    // Regex to split by **bolded text** while keeping the bolded text as a separate part
    const parts = line.split(/(\*\*.*?\*\*)/g); 
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        // Return <strong> for bolded parts
        return <strong key={`${keyPrefix}-bold-${index}`}>{part.substring(2, part.length - 2)}</strong>;
      }
      // Return regular text
      return part; 
    });
  };

  lines.forEach((line, index) => {
    const trimmedLine = line.trim();
    // Check for bullet points (*, •, -) followed by a space
    const bulletMatch = trimmedLine.match(/^([*•-])\s(.*)/);

    if (bulletMatch) {
      const itemText = bulletMatch[2]; // Text after the bullet point and space
      listItems.push(<li key={`li-${index}`}>{renderTextWithBold(itemText, `li-${index}`)}</li>);
    } else {
      // If there were pending list items, render them as a <ul>
      if (listItems.length > 0) {
        output.push(<ul key={`ul-${output.length}`} className="list-disc pl-6 space-y-1 my-3">{listItems}</ul>);
        listItems = []; // Reset for next potential list
      }
      // Render non-list lines as <p>, but only if they are not empty
      if (trimmedLine) {
        output.push(<p key={`p-${index}`} className="my-3">{renderTextWithBold(trimmedLine, `p-${index}`)}</p>);
      } else if (output.length > 0 && (output[output.length - 1] as any)?.type === 'p') {
        // Add a line break for intentional empty lines between paragraphs, if desired
        // output.push(<br key={`br-${index}`} />); 
      }
    }
  });

  // If the text ends with list items, render them
  if (listItems.length > 0) {
    output.push(<ul key={`ul-${output.length}`} className="list-disc pl-6 space-y-1 my-3">{listItems}</ul>);
  }

  return output.length > 0 ? <>{output}</> : "No feedback content available.";
};


export function AIInterviewClient({ jobContext }: AIInterviewClientProps) {
  const { toast } = useToast();
  const [stage, setStage] = useState<InterviewStage>("consent");
  const [consentGiven, setConsentGiven] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isRecordingActive, setIsRecordingActive] = useState(false);
  const [recordedVideoBlob, setRecordedVideoBlob] = useState<Blob | null>(null);
  const [feedbackResult, setFeedbackResult] = useState<AiInterviewSimulationOutput | null>(null);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [cameraPermission, setCameraPermission] = useState<boolean | null>(null);


  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const videoPreviewRef = useRef<HTMLVideoElement | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const recordingTimerIdRef = useRef<NodeJS.Timeout | null>(null);

  const cleanupStreamAndRecorders = useCallback(() => {
    if (recordingTimerIdRef.current) {
      clearTimeout(recordingTimerIdRef.current);
      recordingTimerIdRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
     if (videoPreviewRef.current) {
        const stream = videoPreviewRef.current.srcObject;
        if (stream && typeof (stream as MediaStream).getTracks === 'function') {
            (stream as MediaStream).getTracks().forEach(track => track.stop());
        }
        videoPreviewRef.current.srcObject = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop(); 
    }
    mediaRecorderRef.current = null;
    setIsRecordingActive(false);
  }, []);

  const submitForFinalFeedback = useCallback(async (videoBlob: Blob) => {
    if (!videoBlob) {
      toast({ variant: "destructive", title: "No Video Recorded", description: "Cannot submit feedback without a video." });
      setStage("preparingStream");
      setMediaError("Submission failed: No video was recorded.");
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
        };
        const result = await aiInterviewSimulation(input);
        setFeedbackResult(result);
        setStage("feedback");
        toast({ title: "Feedback Received!", description: "AI has analyzed your response." });
        // Cleanup is now more general, called in resetFullInterview or on unmount
      };
      reader.onerror = () => {
        toast({ variant: "destructive", title: "File Read Error", description: "Could not process video for submission." });
        setStage("preparingStream");
        setMediaError("Failed to read video data for submission.");
      }
    } catch (error) {
      console.error("Error getting feedback:", error);
      toast({ variant: "destructive", title: "Feedback Error", description: "Could not get AI feedback." });
      setStage("preparingStream");
      setMediaError("Failed to get feedback from AI.");
    }
  }, [jobContext, toast]);

  const startRecordingProcess = useCallback(async () => {
    if (stage !== "preparingStream") return;
    setMediaError(null);
    setRecordedVideoBlob(null);
    recordedChunksRef.current = [];

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setMediaError("Media recording (camera/microphone) is not supported in this browser.");
        toast({ variant: "destructive", title: "Unsupported Browser", description: "Media recording not supported." });
        setStage("preparingStream");
        setCameraPermission(false);
        return;
    }
    
    try {
        streamRef.current = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setCameraPermission(true);
        if (videoPreviewRef.current) {
          videoPreviewRef.current.srcObject = streamRef.current;
          videoPreviewRef.current.muted = true; 
          videoPreviewRef.current.play().catch(e => console.error("Preview play error", e));
        }

        mediaRecorderRef.current = new MediaRecorder(streamRef.current);
        mediaRecorderRef.current.ondataavailable = (e) => { if (e.data.size > 0) recordedChunksRef.current.push(e.data); };
        mediaRecorderRef.current.onstop = () => {
          const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
          setRecordedVideoBlob(blob);
          if(stage === 'recording' || stage === 'countdown') { 
            submitForFinalFeedback(blob);
          }
        };

        setStage("countdown");
        setCountdown(5);
        const countdownInterval = setInterval(() => {
          setCountdown(prev => {
            if (prev === null || prev <= 1) {
              clearInterval(countdownInterval);
              setStage("recording");
              setIsRecordingActive(true);
              if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "recording") {
                mediaRecorderRef.current.start();
              }
              recordingTimerIdRef.current = setTimeout(() => {
                if (mediaRecorderRef.current?.state === "recording") {
                  toast({ title: "Time's Up!", description: "Recording automatically stopped."});
                  mediaRecorderRef.current.stop(); 
                  setIsRecordingActive(false); 
                }
              }, RECORDING_DURATION_MS);
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
        setStage("preparingStream"); 
      }
  }, [stage, toast, submitForFinalFeedback]);
  

  const handleFinishRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop(); 
      setIsRecordingActive(false);
      if (recordingTimerIdRef.current) {
        clearTimeout(recordingTimerIdRef.current);
        recordingTimerIdRef.current = null;
      }
      // Submission is now handled by onstop handler when blob is ready.
    }
  };

  useEffect(() => {
    if (recordedVideoBlob && stage === "recording" && !isRecordingActive) {
        submitForFinalFeedback(recordedVideoBlob);
    }
  }, [recordedVideoBlob, stage, isRecordingActive, submitForFinalFeedback]);


  const resetFullInterview = useCallback(() => {
    cleanupStreamAndRecorders();
    setFeedbackResult(null);
    setRecordedVideoBlob(null);
    setCountdown(null);
    setMediaError(null);
    setConsentGiven(false); 
    setStage("consent");
    setCameraPermission(null);
  }, [cleanupStreamAndRecorders]);

  useEffect(() => {
    if (consentGiven && stage === "consent") {
      setStage("preparingStream");
    }
  }, [consentGiven, stage]);

  useEffect(() => {
    if (stage === "preparingStream" && consentGiven) {
      startRecordingProcess();
    }
  }, [stage, consentGiven, startRecordingProcess]);

  useEffect(() => {
    return () => { 
      cleanupStreamAndRecorders();
    };
  }, [cleanupStreamAndRecorders]);

  const renderConsentDialog = () => (
    <Dialog open={stage === "consent"} onOpenChange={(open) => !open && stage === "consent" && setStage("consent")}>
      <DialogContent className="sm:max-w-[425px] shadow-xl">
        <DialogHeader>
          <DialogTitle>Consent for Recording</DialogTitle>
          <DialogDescription>
            This AI Interview Simulation requires access to your camera and microphone to record your video response. The recording will start after a brief countdown and will last up to {RECORDING_DURATION_MS / 1000} seconds. Your recording will be used solely for AI-generated feedback.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center space-x-2 py-4">
          <Checkbox id="consent-checkbox" checked={consentGiven} onCheckedChange={(checked) => setConsentGiven(Boolean(checked))} />
          <Label htmlFor="consent-checkbox">I consent to video and audio recording.</Label>
        </div>
        <DialogFooter>
          <Button type="button" onClick={() => {
            if(consentGiven) setStage("preparingStream");
            else toast({variant: "destructive", title: "Consent Required", description: "You must consent to proceed."})
          }} disabled={!consentGiven}>Continue</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  const renderInterviewContent = () => {
    return (
      <div className="grid md:grid-cols-2 gap-6 items-start">
        {/* AI Interviewer Panel */}
        <Card className="shadow-lg md:sticky md:top-20">
          <CardHeader className="text-center">
            <BotMessageSquare className="h-16 w-16 mx-auto text-primary mb-2" />
            <CardTitle className="text-xl">Mira - Your AI Interviewer</CardTitle>
            <CardDescription>Job: {jobContext.jobTitle}</CardDescription>
          </CardHeader>
          <CardContent>
            <Alert variant="default" className="bg-primary/10 border-primary/20">
                <User className="h-4 w-4 !text-primary"/>
                <AlertTitle className="text-primary">Your Prompt</AlertTitle>
                <AlertDescription className="text-sm">
                    Hello! Please introduce yourself. Tell us about your experience and why you're interested in the {jobContext.jobTitle} role. 
                    Speak clearly and naturally. You have up to {RECORDING_DURATION_MS / 1000} seconds. Good luck!
                </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Video Recorder Panel */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Film className="text-primary"/> Your Video Response
            </CardTitle>
            <CardDescription>
              The recording will start after the countdown.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="aspect-video w-full bg-muted rounded-md flex items-center justify-center overflow-hidden relative shadow-inner">
              <video ref={videoPreviewRef} className="w-full h-full object-cover transform scale-x-[-1]" playsInline autoPlay muted />
              {stage === "preparingStream" && !streamRef.current && !mediaError && cameraPermission === null && <Loader2 className="absolute h-16 w-16 text-primary animate-spin" />}
              {stage === "countdown" && countdown !== null && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/70">
                    <div className="text-7xl font-bold text-white">{countdown}</div>
                </div>
              )}
              {isRecordingActive && (
                <div className="absolute top-2 left-2 bg-red-500 text-white p-1 px-2 rounded text-xs flex items-center animate-pulse">
                  <Timer className="h-4 w-4 mr-1" /> REC
                </div>
              )}
               {/* Show camera icon if permission not granted or no stream and not preparing */}
               {((cameraPermission === false || (!streamRef.current && videoPreviewRef.current?.srcObject === null)) &&
                 stage !== "preparingStream" && stage !== "countdown" && !isRecordingActive && !mediaError) && (
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
          <CardFooter>
            {stage === "recording" && isRecordingActive && (
              <Button onClick={handleFinishRecording} className="w-full" size="lg">
                Stop Recording & Get Feedback
              </Button>
            )}
            {((stage === "preparingStream" && mediaError) || cameraPermission === false) && (
               <Button onClick={startRecordingProcess} className="w-full" size="lg">
                  Try Again
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    );
  };

  const renderFeedbackContent = () => (
    <Card className="shadow-xl mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl"><CheckCircle className="text-green-500" /> AI Feedback Received</CardTitle>
        <CardDescription>Analysis of your video response for the {jobContext.jobTitle} role.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert variant="default" className="bg-primary/5 border-primary/20">
            <User className="h-4 w-4 !text-primary" />
            <AlertTitle className="text-primary font-semibold">Key Feedback Points</AlertTitle>
            <AlertDescription className="text-sm">
                {formatFeedbackText(feedbackResult?.feedback)}
            </AlertDescription>
        </Alert>
        {recordedVideoBlob && (
          <div>
            <h4 className="font-semibold mb-2 text-md">Review Your Recorded Video:</h4>
            <video src={URL.createObjectURL(recordedVideoBlob)} controls className="w-full rounded-md shadow-inner aspect-video" />
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={resetFullInterview} className="w-full" size="lg">Start New Simulation</Button>
      </CardFooter>
    </Card>
  );

  return (
    <>
      {renderConsentDialog()}
      
      {stage === "submitting" && (
          <div className="text-center p-8 space-y-2">
              <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
              <p className="text-muted-foreground">AI is preparing your feedback...</p>
          </div>
      )}

      {(stage === "preparingStream" || stage === "countdown" || stage === "recording") && renderInterviewContent()}
      {stage === "feedback" && feedbackResult && renderFeedbackContent()}
    </>
  );
}

