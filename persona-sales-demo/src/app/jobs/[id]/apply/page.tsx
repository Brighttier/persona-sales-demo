
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, CheckCircle, FileUp, Loader2, Video } from "lucide-react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import React, { useState, useRef, useCallback } from "react"; // Added React import
import { useForm } from "react-hook-form";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label"; // Added Label import

const applicationFormSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters."),
  email: z.string().email("Invalid email address."),
  phone: z.string().optional(),
  resume: z.any().refine(fileList => fileList && fileList.length === 1, "Resume is required."), // Expects a FileList
  coverLetter: z.string().optional(),
  linkedinProfile: z.string().url("Invalid LinkedIn URL.").optional().or(z.literal('')),
  portfolioUrl: z.string().url("Invalid portfolio URL.").optional().or(z.literal('')),
});

type ApplicationFormValues = z.infer<typeof applicationFormSchema>;

// Mock job title for the application page
const jobTitle = "Software Engineer, Frontend"; // Would be fetched in a real app

export default function JobApplicationPage() {
  const router = useRouter();
  const params = useParams();
  const jobId = params.id as string;

  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isVideoRecorded, setIsVideoRecorded] = useState(false);
  const [videoBlobUrl, setVideoBlobUrl] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);


  const form = useForm<ApplicationFormValues>({
    resolver: zodResolver(applicationFormSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      coverLetter: "",
      linkedinProfile: "",
      portfolioUrl: "",
      // resume default will be handled by the input
    },
  });

  const handleResumeUpload = async (file: File) => {
    // Placeholder for AI Profile Enrichment
    console.log("Resume uploaded:", file.name);
    toast({
      title: "Resume Parsing (Simulated)",
      description: `${file.name} is being processed by AI to enrich your profile.`,
    });
  };

  const startRecording = async () => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (videoRef.current) videoRef.current.srcObject = stream; // Show live preview

        setCountdown(5);
        const countdownInterval = setInterval(() => {
          setCountdown(prev => {
            if (prev === null || prev <= 1) {
              clearInterval(countdownInterval);
              mediaRecorderRef.current = new MediaRecorder(stream);
              recordedChunksRef.current = [];
              mediaRecorderRef.current.ondataavailable = (event) => {
                if (event.data.size > 0) {
                  recordedChunksRef.current.push(event.data);
                }
              };
              mediaRecorderRef.current.onstop = () => {
                const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
                const url = URL.createObjectURL(blob);
                setVideoBlobUrl(url);
                setIsVideoRecorded(true);
                if (videoRef.current) videoRef.current.srcObject = null;
                stream.getTracks().forEach(track => track.stop());
              };
              mediaRecorderRef.current.start();
              setIsRecording(true);
              setTimeout(() => {
                if (mediaRecorderRef.current?.state === 'recording') {
                  mediaRecorderRef.current.stop();
                }
              }, 10000); 
              return null;
            }
            return prev - 1;
          });
        }, 1000);
      } catch (err) {
        console.error("Error accessing media devices.", err);
        toast({ variant: "destructive", title: "Camera Error", description: "Could not access your camera/microphone." });
      }
    } else {
       toast({ variant: "destructive", title: "Unsupported Browser", description: "Video recording is not supported in your browser." });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };


  const onSubmit = async (data: ApplicationFormValues) => {
    setIsSubmitting(true);
    console.log("Application Data:", data);
    if (videoBlobUrl) {
      console.log("Video Recorded URL:", videoBlobUrl);
    }

    await new Promise(resolve => setTimeout(resolve, 2000));

    setIsSubmitting(false);
    toast({
      title: "Application Submitted!",
      description: `Your application for ${jobTitle} has been successfully submitted.`,
      action: <CheckCircle className="text-green-500" />,
    });
    router.push(`/dashboard/candidate/applications`);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Button variant="ghost" asChild className="mb-4">
        <Link href={`/jobs/${jobId}`}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Job Details
        </Link>
      </Button>
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl">Apply for {jobTitle}</CardTitle>
          <CardDescription>Fill out the form below to submit your application. Fields marked with * are required.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email *</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="john.doe@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input type="tel" placeholder="(123) 456-7890" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="resume"
                render={({ field: { onChange, value, ...rest } }) => {
                  const fileInputId = `resume-apply-${React.useId()}`;
                  const currentFile = value?.[0] as File | undefined;
                  return (
                  <FormItem>
                    <FormLabel>Resume (PDF, DOC, DOCX) *</FormLabel>
                    <FormControl>
                      <div>
                        <Input 
                          type="file"
                          id={fileInputId}
                          accept=".pdf,.doc,.docx" 
                          onChange={(e) => {
                            onChange(e.target.files); // RHF expects FileList for this schema
                            if (e.target.files && e.target.files.length > 0) {
                              handleResumeUpload(e.target.files[0]); 
                            }
                          }}
                          className="sr-only"
                          {...rest} 
                        />
                        <Label
                          htmlFor={fileInputId}
                          className={cn(
                            "inline-flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium cursor-pointer w-full",
                            "bg-primary text-primary-foreground shadow-md hover:bg-primary/90 hover:shadow-lg transition-all"
                          )}
                        >
                          <FileUp className="mr-2 h-4 w-4" />
                          {currentFile?.name ? "Change Resume" : "Choose Resume"}
                        </Label>
                      </div>
                    </FormControl>
                    {currentFile?.name && <p className="text-xs text-muted-foreground mt-1">Selected: {currentFile.name}</p>}
                    <FormMessage />
                  </FormItem>
                  );
                }}
              />
               <FormField
                control={form.control}
                name="linkedinProfile"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>LinkedIn Profile URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://linkedin.com/in/yourprofile" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="portfolioUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Portfolio/Website URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://yourportfolio.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="coverLetter"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cover Letter (Optional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Tell us why you're a great fit for this role..." {...field} rows={5} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Card className="mt-6 bg-secondary/30 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg">10-Second Video Introduction (Optional)</CardTitle>
                  <CardDescription>Record a short video to introduce yourself.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <video ref={videoRef} controls={isVideoRecorded && !!videoBlobUrl} src={videoBlobUrl || undefined} className={cn("w-full rounded-md bg-muted shadow-inner", !isVideoRecorded && !isRecording && !countdown && "hidden", isRecording && "aspect-video")} playsInline muted={!isVideoRecorded || !videoBlobUrl}></video>
                  
                  {countdown !== null && (
                    <div className="text-center text-4xl font-bold text-primary">{countdown}</div>
                  )}

                  {!isRecording && !isVideoRecorded && countdown === null && (
                    <Button type="button" onClick={startRecording} className="w-full">
                      <Video className="mr-2 h-4 w-4" /> Start Recording
                    </Button>
                  )}
                  {isRecording && countdown === null && (
                     <Button type="button" onClick={stopRecording} variant="destructive" className="w-full">
                      Stop Recording
                    </Button>
                  )}
                  {isVideoRecorded && videoBlobUrl && (
                    <div className="text-center space-y-2">
                      <p className="text-sm text-green-600">Video recorded successfully!</p>
                       <Button type="button" onClick={() => { setIsVideoRecorded(false); setVideoBlobUrl(null); }} variant="outline" size="sm">
                        Record Again
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...
                  </>
                ) : (
                  <>
                    <FileUp className="mr-2 h-4 w-4" /> Submit Application
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
