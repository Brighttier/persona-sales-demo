
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Camera, CheckCircle, Loader2, MicOff, Video, Timer, AlertCircle, BotMessageSquare, User, Film, Volume2, ThumbsUp, ThumbsDown, MessageSquare, Star, Users, Brain } from "lucide-react";
import { useEffect, useRef, useState, useCallback } from "react";

import type { AiInterviewSimulationInput, AiInterviewSimulationOutput } from "@/ai/flows/ai-interview-simulation";
import { aiInterviewSimulation } from "@/ai/flows/ai-interview-simulation";
import type { InitialInterviewUtteranceOutput } from "@/ai/flows/initial-interview-message";
import { getInitialInterviewUtterance } from "@/ai/flows/initial-interview-message";
import type { FollowUpQuestionOutput } from "@/ai/flows/follow-up-question";
import { getFollowUpQuestion } from "@/ai/flows/follow-up-question";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface AIInterviewClientProps {
  jobContext: {
    jobTitle: string;
    jobDescription: string;
    candidateResume: string;
  };
}

type InterviewStage = "consent" | "preparingStream" | "countdown" | "interviewing" | "submitting" | "feedback";
const MAX_INTERVIEW_TURNS = 2; // Initial question + 1 follow-up
const SESSION_COUNTDOWN_SECONDS = 5;
const MAX_SESSION_DURATION_MS = 3 * 60 * 1000; // 3 minutes for the whole session

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
  
  const [currentAiMessage, setCurrentAiMessage] = useState<string | null>("Preparing for your interview...");
  const [currentTurn, setCurrentTurn] = useState(0);
  const [sessionTranscript, setSessionTranscript] = useState<string[]>([]);
  const [isMiraSpeaking, setIsMiraSpeaking] = useState(false);
  const [isCandidateSpeaking, setIsCandidateSpeaking] = useState(false); // For STT visual cue

  const [recordedVideoBlob, setRecordedVideoBlob] = useState<Blob | null>(null);
  const [feedbackResult, setFeedbackResult] = useState<AiInterviewSimulationOutput | null>(null);
  
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [cameraPermission, setCameraPermission] = useState<boolean | null>(null);
  const [speechApiError, setSpeechApiError] = useState<string | null>(null);
  
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const videoPreviewRef = useRef<HTMLVideoElement | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const speechRecognitionRef = useRef<SpeechRecognition | null>(null);
  const sessionTimerIdRef = useRef<NodeJS.Timeout | null>(null);
  const isInterviewActiveRef = useRef(false);


  const loadVoices = useCallback(() => {
    const voices = speechSynthesis.getVoices();
    setAvailableVoices(voices);
    if (voices.length > 0) {
        let preferredVoice = voices.find(voice => voice.name === 'Google US English Female' && voice.lang.startsWith('en-US'));
        if (!preferredVoice) preferredVoice = voices.find(voice => voice.name === 'Microsoft Zira - English (United States)' && voice.lang.startsWith('en-US'));
        if (!preferredVoice) preferredVoice = voices.find(voice => voice.lang.startsWith('en-US') && voice.gender === 'female');
        if (!preferredVoice) preferredVoice = voices.find(voice => voice.lang.startsWith('en-US'));
        if (!preferredVoice) preferredVoice = voices.find(voice => voice.lang.startsWith('en'));
        setSelectedVoice(preferredVoice || voices[0]);
    }
  }, []);

  useEffect(() => {
    loadVoices();
    if (speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = loadVoices;
    }
    return () => {
        speechSynthesis.onvoiceschanged = null;
    };
  }, [loadVoices]);

  const speak = useCallback((text: string | null | undefined, onEndCallback?: () => void) => {
    if (speechSynthesis.speaking) {
        speechSynthesis.cancel(); 
    }

    if (!text || text.trim() === "") {
        console.warn("Speak function called with empty text.");
        setSpeechApiError(null);
        setIsMiraSpeaking(false);
        onEndCallback?.();
        return;
    }
    setSpeechApiError(null);
    setIsMiraSpeaking(true);

    const utterance = new SpeechSynthesisUtterance(text);
    let currentSelectedVoice = selectedVoice;

    if (!currentSelectedVoice) {
        const currentVoices = speechSynthesis.getVoices();
        if (currentVoices.length > 0) {
            let preferredVoice = currentVoices.find(voice => voice.name === 'Google US English Female' && voice.lang.startsWith('en-US'));
            if (!preferredVoice) preferredVoice = currentVoices.find(voice => voice.name === 'Microsoft Zira - English (United States)' && voice.lang.startsWith('en-US'));
            if (!preferredVoice) preferredVoice = currentVoices.find(voice => voice.lang.startsWith('en-US') && voice.gender === 'female');
            if (!preferredVoice) preferredVoice = currentVoices.find(voice => voice.lang.startsWith('en-US'));
            if (!preferredVoice) preferredVoice = currentVoices.find(voice => voice.lang.startsWith('en'));
            currentSelectedVoice = preferredVoice || currentVoices[0];
        }
    }
    
    if (currentSelectedVoice) {
        utterance.voice = currentSelectedVoice;
    } else {
        const noVoiceError = "No Text-to-Speech voices are available in your browser.";
        console.warn(noVoiceError);
        setSpeechApiError(noVoiceError);
        setIsMiraSpeaking(false);
        onEndCallback?.();
        return;
    }
    
    utterance.pitch = 1;
    utterance.rate = 0.9; 
    utterance.volume = 1;

    utterance.onend = () => {
      setIsMiraSpeaking(false);
      onEndCallback?.();
    };

    utterance.onerror = (event: SpeechSynthesisErrorEvent) => {
      console.error("SpeechSynthesis Error Event (see details in browser console):", event);
      let errorCode = "Unknown TTS Error";
       if (event.error && typeof event.error === 'string') {
          errorCode = event.error;
      } else if (event.error && typeof event.error === 'object') {
          errorCode = (event.error as any).message || JSON.stringify(event.error);
      }
      const fullErrorMessage = `SpeechSynthesis Error: ${errorCode}. Check browser console for details.`;
      setSpeechApiError(fullErrorMessage);
      toast({ variant: "destructive", title: "Speech Error", description: fullErrorMessage });
      setIsMiraSpeaking(false);
      onEndCallback?.(); 
    };
    
    try {
        speechSynthesis.speak(utterance);
    } catch (e: any) {
        console.error("Error calling speechSynthesis.speak():", e);
        const catchErrorMessage = `Failed to initiate speech synthesis: ${e.message || 'Unknown error'}. Ensure your browser supports it.`;
        setSpeechApiError(catchErrorMessage);
        toast({ variant: "destructive", title: "Speech Init Error", description: catchErrorMessage});
        setIsMiraSpeaking(false);
        onEndCallback?.();
    }
  }, [selectedVoice, toast]);


  const initializeSpeechRecognition = useCallback(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setSpeechApiError("Speech recognition is not supported in this browser.");
      toast({ variant: "destructive", title: "Unsupported Browser", description: "Speech recognition not supported." });
      return null;
    }
    const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = true; // Keep listening
    recognition.interimResults = true; // Get results as they come
    recognition.lang = 'en-US';

    recognition.onstart = () => setIsCandidateSpeaking(true);
    recognition.onend = () => setIsCandidateSpeaking(false);
    
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = '';
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      // For now, we primarily care about the final transcript for each utterance.
      // We'll append to sessionTranscript when an "answer" is considered complete.
      // For interim visual feedback, you could update a temporary state here.
      if (finalTranscript.trim()) {
        // This will be refined: transcript for the current answer.
        // console.log("Final segment: ", finalTranscript);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error("SpeechRecognition Error:", event.error);
      let errorMsg = `SpeechRecognition Error: "${event.error}"`;
       if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        errorMsg = "Microphone access denied or service not allowed. Please check browser permissions.";
        setMediaError(errorMsg);
      } else if (event.error === 'no-speech') {
        errorMsg = "No speech detected. Please ensure your microphone is working and you are speaking clearly.";
      }
      setSpeechApiError(errorMsg);
      toast({ variant: "destructive", title: "Speech Recognition Error", description: errorMsg });
      setIsCandidateSpeaking(false);
    };
    return recognition;
  }, [toast]);
  

  const cleanupResources = useCallback(() => {
    console.log("Cleaning up resources...");
    isInterviewActiveRef.current = false;
    if (sessionTimerIdRef.current) {
      clearTimeout(sessionTimerIdRef.current);
      sessionTimerIdRef.current = null;
    }
    if (speechRecognitionRef.current) {
      speechRecognitionRef.current.onresult = null; 
      speechRecognitionRef.current.onerror = null;
      speechRecognitionRef.current.onstart = null;
      speechRecognitionRef.current.onend = null;
      if (isCandidateSpeaking) { // Check if STT is active before trying to stop
          try {
            speechRecognitionRef.current.stop();
          } catch (e) {
            console.warn("Error stopping STT on cleanup:", e);
          }
      }
      speechRecognitionRef.current = null;
      setIsCandidateSpeaking(false);
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        console.log("Stopping MediaRecorder on cleanup...");
        mediaRecorderRef.current.stop(); // This will trigger onstop
    }
    mediaRecorderRef.current = null; // Explicitly nullify
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoPreviewRef.current && videoPreviewRef.current.srcObject) {
        const stream = videoPreviewRef.current.srcObject as MediaStream;
        stream?.getTracks().forEach(track => track.stop());
        videoPreviewRef.current.srcObject = null;
    }
    if (speechSynthesis.speaking) {
        speechSynthesis.cancel();
    }
    setIsMiraSpeaking(false);
  }, [isCandidateSpeaking]);

  const submitForFinalFeedback = useCallback(async (videoBlob: Blob) => {
    if (!videoBlob) {
      toast({ variant: "destructive", title: "No Video Recorded", description: "Cannot submit feedback without a video." });
      setStage("preparingStream"); // Or an appropriate error stage
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
          fullTranscript: sessionTranscript.join('\n\n---\n\n'), // Join all transcribed answers
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
  }, [jobContext, sessionTranscript, toast]);


  const handleFinishInterview = useCallback(() => {
    console.log("handleFinishInterview called. Current stage:", stage);
    if (!isInterviewActiveRef.current && stage !== 'interviewing') {
        console.warn("Interview not active or not in interviewing stage, finish aborted.");
        return;
    }
    isInterviewActiveRef.current = false; // Signal interview end
    if (sessionTimerIdRef.current) {
        clearTimeout(sessionTimerIdRef.current);
        sessionTimerIdRef.current = null;
    }
    if (speechRecognitionRef.current && isCandidateSpeaking) {
        try {
            speechRecognitionRef.current.stop();
        } catch(e) { console.warn("Error stopping STT on finish:", e); }
    }
    setIsCandidateSpeaking(false);

    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        console.log("Stopping MediaRecorder via handleFinishInterview...");
        mediaRecorderRef.current.onstop = () => { // Ensure this is set before stop()
            const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
            console.log("MediaRecorder stopped, blob size:", blob.size);
            setRecordedVideoBlob(blob); // This will trigger useEffect for submission
            submitForFinalFeedback(blob); 
        };
        mediaRecorderRef.current.stop();
    } else if (recordedVideoBlob) { // If already stopped but blob exists
        console.log("MediaRecorder already stopped, submitting existing blob.");
        submitForFinalFeedback(recordedVideoBlob);
    } else {
        console.warn("No recording or blob found to submit.");
        setStage("preparingStream"); // Or an error state
        toast({variant: "destructive", title: "Recording Issue", description: "No video was recorded."});
    }
    // cleanupResources should not be called here if it also tries to stop mediaRecorder,
    // as onstop handles the blob processing and submission.
    // It will be called when unmounting or resetting.
  }, [stage, recordedVideoBlob, submitForFinalFeedback, toast, isCandidateSpeaking]);


  const askNextQuestion = useCallback(async () => {
    if (currentTurn === 0) { // Initial question
      try {
        const utterance: InitialInterviewUtteranceOutput = await getInitialInterviewUtterance({ jobTitle: jobContext.jobTitle });
        setCurrentAiMessage(utterance.aiGreeting + " " + utterance.firstQuestion);
        speak(utterance.aiGreeting + " " + utterance.firstQuestion, () => {
          if (speechRecognitionRef.current && isInterviewActiveRef.current) speechRecognitionRef.current.start();
        });
      } catch (error) {
        console.error("Error getting initial question:", error);
        setCurrentAiMessage("Sorry, I'm having trouble starting the interview. Please try refreshing.");
        speak("Sorry, I'm having trouble starting the interview. Please try refreshing.");
        handleFinishInterview();
      }
    } else if (currentTurn < MAX_INTERVIEW_TURNS) { // Follow-up questions
        const lastQuestion = currentAiMessage || "The previous question."; // Fallback
        const lastAnswer = sessionTranscript[sessionTranscript.length - 1] || "No answer recorded."; // Last candidate answer

        try {
            const utterance: FollowUpQuestionOutput = await getFollowUpQuestion({
            jobDescription: jobContext.jobDescription,
            candidateResume: jobContext.candidateResume,
            previousQuestion: lastQuestion,
            candidateAnswer: lastAnswer,
            });
            setCurrentAiMessage(utterance.nextQuestion);
            speak(utterance.nextQuestion, () => {
              if (speechRecognitionRef.current && isInterviewActiveRef.current) speechRecognitionRef.current.start();
            });
        } catch (error) {
            console.error("Error getting follow-up question:", error);
            setCurrentAiMessage("I seem to have lost my train of thought. Let's proceed to feedback.");
            speak("I seem to have lost my train of thought. Let's proceed to feedback.", () => {
                handleFinishInterview();
            });
        }
    } else { // Max turns reached
      handleFinishInterview();
    }
  }, [currentTurn, jobContext, sessionTranscript, speak, handleFinishInterview, currentAiMessage]);

  const handleCandidateAnswer = () => { // Called when candidate indicates they're done with current answer
    if (speechRecognitionRef.current) {
        speechRecognitionRef.current.stop(); // Stop STT for this turn
    }
    
    // Simulate capturing the final transcript for this turn.
    // In a real STT setup, you'd get this from the 'onresult' final transcript.
    // For this placeholder, let's assume the 'speechRecognitionRef.current.onresult' populated some temp state.
    // For simplicity, we'll mock it.
    const currentAnswerTranscript = speechRecognitionRef.current?.transcriptForCurrentTurn || `(Mocked Answer for turn ${currentTurn + 1})`;
    setSessionTranscript(prev => [...prev, currentAnswerTranscript]);
    
    setCurrentTurn(prev => prev + 1);
    // askNextQuestion will be called by useEffect watching currentTurn
  };


  const startInterviewProcess = useCallback(async () => {
    if (stage !== "preparingStream") return;
    isInterviewActiveRef.current = true;
    setMediaError(null);
    setRecordedVideoBlob(null);
    setSessionTranscript([]);
    setCurrentTurn(0);
    recordedChunksRef.current = [];

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setMediaError("Media recording (camera/microphone) is not supported in this browser.");
        toast({ variant: "destructive", title: "Unsupported Browser", description: "Media recording not supported." });
        isInterviewActiveRef.current = false; setStage("preparingStream"); setCameraPermission(false); return;
    }
    
    const recognition = initializeSpeechRecognition();
    if (!recognition) { 
        isInterviewActiveRef.current = false; setStage("preparingStream"); return;
    }
    speechRecognitionRef.current = recognition;
    // Accumulate transcript segments here
    let currentAnswerFinalTranscript = "";
    speechRecognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
        let interim = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
                currentAnswerFinalTranscript += event.results[i][0].transcript.trim() + ". ";
            } else {
                interim += event.results[i][0].transcript;
            }
        }
        // You could display 'interim' for live feedback if desired
        (speechRecognitionRef.current as any).transcriptForCurrentTurn = currentAnswerFinalTranscript; // Store it on the ref
    };

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
        mediaRecorderRef.current.onstop = () => { // This onstop is primarily for final cleanup or unexpected stops
          if (isInterviewActiveRef.current) { // If interview ended unexpectedly
              console.warn("MediaRecorder stopped unexpectedly during active interview.");
              // Potentially handle this by trying to finalize with existing chunks
          }
          const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
          setRecordedVideoBlob(blob); // This is mostly for review, submission logic is in handleFinishInterview
          console.log("MediaRecorder stopped. Final blob size:", blob.size);
        };
        
        setStage("countdown");
        setCountdown(SESSION_COUNTDOWN_SECONDS);
        const countdownInterval = setInterval(() => {
          setCountdown(prev => {
            if (prev === null || prev <= 1) {
              clearInterval(countdownInterval);
              setStage("interviewing");
              if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "recording") {
                  mediaRecorderRef.current.start(); // Start video recording for the whole session
                  console.log("MediaRecorder started for the session.");
              }
              askNextQuestion(); // Mira asks the first question
              
              // Start session timer
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
  }, [stage, toast, askNextQuestion, handleFinishInterview, initializeSpeechRecognition]);

  useEffect(() => {
    if (currentTurn > 0 && currentTurn <= MAX_INTERVIEW_TURNS && stage === "interviewing") {
      askNextQuestion();
    } else if (currentTurn > MAX_INTERVIEW_TURNS && stage === "interviewing") {
      handleFinishInterview(); // All questions asked
    }
  }, [currentTurn, stage, askNextQuestion, handleFinishInterview]);

  const resetFullInterview = useCallback(() => {
    cleanupResources();
    setStage("consent");
    setConsentGiven(false);
    setCountdown(null);
    setCurrentAiMessage("Preparing for your interview...");
    setCurrentTurn(0);
    setSessionTranscript([]);
    setRecordedVideoBlob(null);
    setFeedbackResult(null);
    setMediaError(null);
    setSpeechApiError(null);
    setCameraPermission(null);
  }, [cleanupResources]);

  useEffect(() => {
    if (consentGiven && stage === "consent") {
      setStage("preparingStream");
    }
  }, [consentGiven, stage]);

  useEffect(() => {
    if (stage === "preparingStream" && consentGiven) {
      startInterviewProcess();
    }
  }, [stage, consentGiven, startInterviewProcess]);

  useEffect(() => {
    return () => { 
      cleanupResources();
    };
  }, [cleanupResources]);

  const renderConsentDialog = () => (
    <Dialog open={stage === "consent"} onOpenChange={(open) => !open && stage === "consent" && setStage("consent")}>
      <DialogContent className="sm:max-w-md shadow-xl">
        <DialogHeader>
          <DialogTitle>AI Interview Consent</DialogTitle>
          <DialogDescription>
            This AI Interview requires access to your camera and microphone to record your video and audio responses. 
            The recording will begin after a short countdown and will last for the duration of the interview (up to {MAX_SESSION_DURATION_MS / 1000 / 60} minutes). 
            Your entire session will be analyzed by AI to provide you with comprehensive feedback.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center space-x-2 py-4">
          <Checkbox id="consent-checkbox" checked={consentGiven} onCheckedChange={(checked) => setConsentGiven(Boolean(checked))} />
          <Label htmlFor="consent-checkbox">I consent to video and audio recording for this AI interview.</Label>
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
    return (
      <div className="grid md:grid-cols-2 gap-6 items-start">
        <Card className="shadow-lg md:sticky md:top-20">
          <CardHeader className="text-center">
            <div className="relative inline-block mx-auto">
                <BotMessageSquare className="h-16 w-16 text-primary mb-2" />
                {isMiraSpeaking && <Volume2 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-8 w-8 text-accent animate-pulse" />}
            </div>
            <CardTitle className="text-xl">Mira - Your AI Interviewer</CardTitle>
            <CardDescription>Job: {jobContext.jobTitle}</CardDescription>
          </CardHeader>
          <CardContent>
            <Alert variant="default" className="bg-primary/10 border-primary/20 min-h-[100px]">
                <Bot className="h-4 w-4 !text-primary"/>
                <AlertTitle className="text-primary">Mira Says:</AlertTitle>
                <AlertDescription className="text-sm">{currentAiMessage || "Waiting for the next question..."}</AlertDescription>
            </Alert>
             {speechApiError && (
              <Alert variant="destructive" className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>System Message</AlertTitle>
                <AlertDescription>{speechApiError}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Film className="text-primary"/> Your Video Response
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
              {isCandidateSpeaking && (
                 <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-blue-500 text-white p-1 px-2 rounded-full text-xs flex items-center animate-pulse">
                  <MicOff className="h-4 w-4 mr-1" /> Listening...
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
            {stage === "interviewing" && currentTurn < MAX_INTERVIEW_TURNS && !isMiraSpeaking && (
              <Button onClick={handleCandidateAnswer} className="w-full" size="lg" disabled={isMiraSpeaking}>
                I'm Done with My Answer
              </Button>
            )}
            {stage === "interviewing" && (
              <Button onClick={handleFinishInterview} className="w-full" size="lg" variant="outline" disabled={isMiraSpeaking}>
                Finish Interview & Get Feedback
              </Button>
            )}
            {((stage === "preparingStream" && mediaError) || cameraPermission === false) && (
               <Button onClick={startInterviewProcess} className="w-full" size="lg">
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
    </>
  );
}
