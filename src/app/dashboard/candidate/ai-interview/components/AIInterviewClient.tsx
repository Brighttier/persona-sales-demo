
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Bot, Camera, CheckCircle, Loader2, Send, Video, Mic, Volume2, UserCircle } from "lucide-react";
import { useEffect, useRef, useState, useCallback } from "react";
import type { AiInterviewSimulationInput, AiInterviewSimulationOutput } from "@/ai/flows/ai-interview-simulation";
import { aiInterviewSimulation } from "@/ai/flows/ai-interview-simulation";
import { getInitialInterviewUtterance, type InitialInterviewUtteranceInput } from "@/ai/flows/initial-interview-message";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";


interface AIInterviewClientProps {
  jobContext: {
    jobTitle: string;
    jobDescription: string;
    candidateResume: string;
  };
}

type InterviewStage = "consent" | "loadingMessage" | "miraSpeaking" | "ready" | "countdown" | "recording" | "review" | "feedback";

// SpeechRecognition type fix for older/prefixed browsers
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition | undefined;
    webkitSpeechRecognition: typeof SpeechRecognition | undefined;
  }
}


export function AIInterviewClient({ jobContext }: AIInterviewClientProps) {
  const { toast } = useToast();
  const [stage, setStage] = useState<InterviewStage>("consent");
  const [consentGiven, setConsentGiven] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [videoBlobUrl, setVideoBlobUrl] = useState<string | null>(null);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [feedback, setFeedback] = useState<AiInterviewSimulationOutput | null>(null);
  const [isLoadingFeedback, setIsLoadingFeedback] = useState(false);
  
  const [aiGreeting, setAiGreeting] = useState<string | null>(null);
  const [currentAiQuestion, setCurrentAiQuestion] = useState<string | null>(null);
  const [isLoadingInitialMessage, setIsLoadingInitialMessage] = useState(false);

  const [isMiraSpeaking, setIsMiraSpeaking] = useState(false);
  const [userTranscript, setUserTranscript] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [speechApiError, setSpeechApiError] = useState<string | null>(null);

  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);


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
        // Attempt to select a preferred voice
        let preferredVoice = voices.find(
          (voice) => voice.lang === 'en-US' && (voice.name.includes('Female') || voice.name.includes('Zira') || voice.name.includes('Susan'))
        );
        if (!preferredVoice) {
          preferredVoice = voices.find(
            (voice) => voice.lang === 'en-GB' && voice.name.includes('Female')
          );
        }
        if (!preferredVoice) {
          preferredVoice = voices.find((voice) => voice.lang === 'en-US' && voice.name.toLowerCase().includes('female'));
        }
        if (!preferredVoice) {
          preferredVoice = voices.find((voice) => voice.lang.startsWith('en-') && voice.name.toLowerCase().includes('female'));
        }
        // Fallbacks
        if (!preferredVoice) {
          preferredVoice = voices.find((voice) => voice.lang === 'en-US');
        }
        if (!preferredVoice) {
          preferredVoice = voices.find((voice) => voice.lang.startsWith('en-'));
        }
        setSelectedVoice(preferredVoice || voices[0] || null);
      }
    };

    // Voices are loaded asynchronously.
    speechSynthesis.onvoiceschanged = loadVoices;
    loadVoices(); // Initial attempt

    return () => {
      speechSynthesis.onvoiceschanged = null;
    };
  }, []);


  useEffect(() => {
    if (consentGiven && stage === "consent") {
        setStage("loadingMessage");
    }
  }, [consentGiven, stage]);

  const speak = useCallback((text: string, onEndCallback?: () => void) => {
    if (!('speechSynthesis' in window)) {
      setSpeechApiError("Your browser does not support Text-to-Speech.");
      toast({ variant: "destructive", title: "TTS Not Supported", description: "Mira cannot speak in this browser."});
      onEndCallback?.(); 
      return;
    }
    
    if (speechSynthesis.speaking) {
        speechSynthesis.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utteranceRef.current = utterance;

    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }
    utterance.pitch = 1.0; // Standard pitch
    utterance.rate = 0.95;  // Slightly slower for clarity

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
    if (stage === "loadingMessage" && !aiGreeting && !currentAiQuestion && !isLoadingInitialMessage) {
      const fetchInitialMessage = async () => {
        setIsLoadingInitialMessage(true);
        setSpeechApiError(null);
        try {
          const input: InitialInterviewUtteranceInput = {
            jobTitle: jobContext.jobTitle,
          };
          const result = await getInitialInterviewUtterance(input);
          setAiGreeting(result.aiGreeting);
          setCurrentAiQuestion(result.firstQuestion);
          setStage("miraSpeaking"); 
          speak(`${result.aiGreeting} ${result.firstQuestion}`, () => {
            setStage("ready"); 
          });
          toast({ title: "Mira is ready!", description: "Your AI interviewer has joined." });
        } catch (error) {
          console.error("Error fetching initial AI message:", error);
          toast({ variant: "destructive", title: "AI Error", description: "Could not load AI. Please try refreshing." });
          const fallbackGreeting = "Hello! I'm Mira, your AI Interviewer. Apologies for the technical hiccup.";
          const fallbackQuestion = "To start, could you tell me about yourself?";
          setAiGreeting(fallbackGreeting);
          setCurrentAiQuestion(fallbackQuestion);
          setStage("miraSpeaking");
          speak(`${fallbackGreeting} ${fallbackQuestion}`, () => {
            setStage("ready");
          });
        } finally {
          setIsLoadingInitialMessage(false);
        }
      };
      fetchInitialMessage();
    }
  }, [stage, aiGreeting, currentAiQuestion, jobContext, toast, isLoadingInitialMessage, speak]);


  const cleanupStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoPreviewRef.current) {
      videoPreviewRef.current.srcObject = null;
    }
  }, []);
  
  const initializeSpeechRecognition = useCallback(() => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      setSpeechApiError("Your browser does not support Speech-to-Text.");
      toast({ variant: "destructive", title: "STT Not Supported", description: "Cannot transcribe your speech in this browser." });
      return null;
    }
    
    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = true; 
    recognition.interimResults = true; 
    recognition.lang = 'en-US';

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = (event) => {
      console.error('SpeechRecognition Error:', event.error);
      setSpeechApiError(`STT Error: ${event.error}`);
      if (event.error === 'no-speech') {
        toast({ variant: "destructive", title: "No Speech Detected", description: "Please ensure your microphone is working and you are speaking." });
      } else if (event.error === 'audio-capture') {
         toast({ variant: "destructive", title: "Microphone Error", description: "Could not capture audio. Check microphone permissions." });
      } else if (event.error !== 'aborted') { 
         toast({ variant: "destructive", title: "Speech Recognition Error", description: `Could not transcribe speech: ${event.error}` });
      }
      setIsListening(false);
    };
    recognition.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      setUserTranscript(prev => prev + finalTranscript + interimTranscript); 
    };
    return recognition;
  }, [toast]);


  const startCountdownAndRecording = useCallback(async () => {
    if (isMiraSpeaking) {
        toast({title: "Please wait", description: "Mira is still speaking."});
        return;
    }
    setUserTranscript(""); 
    setSpeechApiError(null);

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        streamRef.current = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (videoPreviewRef.current) {
          videoPreviewRef.current.srcObject = streamRef.current;
        }
        setStage("countdown");
        setCountdown(5);
        const countdownInterval = setInterval(() => {
          setCountdown(prev => {
            if (prev === null || prev <= 1) {
              clearInterval(countdownInterval);
              setStage("recording");
              setIsRecording(true);
              
              if (streamRef.current) {
                mediaRecorderRef.current = new MediaRecorder(streamRef.current);
                recordedChunksRef.current = [];
                mediaRecorderRef.current.ondataavailable = (event) => {
                  if (event.data.size > 0) recordedChunksRef.current.push(event.data);
                };
                mediaRecorderRef.current.onstop = () => {
                  const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
                  const url = URL.createObjectURL(blob);
                  setVideoBlobUrl(url);
                  setVideoBlob(blob);
                  setStage("review");
                  cleanupStream();
                  if (speechRecognitionRef.current && isListening) {
                    speechRecognitionRef.current.stop();
                  }
                };
                mediaRecorderRef.current.start();

                speechRecognitionRef.current = initializeSpeechRecognition();
                if (speechRecognitionRef.current) {
                  speechRecognitionRef.current.start();
                }

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
        toast({ variant: "destructive", title: "Camera Error", description: "Could not access camera/microphone." });
        setStage("ready");
      }
    } else {
      toast({ variant: "destructive", title: "Unsupported Browser", description: "Video recording not supported." });
      setStage("ready");
    }
  }, [toast, cleanupStream, initializeSpeechRecognition, isListening, isMiraSpeaking]);
  
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop(); 
    }
    if (speechRecognitionRef.current && isListening) {
        speechRecognitionRef.current.stop();
    }
    setIsRecording(false);
  }, [isListening]);

  const submitForFeedback = async () => {
    if (!videoBlob) {
      toast({ variant: "destructive", title: "No Video", description: "Please record a video first." });
      return;
    }
    setIsLoadingFeedback(true);
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
        console.log("User transcript before sending for feedback:", userTranscript); 
        const result = await aiInterviewSimulation(input);
        setFeedback(result);
        setStage("feedback");
        toast({ title: "Feedback Received!", description: "Mira has analyzed your response." });
      };
    } catch (error) {
      console.error("Error getting feedback:", error);
      toast({ variant: "destructive", title: "Feedback Error", description: "Could not get AI feedback." });
    } finally {
      setIsLoadingFeedback(false);
    }
  };

  const resetInterview = (fullReset = false) => {
    cleanupStream();
    if (speechSynthesis.speaking) speechSynthesis.cancel();
    if (speechRecognitionRef.current && isListening) speechRecognitionRef.current.abort();

    setVideoBlobUrl(null);
    setVideoBlob(null);
    setFeedback(null);
    setIsRecording(false);
    setCountdown(null);
    setUserTranscript("");
    setIsMiraSpeaking(false);
    setSpeechApiError(null);

    if (fullReset) {
        setAiGreeting(null);
        setCurrentAiQuestion(null);
        setStage("loadingMessage"); 
    } else {
        setStage("ready"); 
    }
  };
  
  useEffect(() => {
    return () => {
      cleanupStream();
      if (speechSynthesis.speaking) {
        speechSynthesis.cancel();
      }
      if (speechRecognitionRef.current && isListening) {
        speechRecognitionRef.current.abort();
      }
    };
  }, [cleanupStream, isListening]);


  return (
    <>
      <Dialog open={stage === "consent"} onOpenChange={(open) => !open && stage === "consent" && setStage("consent")}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Consent for Recording & Speech</DialogTitle>
            <DialogDescription>
              To proceed with the AI interview simulation, we need your consent to access your camera and microphone for recording your response, and to use speech technologies (Text-to-Speech for Mira, Speech-to-Text for your responses). Your recording and transcript will be used solely for providing you with AI-generated feedback.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center space-x-2 py-4">
            <Checkbox id="consent-checkbox" checked={consentGiven} onCheckedChange={(checked) => setConsentGiven(Boolean(checked))} />
            <Label htmlFor="consent-checkbox" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              I consent to video/audio recording and speech functionalities for this AI interview simulation.
            </Label>
          </div>
          <DialogFooter>
            <Button type="button" onClick={() => { 
                if(consentGiven) setStage("loadingMessage");
                else toast({variant: "destructive", title: "Consent Required", description: "Please provide consent to continue."})
            }}>
              Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {speechApiError && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{speechApiError}</AlertDescription>
        </Alert>
      )}

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Bot /> Mira - AI Interviewer 
            {isMiraSpeaking && <Volume2 className="h-5 w-5 text-primary animate-pulse" />}
          </CardTitle>
          {isLoadingInitialMessage || stage === "loadingMessage" ? (
            <div className="pt-2 space-y-1">
              <div className="h-4 bg-muted rounded w-3/4 animate-pulse"></div>
              <div className="h-4 bg-muted rounded w-1/2 animate-pulse"></div>
            </div>
          ) : (
            <>
              {aiGreeting && <CardDescription className="pt-2 text-lg">{aiGreeting}</CardDescription>}
              {currentAiQuestion && <CardDescription className="pt-1 text-lg font-semibold">{currentAiQuestion}</CardDescription>}
            </>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="aspect-video w-full bg-muted rounded-md flex items-center justify-center overflow-hidden relative">
            <video ref={videoPreviewRef} playsInline autoPlay muted className={cn("w-full h-full object-cover", ((stage === "review" || stage ==="feedback") && videoBlobUrl) && "hidden", isRecording && "transform scale-x-[-1]")} />
            {(stage === "review" || stage === "feedback") && videoBlobUrl && (
              <video src={videoBlobUrl} controls className="w-full h-full object-cover" />
            )}
            {stage !== "countdown" && stage !== "recording" && stage !== "review" && stage !== "feedback" && !((stage==="miraSpeaking" || stage ==="ready") && videoPreviewRef.current?.srcObject) && (
                <Camera className="h-24 w-24 text-muted-foreground" />
            )}
            {stage === "countdown" && countdown !== null && (
              <div className="absolute text-6xl font-bold text-white bg-black/50 p-4 rounded-lg">{countdown}</div>
            )}
            {isListening && stage === "recording" && (
              <div className="absolute bottom-2 left-2 bg-black/50 text-white p-2 rounded flex items-center text-xs">
                <Mic className="h-4 w-4 mr-1 animate-pulse text-red-400" /> Listening...
              </div>
            )}
          </div>
          
          {stage === "ready" && !isLoadingInitialMessage && (
            <Button onClick={startCountdownAndRecording} className="w-full" size="lg" disabled={isMiraSpeaking}>
              <Video className="mr-2 h-5 w-5" /> Start Recording Answer
            </Button>
          )}
          {stage === "recording" && (
            <Button onClick={stopRecording} variant="destructive" className="w-full" size="lg">
              Stop Recording
            </Button>
          )}
           {userTranscript && (stage === "recording" || stage === "review") && (
            <Card className="bg-secondary/50 p-3">
              <CardHeader className="p-1 pb-2">
                <CardTitle className="text-sm flex items-center"><UserCircle className="mr-2 h-4 w-4 text-muted-foreground"/>Your Response (Transcript):</CardTitle>
              </CardHeader>
              <CardContent className="p-1">
                <Textarea value={userTranscript} readOnly rows={3} className="text-sm bg-background" placeholder="Your transcribed speech will appear here..."/>
              </CardContent>
            </Card>
          )}
          {stage === "review" && videoBlobUrl && (
            <div className="grid grid-cols-2 gap-4">
              <Button onClick={() => resetInterview(false)} variant="outline" size="lg">Record Again</Button>
              <Button onClick={submitForFeedback} disabled={isLoadingFeedback} size="lg">
                {isLoadingFeedback ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Send className="mr-2 h-5 w-5" />}
                Submit for Feedback
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {stage === "feedback" && feedback && (
        <Card className="shadow-md mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><CheckCircle className="text-green-500" /> Mira's Feedback on Video</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea readOnly value={feedback.feedback} rows={10} className="bg-muted text-foreground" />
            {userTranscript && (
                 <Card className="bg-secondary/50 p-3 mt-4">
                    <CardHeader className="p-1 pb-2">
                        <CardTitle className="text-sm flex items-center"><UserCircle className="mr-2 h-4 w-4 text-muted-foreground"/>Your Final Transcript:</CardTitle>
                    </CardHeader>
                    <CardContent className="p-1">
                        <Textarea value={userTranscript} readOnly rows={5} className="text-sm bg-background"/>
                    </CardContent>
                </Card>
            )}
          </CardContent>
          <CardFooter>
            <Button onClick={() => resetInterview(true)} className="w-full">
              Start New Simulation
            </Button>
          </CardFooter>
        </Card>
      )}
    </>
  );
}

