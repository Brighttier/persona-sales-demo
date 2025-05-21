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
import { useRouter } from "next/navigation";
import { useState, useRef, useCallback } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
// Placeholder for AI flow import, assuming it's available
// import { enrichProfile } from "@/ai/flows/profile-enrichment";

const applicationFormSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters."),
  email: z.string().email("Invalid email address."),
  phone: z.string().optional(),
  resume: z.any().refine(fileList => fileList && fileList.length === 1, "Resume is required."),
  coverLetter: z.string().optional(),
  linkedinProfile: z.string().url("Invalid LinkedIn URL.").optional(),
  portfolioUrl: z.string().url("Invalid portfolio URL.").optional(),
});

type ApplicationFormValues = z.infer<typeof applicationFormSchema>;

// Mock job title for the application page
const jobTitle = "Software Engineer, Frontend"; // Would be fetched in a real app

export default function JobApplicationPage({ params }: { params: { id: string } }) {
  const router = useRouter();
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
    },
  });

  const handleResumeUpload = async (file: File) => {
    // Placeholder for AI Profile Enrichment
    console.log("Resume uploaded:", file.name);
    toast({
      title: "Resume Parsing (Simulated)",
      description: `${file.name} is being processed by AI to enrich your profile.`,
    });
    // In a real app:
    // const reader = new FileReader();
    // reader.readAsDataURL(file);
    // reader.onloadend = async () => {
    //   try {
    //     const resumeDataUri = reader.result as string;
    //     const enrichmentResult = await enrichProfile({ resumeDataUri });
    //     console.log("Enrichment Result:", enrichmentResult);
    //     toast({ title: "Profile Enriched!", description: "Your skills and experience have been updated."});
    //     // Update candidate profile state or store data
    //   } catch (error) {
    //     console.error("Error enriching profile:", error);
    //     toast({ variant: "destructive", title: "AI Enrichment Failed", description: "Could not process your resume." });
    //   }
    // };
  };

  const startRecording = async () => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (videoRef.current) videoRef.current.srcObject = stream; // Show live preview

        // Start countdown
        setCountdown(5);
        const countdownInterval = setInterval(() => {
          setCountdown(prev => {
            if (prev === null || prev <= 1) {
              clearInterval(countdownInterval);
              // Actual recording start after countdown
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
                if (videoRef.current) videoRef.current.srcObject = null; // Stop live preview
                stream.getTracks().forEach(track => track.stop()); // Stop camera after recording
              };
              mediaRecorderRef.current.start();
              setIsRecording(true);
              // Max 10 seconds recording
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
    if (data.resume && data.resume.length > 0) {
      await handleResumeUpload(data.resume[0]);
    }
    if (videoBlobUrl) {
      console.log("Video Recorded URL:", videoBlobUrl);
      // Here you would typically upload the videoBlobUrl (or the Blob itself) to a server
    }

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));

    setIsSubmitting(false);
    toast({
      title: "Application Submitted!",
      description: `Your application for ${jobTitle} has been successfully submitted.`,
      action: <CheckCircle className="text-green-500" />,
    });
    router.push(`/dashboard/candidate/applications`); // Or a thank you page
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Button variant="ghost" asChild className="mb-4">
        <Link href={`/jobs/${params.id}`}>
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
                render={({ field: { onChange, value, ...rest } }) => (
                  <FormItem>
                    <FormLabel>Resume (PDF, DOC, DOCX) *</FormLabel>
                    <FormControl>
                      <Input 
                        type="file" 
                        accept=".pdf,.doc,.docx" 
                        onChange={(e) => {
                          onChange(e.target.files);
                          if (e.target.files && e.target.files.length > 0) {
                            // handleResumeUpload(e.target.files[0]); // Moved to onSubmit
                          }
                        }}
                        {...rest} 
                        className="pt-2"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
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

              {/* Video Introduction Section */}
              <Card className="mt-6 bg-secondary/30">
                <CardHeader>
                  <CardTitle className="text-lg">10-Second Video Introduction (Optional)</CardTitle>
                  <CardDescription>Record a short video to introduce yourself.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <video ref={videoRef} controls={isVideoRecorded && !!videoBlobUrl} src={videoBlobUrl || undefined} className={cn("w-full rounded-md bg-muted", !isVideoRecorded && !isRecording && !countdown && "hidden", isRecording && "aspect-video")} playsInline muted={!isVideoRecorded || !videoBlobUrl}></video>
                  
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
