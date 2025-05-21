
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Bot, Camera, CheckCircle, Loader2, Send, Video, Mic, Volume2, UserCircle, MessageSquare, Timer } from "lucide-react";
import { useEffect, useRef, useState, useCallback } from "react";
import type { AiInterviewSimulationInput, AiInterviewSimulationOutput } from "@/ai/flows/ai-interview-simulation";
import { aiInterviewSimulation } from "@/ai/flows/ai-interview-simulation";
import { getInitialInterviewUtterance, type InitialInterviewUtteranceInput } from "@/ai/flows/initial-interview-message";
import { getFollowUpQuestion, type FollowUpQuestionInput } from "@/ai/flows/follow-up-question";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";


interface AIInterviewClientProps {
  jobContext: {
    jobTitle: string;
    jobDescription: string;
    candidateResume: string;
  };
}

type InterviewMainStage = "consent" | "loadingInitialMessage" | "conversation" | "loadingFeedback" | "feedback";
type ConversationSubStage = "preparingStream" | "countdown" | "miraSpeaking" | "sessionRecording" | "loadingNextQuestion";

declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition | undefined;
    webkitSpeechRecognition: typeof SpeechRecognition | undefined;
  }
}

const MAX_INTERVIEW_TURNS = 1; 
const MAX_SESSION_DURATION_MS = 3 * 60 * 1000; 

