
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Camera, CheckCircle, Loader2, MicOff, Video, Timer, AlertCircle } from "lucide-react";
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

export function AIInterviewClient({ jobContext }: AIInterviewClientProps) {
  const { toast } = useToast();
  const [stage, setStage] = useState<InterviewStage>("consent");
  const [consentGiven, setConsentGiven] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isRecordingActive, setIsRecordingActive] = useState(false);
  const [recordedVideoBlob, setRecordedVideoBlob] = useState<Blob | null>(null);
  const [feedbackResult, setFeedbackResult] = useState<AiInterviewSimulationOutput | null>(null);
  const [mediaError, setMediaError] = useState<string | null>(null);

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
    if (videoPreviewRef.current) videoPreviewRef.current.srcObject = null;

    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop(); // This will trigger onstop to process blob
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
        cleanupStreamAndRecorders(); // Clean up after successful submission
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
  }, [jobContext, toast, cleanupStreamAndRecorders]);

  const startRecordingProcess = useCallback(async () => {
    if (stage !== "preparingStream") return;
    setMediaError(null);
    setRecordedVideoBlob(null);
    recordedChunksRef.current = [];

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        streamRef.current = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (videoPreviewRef.current) {
          videoPreviewRef.current.srcObject = streamRef.current;
          videoPreviewRef.current.muted = true; // Mute preview to prevent feedback loop
          videoPreviewRef.current.play().catch(e => console.error("Preview play error", e));
        }

        mediaRecorderRef.current = new MediaRecorder(streamRef.current);
        mediaRecorderRef.current.ondataavailable = (e) => { if (e.data.size > 0) recordedChunksRef.current.push(e.data); };
        mediaRecorderRef.current.onstop = () => {
          const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
          setRecordedVideoBlob(blob);
          // If stopped manually by 'Finish Recording', feedback submission is handled there.
          // If stopped by timer, we might auto-submit or await user action.
          // For now, let's assume manual stop or auto-submit if stage is still 'recording'
          if(stage === 'recording' || stage === 'countdown') { // If timer caused stop
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
              // Set a timer to automatically stop recording
              recordingTimerIdRef.current = setTimeout(() => {
                if (mediaRecorderRef.current?.state === "recording") {
                  toast({ title: "Time's Up!", description: "Recording automatically stopped."});
                  mediaRecorderRef.current.stop(); // This will trigger onstop
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
        toast({ variant: "destructive", title: "Media Device Error", description: desc });
        setStage("preparingStream"); // Allow retry
      }
    } else {
      setMediaError("Media recording (camera/microphone) is not supported in this browser.");
      toast({ variant: "destructive", title: "Unsupported Browser", description: "Media recording not supported." });
      setStage("preparingStream"); // Or a permanent error state
    }
  }, [stage, toast, submitForFinalFeedback]);
  

  const handleFinishRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop(); // This will trigger onstop which sets recordedVideoBlob
      setIsRecordingActive(false);
      if (recordingTimerIdRef.current) {
        clearTimeout(recordingTimerIdRef.current);
        recordingTimerIdRef.current = null;
      }
      // The actual submission will happen once recordedVideoBlob is set by onstop
      // and then the useEffect below will trigger submitForFinalFeedback
    }
  };

  useEffect(() => {
    // This effect triggers submission once the blob is ready after stopping recording
    if (recordedVideoBlob && stage === "recording" && !isRecordingActive) {
       // This means recording was stopped and blob is ready
        submitForFinalFeedback(recordedVideoBlob);
    }
  }, [recordedVideoBlob, stage, isRecordingActive, submitForFinalFeedback]);


  const resetInterview = useCallback(() => {
    cleanupStreamAndRecorders();
    setFeedbackResult(null);
    setRecordedVideoBlob(null);
    setCountdown(null);
    setMediaError(null);
    setConsentGiven(false); // Require consent again
    setStage("consent");
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
    return () => { // Cleanup on unmount
      cleanupStreamAndRecorders();
    };
  }, [cleanupStreamAndRecorders]);

  const renderConsentDialog = () => (
    <Dialog open={stage === "consent"} onOpenChange={(open) => !open && stage === "consent" && setStage("consent")}>
      <DialogContent className="sm:max-w-[425px]">
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
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            AI Interview Simulation
          </CardTitle>
          <CardDescription>
            Record your video response. You have up to {RECORDING_DURATION_MS / 1000} seconds.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="aspect-video w-full bg-muted rounded-md flex items-center justify-center overflow-hidden relative shadow-inner">
            <video ref={videoPreviewRef} className="w-full h-full object-cover transform scale-x-[-1]" playsInline autoPlay muted />
            {(stage === "preparingStream" && !streamRef.current && !mediaError) && <Loader2 className="absolute h-16 w-16 text-primary animate-spin" />}
            {stage === "countdown" && countdown !== null && (
              <div className="absolute text-6xl font-bold text-white bg-black/50 p-4 rounded-lg">{countdown}</div>
            )}
            {isRecordingActive && (
              <div className="absolute top-2 left-2 bg-red-500 text-white p-1 px-2 rounded text-xs flex items-center animate-pulse">
                <Timer className="h-4 w-4 mr-1" /> REC
              </div>
            )}
            {!isRecordingActive && stage !== "countdown" && stage !== "preparingStream" && (!streamRef.current || videoPreviewRef.current?.srcObject === null) && !mediaError && (
                 <Camera className="absolute h-24 w-24 text-muted-foreground" />
            )}
          </div>
          
          {mediaError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Media Error</AlertTitle>
              <AlertDescription>{mediaError}</AlertDescription>
            </Alert>
          )}

        </CardContent>
        <CardFooter>
          {stage === "recording" && isRecordingActive && (
            <Button onClick={handleFinishRecording} className="w-full" size="lg">
              Stop Recording & Get Feedback
            </Button>
          )}
          {(stage === "preparingStream" && mediaError) && (
             <Button onClick={startRecordingProcess} className="w-full" size="lg">
                Try Again
            </Button>
          )}
        </CardFooter>
      </Card>
    );
  };

  const renderFeedbackContent = () => (
    <Card className="shadow-lg mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><CheckCircle className="text-green-500" /> AI Feedback</CardTitle>
        <CardDescription>Analysis of your video response.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
            <AlertTitle>Feedback from AI:</AlertTitle>
            <AlertDescription className="whitespace-pre-line">
                {feedbackResult?.feedback || "No feedback content available."}
            </AlertDescription>
        </Alert>
        {recordedVideoBlob && (
          <div>
            <h4 className="font-semibold mb-2">Your Recorded Video:</h4>
            <video src={URL.createObjectURL(recordedVideoBlob)} controls className="w-full rounded-md shadow-inner aspect-video" />
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={resetInterview} className="w-full">Start New Simulation</Button>
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

    