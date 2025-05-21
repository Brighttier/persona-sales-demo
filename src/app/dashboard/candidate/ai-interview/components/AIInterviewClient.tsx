
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Bot, Camera, CheckCircle, Loader2, Send, Video, Mic, Volume2, UserCircle, MessageSquare } from "lucide-react";
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
type ConversationSubStage = "miraSpeaking" | "readyToRecord" | "countdown" | "recording" | "reviewingAnswer" | "loadingNextQuestion" ;

// SpeechRecognition type fix for older/prefixed browsers
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition | undefined;
    webkitSpeechRecognition: typeof SpeechRecognition | undefined;
  }
}

const MAX_INTERVIEW_TURNS = 1; // Initial question + 1 follow-up

export function AIInterviewClient({ jobContext }: AIInterviewClientProps) {
  const { toast } = useToast();
  const [mainStage, setMainStage] = useState<InterviewMainStage>("consent");
  const [conversationSubStage, setConversationSubStage] = useState<ConversationSubStage>("miraSpeaking");
  
  const [consentGiven, setConsentGiven] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [videoBlobUrl, setVideoBlobUrl] = useState<string | null>(null);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [feedbackResult, setFeedbackResult] = useState<AiInterviewSimulationOutput | null>(null);
  
  const [aiGreeting, setAiGreeting] = useState<string | null>(null);
  const [currentAiQuestion, setCurrentAiQuestion] = useState<string | null>(null);
  
  const [isMiraSpeaking, setIsMiraSpeaking] = useState(false);
  const [userTranscript, setUserTranscript] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [speechApiError, setSpeechApiError] = useState<string | null>(null);

  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);

  const [currentInterviewTurn, setCurrentInterviewTurn] = useState(0); // 0 for initial, 1 for first follow-up
  const [accumulatedTranscript, setAccumulatedTranscript] = useState("");


  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const videoPreviewRef = useRef<HTMLVideoElement | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const speechRecognitionRef = useRef<SpeechRecognition | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);


  useEffect(() => {
    const loadVoices = () => {
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
      }
    };
    speechSynthesis.onvoiceschanged = loadVoices;
    loadVoices();
    return () => { speechSynthesis.onvoiceschanged = null; };
  }, []);


  useEffect(() => {
    if (consentGiven && mainStage === "consent") {
        setMainStage("loadingInitialMessage");
    }
  }, [consentGiven, mainStage]);

  const speak = useCallback((text: string, onEndCallback?: () => void) => {
    if (!('speechSynthesis' in window)) {
      setSpeechApiError("Your browser does not support Text-to-Speech.");
      toast({ variant: "destructive", title: "TTS Not Supported", description: "Mira cannot speak in this browser."});
      onEndCallback?.(); 
      return;
    }
    if (speechSynthesis.speaking) speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utteranceRef.current = utterance;
    if (selectedVoice) utterance.voice = selectedVoice;
    utterance.pitch = 1.0; utterance.rate = 0.95;

    utterance.onstart = () => setIsMiraSpeaking(true);
    utterance.onend = () => {
      setIsMiraSpeaking(false);
      utteranceRef.current = null;
      onEndCallback?.();
    };
    utterance.onerror = (event) => {
      console.error("SpeechSynthesis Error:", event);
      setSpeechApiError(`TTS Error: ${event.error}`);
      toast({ variant: "destructive", title: "TTS Error", description: "Could not play Mira's voice."});
      setIsMiraSpeaking(false);
      utteranceRef.current = null;
      onEndCallback?.(); 
    };
    speechSynthesis.speak(utterance);
  }, [toast, selectedVoice]);


  useEffect(() => {
    if (mainStage === "loadingInitialMessage" && !aiGreeting && !currentAiQuestion) {
      const fetchInitialMessage = async () => {
        setSpeechApiError(null);
        try {
          const input: InitialInterviewUtteranceInput = { jobTitle: jobContext.jobTitle };
          const result = await getInitialInterviewUtterance(input);
          setAiGreeting(result.aiGreeting);
          setCurrentAiQuestion(result.firstQuestion);
          setAccumulatedTranscript(prev => `${prev}Mira: ${result.aiGreeting} ${result.firstQuestion}\n\n`);
          setMainStage("conversation");
          setConversationSubStage("miraSpeaking");
          speak(`${result.aiGreeting} ${result.firstQuestion}`, () => setConversationSubStage("readyToRecord"));
          toast({ title: "Mira is ready!", description: "Your AI interviewer has joined." });
        } catch (error) {
          console.error("Error fetching initial AI message:", error);
          toast({ variant: "destructive", title: "AI Error", description: "Could not load AI. Please try refreshing." });
          const fallbackGreeting = "Hello! I'm Mira. Apologies for the hiccup.";
          const fallbackQuestion = "Let's start. Tell me about yourself.";
          setAiGreeting(fallbackGreeting); setCurrentAiQuestion(fallbackQuestion);
          setAccumulatedTranscript(prev => `${prev}Mira: ${fallbackGreeting} ${fallbackQuestion}\n\n`);
          setMainStage("conversation"); setConversationSubStage("miraSpeaking");
          speak(`${fallbackGreeting} ${fallbackQuestion}`, () => setConversationSubStage("readyToRecord"));
        }
      };
      fetchInitialMessage();
    }
  }, [mainStage, aiGreeting, currentAiQuestion, jobContext, toast, speak]);


  const cleanupStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoPreviewRef.current) videoPreviewRef.current.srcObject = null;
  }, []);
  
  const initializeSpeechRecognition = useCallback(() => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      setSpeechApiError("Your browser does not support Speech-to-Text.");
      toast({ variant: "destructive", title: "STT Not Supported" }); return null;
    }
    
    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = true; recognition.interimResults = true; recognition.lang = 'en-US';
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = (event) => {
      console.error('SpeechRecognition Error:', event.error);
      setSpeechApiError(`STT Error: ${event.error}`);
      if (event.error === 'no-speech') toast({ variant: "destructive", title: "No Speech Detected" });
      else if (event.error === 'audio-capture') toast({ variant: "destructive", title: "Microphone Error" });
      else if (event.error !== 'aborted') toast({ variant: "destructive", title: "Speech Recognition Error" });
      setIsListening(false);
    };
    recognition.onresult = (event) => {
      let finalTranscript = userTranscript; // Keep previous final parts for current turn
      let interimTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) finalTranscript += event.results[i][0].transcript + ' ';
        else interimTranscript += event.results[i][0].transcript;
      }
      setUserTranscript(finalTranscript.trim() + (interimTranscript ? ' ' + interimTranscript.trim() : '')); 
    };
    return recognition;
  }, [toast, userTranscript]);


  const startCountdownAndRecording = useCallback(async () => {
    if (isMiraSpeaking) {
        toast({title: "Please wait", description: "Mira is still speaking."}); return;
    }
    setUserTranscript(""); setSpeechApiError(null); setVideoBlob(null); setVideoBlobUrl(null);

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        streamRef.current = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (videoPreviewRef.current) videoPreviewRef.current.srcObject = streamRef.current;
        setConversationSubStage("countdown"); setCountdown(5);
        const countdownInterval = setInterval(() => {
          setCountdown(prev => {
            if (prev === null || prev <= 1) {
              clearInterval(countdownInterval);
              setConversationSubStage("recording"); setIsRecording(true);
              if (streamRef.current) {
                mediaRecorderRef.current = new MediaRecorder(streamRef.current);
                recordedChunksRef.current = [];
                mediaRecorderRef.current.ondataavailable = (e) => { if (e.data.size > 0) recordedChunksRef.current.push(e.data); };
                mediaRecorderRef.current.onstop = () => {
                  const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
                  const url = URL.createObjectURL(blob);
                  setVideoBlobUrl(url); setVideoBlob(blob);
                  setConversationSubStage("reviewingAnswer");
                  cleanupStream();
                  if (speechRecognitionRef.current && isListening) speechRecognitionRef.current.stop();
                };
                mediaRecorderRef.current.start();
                speechRecognitionRef.current = initializeSpeechRecognition();
                if (speechRecognitionRef.current) speechRecognitionRef.current.start();
                setTimeout(() => { 
                  if (mediaRecorderRef.current?.state === 'recording') {
                    mediaRecorderRef.current.stop(); 
                    toast({ title: "Recording Complete", description: "Maximum recording time reached." });
                  }
                }, 30000); 
              }
              return null;
            }
            return prev - 1;
          });
        }, 1000);
      } catch (err) {
        console.error("Error accessing media devices.", err);
        toast({ variant: "destructive", title: "Camera Error" });
        setConversationSubStage("readyToRecord");
      }
    } else {
      toast({ variant: "destructive", title: "Unsupported Browser" });
      setConversationSubStage("readyToRecord");
    }
  }, [toast, cleanupStream, initializeSpeechRecognition, isListening, isMiraSpeaking]);
  
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") mediaRecorderRef.current.stop(); 
    if (speechRecognitionRef.current && isListening) speechRecognitionRef.current.stop();
    setIsRecording(false); // This will be set false by onstop too
  }, [isListening]);

  const handleSendAnswer = async () => {
    if (!userTranscript.trim()) {
        toast({variant: "destructive", title: "Empty Answer", description: "Please provide an answer."});
        return;
    }
    setAccumulatedTranscript(prev => `${prev}Candidate: ${userTranscript}\n\n`);

    if (currentInterviewTurn < MAX_INTERVIEW_TURNS) {
      // Get follow-up question
      setConversationSubStage("loadingNextQuestion");
      try {
        const input: FollowUpQuestionInput = {
          jobDescription: jobContext.jobDescription,
          candidateResume: jobContext.candidateResume,
          previousQuestion: currentAiQuestion || "",
          candidateAnswer: userTranscript,
        };
        const result = await getFollowUpQuestion(input);
        setCurrentAiQuestion(result.nextQuestion);
        setAccumulatedTranscript(prev => `${prev}Mira: ${result.nextQuestion}\n\n`);
        setCurrentInterviewTurn(prev => prev + 1);
        setUserTranscript(""); setVideoBlob(null); setVideoBlobUrl(null); // Reset for next turn
        setConversationSubStage("miraSpeaking");
        speak(result.nextQuestion, () => setConversationSubStage("readyToRecord"));
      } catch (error) {
        console.error("Error fetching follow-up question:", error);
        toast({ variant: "destructive", title: "AI Error", description: "Could not get next question." });
        // Offer to proceed to feedback or retry? For now, proceed to feedback.
        setMainStage("loadingFeedback"); // Transition to feedback submission
        await submitForFinalFeedback();
      }
    } else {
      // Max turns reached, submit for final feedback
      setMainStage("loadingFeedback");
      await submitForFinalFeedback();
    }
  };
  
  const submitForFinalFeedback = async () => {
    if (!videoBlob) { // Ensure last video is available
      toast({ variant: "destructive", title: "No Video", description: "Please record a video for the last question." });
      setMainStage("conversation"); 
      setConversationSubStage("reviewingAnswer"); // Go back to review to allow recording
      return;
    }
    setMainStage("loadingFeedback");
    try {
      const reader = new FileReader();
      reader.readAsDataURL(videoBlob); // Using the last recorded video blob
      reader.onloadend = async () => {
        const videoDataUri = reader.result as string;
        const input: AiInterviewSimulationInput = {
          jobDescription: jobContext.jobDescription,
          candidateResume: jobContext.candidateResume,
          videoDataUri,
          interviewTranscript: accumulatedTranscript, // Send full transcript
        };
        const result = await aiInterviewSimulation(input);
        setFeedbackResult(result);
        setMainStage("feedback");
        toast({ title: "Feedback Received!", description: "Mira has analyzed your responses." });
      };
    } catch (error) {
      console.error("Error getting feedback:", error);
      toast({ variant: "destructive", title: "Feedback Error", description: "Could not get AI feedback." });
      setMainStage("conversation"); // Revert to allow retry or reset
      setConversationSubStage("readyToRecord"); 
    }
  };


  const resetTurn = () => { // For re-recording the current question's answer
    cleanupStream();
    if (speechSynthesis.speaking) speechSynthesis.cancel();
    if (speechRecognitionRef.current && isListening) speechRecognitionRef.current.abort();
    setVideoBlobUrl(null); setVideoBlob(null); setUserTranscript("");
    setIsRecording(false); setCountdown(null); setIsMiraSpeaking(false);
    setConversationSubStage("readyToRecord");
  };

  const resetFullInterview = () => {
    resetTurn(); // Resets current turn things
    setAccumulatedTranscript(""); setCurrentInterviewTurn(0);
    setAiGreeting(null); setCurrentAiQuestion(null); setFeedbackResult(null);
    setMainStage("loadingInitialMessage"); // Restart from fetching initial greeting
  };
  
  useEffect(() => {
    return () => { // Cleanup on unmount
      cleanupStream();
      if (speechSynthesis.speaking) speechSynthesis.cancel();
      if (speechRecognitionRef.current && isListening) speechRecognitionRef.current.abort();
    };
  }, [cleanupStream, isListening]);


  const renderConsentDialog = () => (
    <Dialog open={mainStage === "consent"} onOpenChange={(open) => !open && mainStage === "consent" && setMainStage("consent")}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader><DialogTitle>Consent for Recording & Speech</DialogTitle>
          <DialogDescription>
            We need your consent for camera/microphone access for recording, and speech technologies (Text-to-Speech for Mira, Speech-to-Text for your responses). Your data is used solely for AI-generated feedback.
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
          }}>Continue</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  const renderInterviewContent = () => {
    const isLoading = mainStage === "loadingInitialMessage" || conversationSubStage === "loadingNextQuestion" || mainStage === "loadingFeedback";
    const showVideoPreview = conversationSubStage !== "reviewingAnswer" && mainStage !== "feedback";
    const showRecordedVideo = (conversationSubStage === "reviewingAnswer" || mainStage === "feedback") && videoBlobUrl;

    return (
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Bot /> Mira - AI Interviewer 
            {(isMiraSpeaking || conversationSubStage === "miraSpeaking") && <Volume2 className="h-5 w-5 text-primary animate-pulse" />}
          </CardTitle>
          {mainStage === "loadingInitialMessage" ? (
            <div className="pt-2 space-y-1"><div className="h-4 bg-muted rounded w-3/4 animate-pulse"></div><div className="h-4 bg-muted rounded w-1/2 animate-pulse"></div></div>
          ) : (
            <>
              {aiGreeting && currentInterviewTurn === 0 && <CardDescription className="pt-2 text-lg">{aiGreeting}</CardDescription>}
              {currentAiQuestion && <CardDescription className={cn("pt-1 text-lg font-semibold", aiGreeting && currentInterviewTurn === 0 && "mt-1")}>{currentAiQuestion}</CardDescription>}
            </>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="aspect-video w-full bg-muted rounded-md flex items-center justify-center overflow-hidden relative">
            {showVideoPreview && <video ref={videoPreviewRef} playsInline autoPlay muted className={cn("w-full h-full object-cover", isRecording && "transform scale-x-[-1]")} />}
            {showRecordedVideo && <video src={videoBlobUrl} controls className="w-full h-full object-cover" />}
            {!isLoading && !showVideoPreview && !showRecordedVideo && conversationSubStage !== "countdown" && <Camera className="h-24 w-24 text-muted-foreground" />}
            {conversationSubStage === "countdown" && countdown !== null && (
              <div className="absolute text-6xl font-bold text-white bg-black/50 p-4 rounded-lg">{countdown}</div>
            )}
            {isListening && conversationSubStage === "recording" && (
              <div className="absolute bottom-2 left-2 bg-black/50 text-white p-2 rounded flex items-center text-xs">
                <Mic className="h-4 w-4 mr-1 animate-pulse text-red-400" /> Listening...
              </div>
            )}
          </div>
          
          {conversationSubStage === "readyToRecord" && !isLoading && (
            <Button onClick={startCountdownAndRecording} className="w-full" size="lg" disabled={isMiraSpeaking}>
              <Video className="mr-2 h-5 w-5" /> Start Recording Answer
            </Button>
          )}
          {conversationSubStage === "recording" && (
            <Button onClick={stopRecording} variant="destructive" className="w-full" size="lg">Stop Recording</Button>
          )}
           {(userTranscript && (conversationSubStage === "recording" || conversationSubStage === "reviewingAnswer")) && (
            <Card className="bg-secondary/50 p-3">
              <CardHeader className="p-1 pb-2"><CardTitle className="text-sm flex items-center"><UserCircle className="mr-2 h-4 w-4 text-muted-foreground"/>Your Response (Live Transcript):</CardTitle></CardHeader>
              <CardContent className="p-1"><Textarea value={userTranscript} readOnly rows={3} className="text-sm bg-background" placeholder="Your transcribed speech will appear here..."/></CardContent>
            </Card>
          )}
          {conversationSubStage === "reviewingAnswer" && videoBlobUrl && (
            <div className="grid grid-cols-2 gap-4">
              <Button onClick={resetTurn} variant="outline" size="lg">Record Again</Button>
              <Button onClick={handleSendAnswer} disabled={isLoading} size="lg">
                {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Send className="mr-2 h-5 w-5" />}
                {currentInterviewTurn < MAX_INTERVIEW_TURNS ? "Send & Next Question" : "Send & Get Feedback"}
              </Button>
            </div>
          )}
           {conversationSubStage === "loadingNextQuestion" && (
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
        {accumulatedTranscript && (
             <Card className="bg-secondary/50 p-3 mt-4">
                <CardHeader className="p-1 pb-2"><CardTitle className="text-sm flex items-center"><UserCircle className="mr-2 h-4 w-4 text-muted-foreground"/>Full Interview Transcript:</CardTitle></CardHeader>
                <CardContent className="p-1"><Textarea value={accumulatedTranscript} readOnly rows={8} className="text-sm bg-background whitespace-pre-line"/></CardContent>
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