export function AIInterviewClient({ jobContext }: AIInterviewClientProps) {
  const { toast } = useToast();
  const [mainStage, setMainStage] = useState<InterviewMainStage>("consent");
  const [conversationSubStage, setConversationSubStage] = useState<ConversationSubStage>("preparingStream");
  
  const [consentGiven, setConsentGiven] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isSessionRecordingActive, setIsSessionRecordingActive] = useState(false); 
  const [sessionVideoBlob, setSessionVideoBlob] = useState<Blob | null>(null);
  const [feedbackResult, setFeedbackResult] = useState<AiInterviewSimulationOutput | null>(null);
  
  const [aiGreeting, setAiGreeting] = useState<string | null>(null);
  const [currentAiQuestion, setCurrentAiQuestion] = useState<string | null>(null);
  
  const [isMiraCurrentlySpeaking, setIsMiraCurrentlySpeaking] = useState(false);
  const [currentAnswerTranscript, setCurrentAnswerTranscript] = useState("");
  const [accumulatedInterviewTranscript, setAccumulatedInterviewTranscript] = useState("");
  const [isCandidateListeningActive, setIsCandidateListeningActive] = useState(false); 
  const [speechApiError, setSpeechApiError] = useState<string | null>(null);

  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);

  const [currentInterviewTurn, setCurrentInterviewTurn] = useState(0);
  const overallSessionTimerIdRef = useRef<NodeJS.Timeout | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const videoPreviewRef = useRef<HTMLVideoElement | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const speechRecognitionRef = useRef<SpeechRecognition | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    const loadVoices = () => {
      if (!('speechSynthesis' in window)) return;
      const voices = speechSynthesis.getVoices();
      if (voices.length > 0) {
        setAvailableVoices(voices);
        let preferredVoice = voices.find(v => v.lang === 'en-US' && (v.name.includes('Female') || v.name.includes('Zira') || v.name.includes('Susan')));
        if (!preferredVoice) preferredVoice = voices.find(v => v.lang === 'en-GB' && v.name.includes('Female'));
        if (!preferredVoice) preferredVoice = voices.find(v => v.lang === 'en-US' && v.name.toLowerCase().includes('female'));
        if (!preferredVoice) preferredVoice = voices.find(v => v.lang.startsWith('en-') && v.name.toLowerCase().includes('female'));
        if (!preferredVoice) preferredVoice = voices.find(v => v.lang === 'en-US');
        if (!preferredVoice) preferredVoice = voices.find(v => v.lang.startsWith('en-'));
        setSelectedVoice(preferredVoice || voices[0] || null);
      } else {
        setSelectedVoice(null); 
      }
    };
    
    if ('speechSynthesis' in window) {
        speechSynthesis.onvoiceschanged = loadVoices;
        loadVoices(); 
    } else {
        setSpeechApiError("Your browser does not support Text-to-Speech. Mira will not be able to speak.");
    }

    return () => { 
        if ('speechSynthesis' in window) {
            speechSynthesis.onvoiceschanged = null; 
        }
    };
  }, []);

  const speak = useCallback((text: string, onEndCallback?: () => void) => {
    if (!text || text.trim() === "") {
        console.warn("Speak function called with empty or whitespace-only text. Aborting speech.");
        onEndCallback?.();
        return;
    }

    if (!('speechSynthesis' in window)) {
      setSpeechApiError("Your browser does not support Text-to-Speech.");
      toast({ variant: "destructive", title: "TTS Not Supported", description: "Mira cannot speak in this browser."});
      onEndCallback?.(); 
      return;
    }

    if (availableVoices.length === 0 && !selectedVoice) {
      const noVoiceMessage = "No TTS voices available in your browser. Mira cannot speak.";
      setSpeechApiError(noVoiceMessage);
      toast({ variant: "destructive", title: "TTS Voices Unavailable", description: noVoiceMessage });
      onEndCallback?.(); 
      return;
    }

    if (speechSynthesis.speaking) speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utteranceRef.current = utterance;
    if (selectedVoice) utterance.voice = selectedVoice;
    utterance.pitch = 1.0; utterance.rate = 0.95;

    utterance.onstart = () => setIsMiraCurrentlySpeaking(true);
    utterance.onend = () => {
      setIsMiraCurrentlySpeaking(false);
      utteranceRef.current = null;
      onEndCallback?.();
    };
    utterance.onerror = (event: SpeechSynthesisErrorEvent) => {
      console.error("SpeechSynthesis Error Event (see details in browser console):", event);
      const errorCode = event.error; 
      let detailedMessage = "Mira could not speak. Please check your browser console for 'SpeechSynthesis Error Event' details.";
      if (errorCode) {
        detailedMessage = `Mira could not speak (Error code: ${errorCode}). Check console for details.`;
      }
      
      setSpeechApiError(detailedMessage);
      toast({ variant: "destructive", title: "Text-to-Speech Error", description: detailedMessage});
      
      setIsMiraCurrentlySpeaking(false);
      utteranceRef.current = null;
      onEndCallback?.();
    };
    speechSynthesis.speak(utterance);
  }, [toast, selectedVoice, availableVoices]);

  const cleanupStreamAndRecorders = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoPreviewRef.current) videoPreviewRef.current.srcObject = null;
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop(); 
    }
    mediaRecorderRef.current = null;
    setIsSessionRecordingActive(false);

    if (speechRecognitionRef.current && isCandidateListeningActive) {
      speechRecognitionRef.current.abort(); // Use abort for immediate stop
    }
    speechRecognitionRef.current = null;
    setIsCandidateListeningActive(false);

    if (overallSessionTimerIdRef.current) {
      clearTimeout(overallSessionTimerIdRef.current);
      overallSessionTimerIdRef.current = null;
    }
  }, [isCandidateListeningActive]);
  
  const initializeSpeechRecognition = useCallback(() => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      setSpeechApiError("Your browser does not support Speech-to-Text.");
      toast({ variant: "destructive", title: "STT Not Supported", description: "Speech-to-Text is not available in this browser." }); return null;
    }
    
    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = true; recognition.interimResults = true; recognition.lang = 'en-US';
    
    recognition.onstart = () => setIsCandidateListeningActive(true);
    recognition.onend = () => setIsCandidateListeningActive(false); 
    
    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('SpeechRecognition Error Full Event:', event);
      const errorCode = event.error;
      let toastMessage: { title: string; description: string; variant: "destructive" } | null = null;
      let persistentErrorMsg: string | null = null;

      if (errorCode === 'no-speech') {
        toastMessage = { variant: "destructive", title: "No Speech Detected", description: "Please ensure your microphone is working and you are speaking clearly." };
        persistentErrorMsg = "No speech was detected. Please check your microphone, ensure it has permission, and speak clearly.";
      } else if (errorCode === 'audio-capture') {
        toastMessage = { variant: "destructive", title: "Microphone Error", description: "Could not capture audio. Check microphone permissions and ensure it's not in use by another app." };
        persistentErrorMsg = "Could not capture audio. Please check microphone permissions and ensure it's not used by another application.";
      } else if (errorCode === 'not-allowed') {
        toastMessage = { variant: "destructive", title: "Permission Denied", description: "Microphone access was denied. Please enable it in your browser settings." };
        persistentErrorMsg = "Microphone access was denied. Please enable it in your browser settings to use speech-to-text.";
      } else if (errorCode !== 'aborted') { 
        toastMessage = { variant: "destructive", title: "Speech Recognition Error", description: `An unexpected error occurred: ${errorCode}.` };
        persistentErrorMsg = `An unexpected speech recognition error occurred: ${errorCode}. You might need to check browser permissions or try again.`;
      }

      if (toastMessage) {
        toast(toastMessage);
      }
      if (persistentErrorMsg) {
        setSpeechApiError(persistentErrorMsg);
      }
      setIsCandidateListeningActive(false); 
    };
    recognition.onresult = (event) => {
      let finalTranscriptForCurrentAnswer = "";
      let interimTranscriptForCurrentAnswer = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) finalTranscriptForCurrentAnswer += event.results[i][0].transcript + ' ';
        else interimTranscriptForCurrentAnswer += event.results[i][0].transcript;
      }
      setCurrentAnswerTranscript(prev => (prev + finalTranscriptForCurrentAnswer).trim() + (interimTranscriptForCurrentAnswer ? ' ' + interimTranscriptForCurrentAnswer.trim() : ''));
    };
    return recognition;
  }, [toast]);

  const submitForFinalFeedback = useCallback(async (videoForSubmission: Blob, finalTranscript: string) => {
    if (!videoForSubmission) {
      toast({ variant: "destructive", title: "No Video Recorded", description: "Cannot submit feedback without a video." });
      setMainStage("conversation"); 
      setConversationSubStage("preparingStream"); 
      setSpeechApiError("Submission failed: No video was recorded.");
      return;
    }
    
    try {
      const reader = new FileReader();
      reader.readAsDataURL(videoForSubmission);
      reader.onloadend = async () => {
        const videoDataUri = reader.result as string;
        const input: AiInterviewSimulationInput = {
          jobDescription: jobContext.jobDescription,
          candidateResume: jobContext.candidateResume,
          videoDataUri,
          interviewTranscript: finalTranscript,
        };
        const result = await aiInterviewSimulation(input);
        setFeedbackResult(result);
        setMainStage("feedback");
        toast({ title: "Feedback Received!", description: "Mira has analyzed your responses." });
        cleanupStreamAndRecorders(); 
      };
      reader.onerror = () => {
        toast({ variant: "destructive", title: "File Read Error", description: "Could not process video for submission." });
        setMainStage("conversation"); setConversationSubStage("preparingStream");
        setSpeechApiError("Failed to read video data for submission.");
      }
    } catch (error) {
      console.error("Error getting feedback:", error);
      toast({ variant: "destructive", title: "Feedback Error", description: "Could not get AI feedback." });
      setMainStage("conversation"); 
      setConversationSubStage("preparingStream"); 
      setSpeechApiError("Failed to get feedback from AI.");
    }
  }, [jobContext, toast, cleanupStreamAndRecorders]);
  
  const resetFullInterview = useCallback(() => {
    cleanupStreamAndRecorders();
    if ('speechSynthesis' in window && speechSynthesis.speaking) speechSynthesis.cancel();
    
    setAiGreeting(null); setCurrentAiQuestion(null);
    setCurrentAnswerTranscript(""); setAccumulatedInterviewTranscript("");
    setFeedbackResult(null);
    setSessionVideoBlob(null);
    setCurrentInterviewTurn(0);
    setCountdown(null);
    setSpeechApiError(null);
    setConsentGiven(false); 
    setMainStage("consent"); 
    setConversationSubStage("preparingStream");
  }, [cleanupStreamAndRecorders]);

  const handleFinishInterview = useCallback(async () => {
    if (overallSessionTimerIdRef.current) {
        clearTimeout(overallSessionTimerIdRef.current);
        overallSessionTimerIdRef.current = null;
    }

    if (speechRecognitionRef.current && isCandidateListeningActive) {
        speechRecognitionRef.current.stop();
    }
        
    setMainStage("loadingFeedback"); 

    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.onstop = async () => { 
            const finalBlob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
            setSessionVideoBlob(finalBlob); 
            let finalTranscript = accumulatedInterviewTranscript;
            if (currentAnswerTranscript.trim() && !finalTranscript.endsWith(`${currentAnswerTranscript.trim()}\n\n`)) {
                 finalTranscript += `Candidate: ${currentAnswerTranscript.trim() || "(No audible answer provided for last question)"}\n\n`;
                 setAccumulatedInterviewTranscript(finalTranscript); 
            }
            await submitForFinalFeedback(finalBlob, finalTranscript);
        };
        mediaRecorderRef.current.stop();
    } else if (sessionVideoBlob) { 
        await submitForFinalFeedback(sessionVideoBlob, accumulatedInterviewTranscript);
    } else {
        toast({variant: "destructive", title: "Recording Error", description: "No video to submit. Please try again."});
        setSpeechApiError("No video recording was available to submit for feedback.");
        resetFullInterview(); 
        return;
    }
    setIsSessionRecordingActive(false);

  }, [isCandidateListeningActive, sessionVideoBlob, accumulatedInterviewTranscript, currentAnswerTranscript, toast, jobContext, submitForFinalFeedback, resetFullInterview]);

  const startMediaAndCountdown = useCallback(async () => {
    if (mainStage !== "conversation" || conversationSubStage !== "preparingStream") return;
    setSpeechApiError(null); setSessionVideoBlob(null);

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        streamRef.current = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (videoPreviewRef.current) {
            videoPreviewRef.current.srcObject = streamRef.current;
            videoPreviewRef.current.muted = true; 
            videoPreviewRef.current.play().catch(e => console.error("Preview play error", e));
        }
        
        mediaRecorderRef.current = new MediaRecorder(streamRef.current);
        recordedChunksRef.current = [];
        mediaRecorderRef.current.ondataavailable = (e) => { if (e.data.size > 0) recordedChunksRef.current.push(e.data); };
        mediaRecorderRef.current.onstop = () => { 
          const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
          setSessionVideoBlob(blob);
        };
        
        speechRecognitionRef.current = initializeSpeechRecognition();

        setConversationSubStage("countdown"); setCountdown(5);
        const countdownInterval = setInterval(() => {
          setCountdown(prev => {
            if (prev === null || prev <= 1) {
              clearInterval(countdownInterval);
              setConversationSubStage("miraSpeaking");
              const textToSpeak = currentInterviewTurn === 0 ? `${aiGreeting} ${currentAiQuestion}` : currentAiQuestion;
              
              if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "recording") {
                 mediaRecorderRef.current.start(1000); 
                 setIsSessionRecordingActive(true);
              }
              
              speak(textToSpeak || "Error: No question to speak.", () => { 
                if (speechRecognitionRef.current && !isCandidateListeningActive) {
                   speechRecognitionRef.current.start(); 
                }
                setConversationSubStage("sessionRecording");
                if (currentInterviewTurn === 0) { 
                    overallSessionTimerIdRef.current = setTimeout(() => { 
                        toast({ title: "Session Time Limit Reached", description: "Interview session ended automatically." });
                        handleFinishInterview(); 
                    }, MAX_SESSION_DURATION_MS);
                }
              });
              return null;
            }
            return prev - 1;
          });
        }, 1000);
      } catch (err) {
        console.error("Error accessing media devices.", err);
        toast({ variant: "destructive", title: "Camera/Mic Error", description: "Please check permissions and ensure no other app is using them." });
        setConversationSubStage("preparingStream"); 
        setSpeechApiError("Failed to access camera/microphone. Please check permissions.");
      }
    } else {
      toast({ variant: "destructive", title: "Unsupported Browser", description: "Media recording not supported." });
      setConversationSubStage("preparingStream");
      setSpeechApiError("Media recording (camera/microphone) is not supported in this browser.");
    }
  }, [toast, initializeSpeechRecognition, mainStage, conversationSubStage, currentInterviewTurn, aiGreeting, currentAiQuestion, speak, isCandidateListeningActive, handleFinishInterview]);

  useEffect(() => {
    if (consentGiven && mainStage === "consent") {
        setMainStage("loadingInitialMessage");
    }
  }, [consentGiven, mainStage]);

  useEffect(() => {
    if (mainStage === "loadingInitialMessage" && !aiGreeting && !currentAiQuestion) {
      const fetchInitialMessage = async () => {
        setSpeechApiError(null);
        try {
          const input: InitialInterviewUtteranceInput = { jobTitle: jobContext.jobTitle };
          const result = await getInitialInterviewUtterance(input);
          setAiGreeting(result.aiGreeting);
          setCurrentAiQuestion(result.firstQuestion);
          setAccumulatedInterviewTranscript(prev => `${prev}Mira: ${result.aiGreeting} ${result.firstQuestion}\n\n`);
          setMainStage("conversation");
          setConversationSubStage("preparingStream"); 
          toast({ title: "Mira is ready!", description: "Your AI interviewer has joined." });
        } catch (error) {
          console.error("Error fetching initial AI message:", error);
          toast({ variant: "destructive", title: "AI Error", description: "Could not load AI. Please try refreshing." });
          const fallbackGreeting = "Hello! I'm Mira. Apologies for the hiccup.";
          const fallbackQuestion = "Let's start. Tell me about yourself.";
          setAiGreeting(fallbackGreeting); setCurrentAiQuestion(fallbackQuestion);
          setAccumulatedInterviewTranscript(prev => `${prev}Mira: ${fallbackGreeting} ${fallbackQuestion}\n\n`);
          setMainStage("conversation"); setConversationSubStage("preparingStream");
          setSpeechApiError("Failed to load initial AI message.");
        }
      };
      fetchInitialMessage();
    }
  }, [mainStage, aiGreeting, currentAiQuestion, jobContext, toast]);

  useEffect(() => {
    if (mainStage === "conversation" && conversationSubStage === "preparingStream" && aiGreeting && currentAiQuestion) {
        startMediaAndCountdown();
    }
  }, [mainStage, conversationSubStage, aiGreeting, currentAiQuestion, startMediaAndCountdown]);


  const handleProceedToNextStep = async () => {
    if (!currentAnswerTranscript.trim() && currentInterviewTurn < MAX_INTERVIEW_TURNS +1 && conversationSubStage === "sessionRecording") {
        toast({variant: "destructive", title: "Empty Answer", description: "Please provide an answer before proceeding."});
        if (!speechApiError?.includes("No speech was detected")) { 
          return;
        }
    }
    
    if (speechRecognitionRef.current && isCandidateListeningActive) {
      speechRecognitionRef.current.stop(); 
    }
    setAccumulatedInterviewTranscript(prev => `${prev}Candidate: ${currentAnswerTranscript || "(No audible answer provided)"}\n\n`);
    setCurrentAnswerTranscript(""); 
    setSpeechApiError(null); 


    if (currentInterviewTurn < MAX_INTERVIEW_TURNS) {
      setConversationSubStage("loadingNextQuestion");
      try {
        const input: FollowUpQuestionInput = {
          jobDescription: jobContext.jobDescription,
          candidateResume: jobContext.candidateResume,
          previousQuestion: currentAiQuestion || "",
          candidateAnswer: accumulatedInterviewTranscript.split("Candidate:").pop()?.trim() || "", 
        };
        const result = await getFollowUpQuestion(input);
        setCurrentAiQuestion(result.nextQuestion);
        setAccumulatedInterviewTranscript(prev => `${prev}Mira: ${result.nextQuestion}\n\n`);
        setCurrentInterviewTurn(prev => prev + 1);
        
        setConversationSubStage("miraSpeaking");
        speak(result.nextQuestion, () => { 
            if (speechRecognitionRef.current && !isCandidateListeningActive) {
                speechRecognitionRef.current.start(); 
            }
            setConversationSubStage("sessionRecording");
        });
      } catch (error) {
        console.error("Error fetching follow-up question:", error);
        toast({ variant: "destructive", title: "AI Error", description: "Could not get next question. Finishing interview." });
        setSpeechApiError("Failed to get the next question from AI.");
        handleFinishInterview();
      }
    } else {
      handleFinishInterview();
    }
  };
  
  useEffect(() => {
    return () => { 
      cleanupStreamAndRecorders();
      if ('speechSynthesis' in window && speechSynthesis.speaking) speechSynthesis.cancel();
    };
  }, [cleanupStreamAndRecorders]);


  const renderConsentDialog = () => (
    <Dialog open={mainStage === "consent"} onOpenChange={(open) => !open && mainStage === "consent" && setMainStage("consent")}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader><DialogTitle>Consent for Recording & Speech</DialogTitle>
          <DialogDescription>
            We need your consent for camera/microphone access for recording your interview session, and speech technologies (Text-to-Speech for Mira, Speech-to-Text for your responses). Your data is used solely for AI-generated feedback. The recording will start after a brief countdown and last for the duration of the interview (max {MAX_SESSION_DURATION_MS / 60000} minutes).
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center space-x-2 py-4">
          <Checkbox id="consent-checkbox" checked={consentGiven} onCheckedChange={(checked) => setConsentGiven(Boolean(checked))} />
          <Label htmlFor="consent-checkbox">I consent to video/audio recording and speech functionalities.</Label>
        </div>
        <DialogFooter>
          <Button type="button" onClick={() => { 
              if(consentGiven) setMainStage("loadingInitialMessage");
              else toast({variant: "destructive", title: "Consent Required"})
          }} disabled={!consentGiven}>Continue</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  const renderInterviewContent = () => {
    const isLoadingInitial = mainStage === "loadingInitialMessage";
    const isLoadingNextQuestion = conversationSubStage === "loadingNextQuestion";

    return (
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Bot /> Mira - AI Interviewer 
            {(isMiraCurrentlySpeaking || conversationSubStage === "miraSpeaking") && <Volume2 className="h-5 w-5 text-primary animate-pulse" />}
          </CardTitle>
          {isLoadingInitial || (conversationSubStage === "preparingStream" && mainStage === "conversation") ? (
            <div className="pt-2 space-y-1"><div className="h-4 bg-muted rounded w-3/4 animate-pulse"></div><div className="h-4 bg-muted rounded w-1/2 animate-pulse"></div></div>
          ) : (
            <>
              {aiGreeting && currentInterviewTurn === 0 && <CardDescription className="pt-2 text-lg">{aiGreeting}</CardDescription>}
              {currentAiQuestion && <CardDescription className={cn("pt-1 text-lg font-semibold", aiGreeting && currentInterviewTurn === 0 && "mt-1")}>{currentAiQuestion}</CardDescription>}
            </>
          )}
           {isSessionRecordingActive && <p className="text-sm text-primary pt-1">Question {currentInterviewTurn + 1} of {MAX_INTERVIEW_TURNS + 1}</p>}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="aspect-video w-full bg-muted rounded-md flex items-center justify-center overflow-hidden relative">
            <video ref={videoPreviewRef} className="w-full h-full object-cover transform scale-x-[-1]" playsInline autoPlay muted />
            {!isSessionRecordingActive && conversationSubStage !== "countdown" && !isLoadingInitial && conversationSubStage !== "preparingStream" && videoPreviewRef.current?.srcObject === null && <Camera className="absolute h-24 w-24 text-muted-foreground" />}
            {conversationSubStage === "countdown" && countdown !== null && (
              <div className="absolute text-6xl font-bold text-white bg-black/50 p-4 rounded-lg">{countdown}</div>
            )}
            {isSessionRecordingActive && (
              <div className="absolute top-2 left-2 bg-red-500 text-white p-1 px-2 rounded text-xs flex items-center animate-pulse">
                <Timer className="h-4 w-4 mr-1" /> REC
              </div>
            )}
            {isCandidateListeningActive && isSessionRecordingActive && (
              <div className="absolute bottom-2 left-2 bg-black/50 text-white p-2 rounded flex items-center text-xs">
                <Mic className="h-4 w-4 mr-1 animate-pulse text-red-400" /> Listening...
              </div>
            )}
          </div>
          
          {currentAnswerTranscript && (conversationSubStage === "sessionRecording" || isLoadingNextQuestion || conversationSubStage === "miraSpeaking") && (
            <Card className="bg-secondary/50 p-3">
              <CardHeader className="p-1 pb-2"><CardTitle className="text-sm flex items-center"><UserCircle className="mr-2 h-4 w-4 text-muted-foreground"/>Your Current Response (Live Transcript):</CardTitle></CardHeader>
              <CardContent className="p-1"><Textarea value={currentAnswerTranscript} readOnly rows={3} className="text-sm bg-background" placeholder="Your transcribed speech will appear here..."/></CardContent>
            </Card>
          )}

          {conversationSubStage === "sessionRecording" && isSessionRecordingActive && (
             <Button onClick={handleProceedToNextStep} className="w-full" size="lg" disabled={isMiraCurrentlySpeaking || isLoadingNextQuestion}>
              {isLoadingNextQuestion ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Send className="mr-2 h-5 w-5" />}
              {currentInterviewTurn < MAX_INTERVIEW_TURNS ? "Submit Answer & Next Question" : "Finish Interview & Get Feedback"}
            </Button>
          )}
           {isLoadingNextQuestion && (
            <div className="flex items-center justify-center p-4"><Loader2 className="mr-2 h-6 w-6 animate-spin"/> Mira is thinking of the next question...</div>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderFeedbackContent = () => (
    <Card className="shadow-md mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><CheckCircle className="text-green-500" /> Mira's Feedback</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
            <MessageSquare className="h-4 w-4" />
            <AlertTitle>Feedback on your responses:</AlertTitle>
            <AlertDescription className="whitespace-pre-line">
                {feedbackResult?.feedback || "No feedback content."}
            </AlertDescription>
        </Alert>
        {accumulatedInterviewTranscript && (
             <Card className="bg-secondary/50 p-3 mt-4">
                <CardHeader className="p-1 pb-2"><CardTitle className="text-sm flex items-center"><UserCircle className="mr-2 h-4 w-4 text-muted-foreground"/>Full Interview Transcript:</CardTitle></CardHeader>
                <CardContent className="p-1"><Textarea value={accumulatedInterviewTranscript} readOnly rows={8} className="text-sm bg-background whitespace-pre-line"/></CardContent>
            </Card>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={resetFullInterview} className="w-full">Start New Simulation</Button>
      </CardFooter>
    </Card>
  );

  return (
    <>
      {renderConsentDialog()}
      {speechApiError && <Alert variant="destructive" className="mb-4"><AlertDescription>{speechApiError}</AlertDescription></Alert>}
      
      {(mainStage === "loadingInitialMessage" || mainStage === "conversation" || mainStage === "loadingFeedback") && renderInterviewContent()}
      {mainStage === "loadingFeedback" && !feedbackResult && (
          <div className="text-center p-8 space-y-2">
              <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
              <p className="text-muted-foreground">Mira is preparing your feedback...</p>
          </div>
      )}
      {mainStage === "feedback" && feedbackResult && renderFeedbackContent()}
    </>
  );
}
