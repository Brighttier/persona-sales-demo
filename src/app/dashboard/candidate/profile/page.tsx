
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { Edit3, FileUp, Loader2, Save, PlusCircle, Trash2, ExternalLink, Mail, Phone, Linkedin, Briefcase, GraduationCap, Award, FileText, Camera, VideoIcon } from "lucide-react";
import React, { useState, useEffect, useCallback } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
import { enrichProfile, type EnrichProfileOutput } from "@/ai/flows/profile-enrichment";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

const experienceSchema = z.object({
  id: z.string().optional(), // For key prop
  title: z.string().min(1, "Title is required"),
  company: z.string().min(1, "Company is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().optional().or(z.literal('')),
  description: z.string().optional().or(z.literal('')),
});

const educationSchema = z.object({
  id: z.string().optional(), // For key prop
  institution: z.string().min(1, "Institution is required"),
  degree: z.string().min(1, "Degree is required"),
  fieldOfStudy: z.string().optional().or(z.literal('')),
  graduationDate: z.string().optional().or(z.literal('')),
});

const certificationSchema = z.object({
  id: z.string().optional(), // For key prop
  name: z.string().min(1, "Certification name is required"),
  issuingOrganization: z.string().min(1, "Issuing organization is required"),
  date: z.string().optional().or(z.literal('')),
  credentialID: z.string().optional().or(z.literal('')),
});


const profileFormSchema = z.object({
  fullName: z.string().min(2, "Full name is required."),
  email: z.string().email(),
  phone: z.string().optional().or(z.literal('')),
  location: z.string().optional().or(z.literal('')),
  headline: z.string().min(5, "Headline should be descriptive.").optional().or(z.literal('')),
  summary: z.string().min(20, "Summary should be a bit longer.").optional().or(z.literal('')),
  skills: z.array(z.string()).optional(),
  experience: z.array(experienceSchema).optional(),
  education: z.array(educationSchema).optional(),
  certifications: z.array(certificationSchema).optional(),
  resume: z.any().optional(), // Can be FileList or null
  linkedinProfile: z.string().url("Invalid LinkedIn URL, ensure it includes http(s)://").optional().or(z.literal('')),
  portfolioUrl: z.string().url("Invalid portfolio URL, ensure it includes http(s)://").optional().or(z.literal('')),
  introductionVideoUrl: z.string().url("Invalid video URL").optional().or(z.literal('')), 
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

const PLACEHOLDER_INTRO_VIDEO_URL = "https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4";

export default function CandidateProfilePage() {
  const { user, isLoading: authLoading, login } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [skillsInput, setSkillsInput] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  
  // Generate stable IDs at the top level
  const resumeFileInputId = React.useId();
  const avatarFileInputId = React.useId();


  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      location: "",
      headline: "",
      summary: "",
      skills: [],
      experience: [],
      education: [],
      certifications: [],
      resume: null,
      linkedinProfile: "",
      portfolioUrl: "",
      introductionVideoUrl: "",
    },
  });

  const { fields: experienceFields, append: appendExperience, remove: removeExperience } = useFieldArray({ control: form.control, name: "experience" });
  const { fields: educationFields, append: appendEducation, remove: removeEducation } = useFieldArray({ control: form.control, name: "education" });
  const { fields: certificationFields, append: appendCertification, remove: removeCertification } = useFieldArray({ control: form.control, name: "certifications" });


  const resetFormValues = useCallback((currentUser: typeof user) => {
    if (currentUser) {
      const currentValues = form.getValues(); 
      form.reset({
        fullName: currentUser.name,
        email: currentUser.email,
        phone: currentValues.phone || "123-456-7890",
        location: currentValues.location || "Anytown, USA",
        headline: currentValues.headline || "Aspiring Software Innovator | Eager to Learn",
        summary: currentValues.summary || "Passionate about creating impactful technology solutions. Eager to learn and contribute to a dynamic team. Seeking new challenges to grow my skills in web development and AI.",
        skills: currentValues.skills?.length ? currentValues.skills : ["JavaScript", "React", "Node.js", "Problem Solving"],
        experience: currentValues.experience?.length ? currentValues.experience : [{ id: "exp1", title: "Software Development Intern", company: "Tech Startup X", startDate: "2023-06", endDate: "2023-08", description: "Assisted senior developers in building and testing new features for a web application. Gained experience with agile methodologies and version control. Collaborated on a major product release."}],
        education: currentValues.education?.length ? currentValues.education : [{id: "edu1", institution: "State University", degree: "BSc", fieldOfStudy: "Computer Science", graduationDate: "2024-05"}],
        certifications: currentValues.certifications?.length ? currentValues.certifications : [{id: "cert1", name: "Certified React Developer", issuingOrganization: "React Org", date: "2023-11", credentialID: "RC12345"}],
        linkedinProfile: currentValues.linkedinProfile || "",
        portfolioUrl: currentValues.portfolioUrl || "",
        resume: currentValues.resume || null,
        introductionVideoUrl: currentValues.introductionVideoUrl || PLACEHOLDER_INTRO_VIDEO_URL,
      });
      setAvatarPreview(currentUser.avatar || null);
    }
  }, [form]);

  useEffect(() => {
    if (user && !form.formState.isDirty) {
      resetFormValues(user);
    }
    if (user && !avatarPreview) {
        setAvatarPreview(user.avatar || null);
    }
  }, [user, resetFormValues, form.formState.isDirty, avatarPreview]);


  const handleResumeUpload = async (file: File) => {
    setIsAiProcessing(true);
    toast({
      title: "Processing Resume with AI...",
      description: "Extracting skills and summarizing experience.",
    });
    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = async () => {
        const resumeDataUri = reader.result as string;
        const result = await enrichProfile({ resumeDataUri });

        if (result.skills) {
          const currentSkills = form.getValues("skills") || [];
          const newSkills = Array.from(new Set([...currentSkills, ...result.skills]));
          form.setValue("skills", newSkills, {shouldValidate: true});
        }
        if (result.experienceSummary && (!form.getValues("summary") || form.getValues("summary")!.length < result.experienceSummary.length)) {
            form.setValue("summary", result.experienceSummary, {shouldValidate: true});
        }
        toast({ title: "Profile Enriched by AI!", description: "Skills and summary updated from your resume." });
      };
    } catch (error) {
      console.error("Error enriching profile:", error);
      toast({ variant: "destructive", title: "AI Enrichment Failed", description: "Could not process your resume with AI. Please ensure it's a PDF or TXT file." });
    } finally {
      setIsAiProcessing(false);
    }
  };

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
        toast({ title: "Avatar Preview Updated", description: "Save changes to apply. (Upload simulated)" });
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data: ProfileFormValues) => {
    setIsSubmitting(true);
    console.log("Profile Data Submitted:", data);

    await new Promise(resolve => setTimeout(resolve, 1500));

    if (user && login) { 
        const updatedUser = { ...user, name: data.fullName, avatar: avatarPreview || user.avatar };
        // login(user.role, updatedUser); // This line might need adjustment based on your AuthContext `login` signature
        // For demo, let's just update the local state for visuals.
        setUser(updatedUser); // Assuming setUser is available from useAuth, or just manage locally if not.
    }

    setIsSubmitting(false);
    setIsEditing(false);
    toast({
      title: "Profile Updated!",
      description: "Your profile information has been successfully saved.",
    });
  };

  // Helper to simulate updating user in context (if needed beyond AuthProvider's login)
  // This is a simplified example; actual implementation depends on AuthContext
  const setUser = (updatedUser: typeof user) => {
    if (login && user) {
       // This is not ideal as login is for role switching.
       // A proper updateUser function in AuthContext would be better.
       // For now, we'll just update the local `user` state if useAuth provided it.
       // This might cause issues if AuthContext relies on a different mechanism.
       // For a pure visual demo, this part is less critical if AuthProvider handles name/avatar separately.
    }
  };


  const addSkill = () => {
    if (skillsInput.trim() !== "") {
      const currentSkills = form.getValues("skills") || [];
      if (!currentSkills.map(s => s.toLowerCase()).includes(skillsInput.trim().toLowerCase())) {
        form.setValue("skills", [...currentSkills, skillsInput.trim()], {shouldValidate: true});
      }
      setSkillsInput("");
    }
  };

  const removeSkill = (skillToRemove: string) => {
    const currentSkills = form.getValues("skills") || [];
    form.setValue("skills", currentSkills.filter(skill => skill !== skillToRemove), {shouldValidate: true});
  };

  if (authLoading || !user) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /> <p className="ml-2">Loading profile...</p></div>;
  }

  const currentFullName = form.watch("fullName") || user.name;
  const currentHeadline = form.watch("headline");
  const currentLocation = form.watch("location");
  const currentLinkedin = form.watch("linkedinProfile");
  const currentPortfolio = form.watch("portfolioUrl");
  const currentIntroductionVideoUrl = form.watch("introductionVideoUrl");


  return (
    <div className="space-y-6">
      <div className="flex justify-end mb-4">
          <Button
            variant="outline"
            size="sm"
            className="bg-background hover:bg-accent hover:text-accent-foreground shadow-md"
            onClick={() => {
                if (isEditing) {
                  form.handleSubmit(onSubmit)();
                } else {
                  setIsEditing(true);
                }
              }}
            disabled={isSubmitting || isAiProcessing}
          >
            {isEditing ? (isSubmitting ? <Loader2 className="h-4 w-4 animate-spin"/> : <FileText className="h-4 w-4 mr-1" />) : <Edit3 className="h-4 w-4 mr-1" />}
            {isEditing ? (isSubmitting ? "Saving..." : "Save Changes") : "Edit Profile"}
          </Button>
      </div>

      <Card className="shadow-xl">
        {/* Thin Banner */}
        <div className="bg-gradient-to-br from-primary/10 via-background to-background h-8" />
        {/* Content section with padding */}
        <div className="p-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start">
            {/* Avatar wrapper, pulled up to overlap the banner */}
            <div className="-mt-16 shrink-0 relative group">
              <Avatar className="h-24 w-24 md:h-28 md:w-28 border-4 border-background shadow-lg">
                <AvatarImage src={avatarPreview || user.avatar || `https://placehold.co/200x200.png?text=${currentFullName.charAt(0)}`} alt={currentFullName} data-ai-hint="person professional"/>
                <AvatarFallback>{currentFullName.split(" ").map(n=>n[0]).join("").toUpperCase()}</AvatarFallback>
              </Avatar>
              {isEditing && (
                <>
                  <input
                    type="file"
                    id={avatarFileInputId}
                    className="hidden"
                    accept="image/*"
                    onChange={handleAvatarChange}
                  />
                  <label
                    htmlFor={avatarFileInputId}
                    className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 cursor-pointer rounded-full"
                    title="Change profile picture"
                  >
                    <Camera className="h-8 w-8 text-white" />
                  </label>
                </>
              )}
            </div>
            {/* Text details */}
            <div className="sm:ml-6 mt-4 sm:mt-0 text-center sm:text-left w-full">
              <CardTitle className="text-2xl md:text-3xl text-foreground">{currentFullName}</CardTitle>
              <CardDescription className="text-base mt-1 text-primary">{currentHeadline}</CardDescription>
              <p className="text-sm text-muted-foreground mt-1">{currentLocation}</p>
              <div className="flex gap-2 mt-2 justify-center sm:justify-start">
                {currentLinkedin && <Button variant="ghost" size="sm" asChild><Link href={currentLinkedin} target="_blank"><Linkedin className="h-4 w-4 mr-1"/> LinkedIn</Link></Button>}
                {currentPortfolio && <Button variant="ghost" size="sm" asChild><Link href={currentPortfolio} target="_blank"><ExternalLink className="h-4 w-4 mr-1"/> Portfolio</Link></Button>}
              </div>
            </div>
          </div>
        </div>
      </Card>


      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="shadow-lg">
              <CardHeader><CardTitle>Basic Information</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField control={form.control} name="fullName" render={({ field }) => (
                    <FormItem><FormLabel>Full Name *</FormLabel><FormControl><Input {...field} readOnly={!isEditing} /></FormControl><FormMessage /></FormItem>)}/>
                <FormField control={form.control} name="email" render={({ field }) => (
                    <FormItem><FormLabel>Email *</FormLabel><FormControl><Input type="email" {...field} readOnly /></FormControl><FormMessage /></FormItem>)}/>
                <FormField control={form.control} name="phone" render={({ field }) => (
                    <FormItem><FormLabel>Phone</FormLabel><FormControl><Input {...field} readOnly={!isEditing} /></FormControl><FormMessage /></FormItem>)}/>
                <FormField control={form.control} name="location" render={({ field }) => (
                    <FormItem><FormLabel>Location</FormLabel><FormControl><Input {...field} readOnly={!isEditing} placeholder="e.g., San Francisco, CA" /></FormControl><FormMessage /></FormItem>)}/>
                <FormField control={form.control} name="headline" render={({ field }) => (
                    <FormItem className="md:col-span-2"><FormLabel>Headline</FormLabel><FormControl><Input {...field} readOnly={!isEditing} placeholder="e.g., Senior Software Engineer | AI Enthusiast" /></FormControl><FormMessage /></FormItem>)}/>
                <FormField control={form.control} name="linkedinProfile" render={({ field }) => (
                    <FormItem><FormLabel>LinkedIn Profile URL</FormLabel><FormControl><Input {...field} readOnly={!isEditing} placeholder="https://linkedin.com/in/yourprofile" /></FormControl><FormMessage /></FormItem>)}/>
                <FormField control={form.control} name="portfolioUrl" render={({ field }) => (
                    <FormItem><FormLabel>Portfolio/Website URL</FormLabel><FormControl><Input {...field} readOnly={!isEditing} placeholder="https://yourportfolio.com" /></FormControl><FormMessage /></FormItem>)}/>
              </CardContent>
            </Card>

            <Card className="shadow-lg">
              <CardHeader><CardTitle>Professional Summary</CardTitle></CardHeader>
              <CardContent>
                <FormField control={form.control} name="summary" render={({ field }) => (
                    <FormItem><FormControl><Textarea rows={5} {...field} readOnly={!isEditing} placeholder="A brief summary about your professional background..." /></FormControl><FormMessage /></FormItem>)}/>
              </CardContent>
            </Card>

            <Card className="shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center"><Briefcase className="mr-2 h-5 w-5 text-primary"/>Work Experience</CardTitle>
                  {isEditing && <Button type="button" variant="outline" size="sm" onClick={() => appendExperience({ id: `exp-${Date.now()}`, title: "", company: "", startDate: "", endDate: "", description: "" })}><PlusCircle className="mr-2 h-4 w-4"/>Add</Button>}
              </CardHeader>
              <CardContent className="space-y-4">
                {experienceFields.map((field, index) => (
                  <div key={field.id} className="p-4 border rounded-md space-y-3 relative bg-secondary/30 shadow-sm">
                    {isEditing && <Button type="button" variant="ghost" size="icon" className="absolute top-1 right-1 text-destructive hover:bg-destructive/10 h-7 w-7" onClick={() => removeExperience(index)}><Trash2 className="h-4 w-4"/></Button>}
                    <FormField control={form.control} name={`experience.${index}.title`} render={({ field }) => (<FormItem><FormLabel>Job Title *</FormLabel><FormControl><Input {...field} readOnly={!isEditing} /></FormControl><FormMessage /></FormItem>)}/>
                    <FormField control={form.control} name={`experience.${index}.company`} render={({ field }) => (<FormItem><FormLabel>Company *</FormLabel><FormControl><Input {...field} readOnly={!isEditing} /></FormControl><FormMessage /></FormItem>)}/>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField control={form.control} name={`experience.${index}.startDate`} render={({ field }) => (<FormItem><FormLabel>Start Date *</FormLabel><FormControl><Input type={isEditing ? "month" : "text"} {...field} readOnly={!isEditing} /></FormControl><FormMessage /></FormItem>)}/>
                      <FormField control={form.control} name={`experience.${index}.endDate`} render={({ field }) => (<FormItem><FormLabel>End Date (or Present)</FormLabel><FormControl><Input type={isEditing ? "month" : "text"} {...field} readOnly={!isEditing} placeholder={isEditing ? "" : "Present"} /></FormControl><FormMessage /></FormItem>)}/>
                    </div>
                    <FormField control={form.control} name={`experience.${index}.description`} render={({ field }) => (<FormItem><FormLabel>Description</FormLabel><FormControl><Textarea {...field} readOnly={!isEditing} rows={3} placeholder="Key responsibilities and achievements..."/></FormControl><FormMessage /></FormItem>)}/>
                  </div>
                ))}
                {experienceFields.length === 0 && <p className="text-muted-foreground text-sm text-center py-4">No work experience added yet.</p>}
              </CardContent>
            </Card>

             <Card className="shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center"><GraduationCap className="mr-2 h-5 w-5 text-primary"/>Education</CardTitle>
                    {isEditing && <Button type="button" variant="outline" size="sm" onClick={() => appendEducation({ id: `edu-${Date.now()}`,institution: "", degree: "", fieldOfStudy: "", graduationDate: "" })}><PlusCircle className="mr-2 h-4 w-4"/>Add</Button>}
                </CardHeader>
                <CardContent className="space-y-4">
                {educationFields.map((field, index) => (
                    <div key={field.id} className="p-4 border rounded-md space-y-3 relative bg-secondary/30 shadow-sm">
                    {isEditing && <Button type="button" variant="ghost" size="icon" className="absolute top-1 right-1 text-destructive hover:bg-destructive/10 h-7 w-7" onClick={() => removeEducation(index)}><Trash2 className="h-4 w-4"/></Button>}
                    <FormField control={form.control} name={`education.${index}.institution`} render={({ field }) => (<FormItem><FormLabel>Institution *</FormLabel><FormControl><Input {...field} readOnly={!isEditing} /></FormControl><FormMessage /></FormItem>)}/>
                    <FormField control={form.control} name={`education.${index}.degree`} render={({ field }) => (<FormItem><FormLabel>Degree *</FormLabel><FormControl><Input {...field} readOnly={!isEditing} /></FormControl><FormMessage /></FormItem>)}/>
                    <FormField control={form.control} name={`education.${index}.fieldOfStudy`} render={({ field }) => (<FormItem><FormLabel>Field of Study</FormLabel><FormControl><Input {...field} readOnly={!isEditing} /></FormControl><FormMessage /></FormItem>)}/>
                    <FormField control={form.control} name={`education.${index}.graduationDate`} render={({ field }) => (<FormItem><FormLabel>Graduation Date (or Expected)</FormLabel><FormControl><Input type={isEditing ? "month" : "text"} {...field} readOnly={!isEditing} /></FormControl><FormMessage /></FormItem>)}/>
                    </div>
                ))}
                {educationFields.length === 0 && <p className="text-muted-foreground text-sm text-center py-4">No education details added yet.</p>}
                </CardContent>
            </Card>

            <Card className="shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center"><Award className="mr-2 h-5 w-5 text-primary"/>Certifications</CardTitle>
                    {isEditing && <Button type="button" variant="outline" size="sm" onClick={() => appendCertification({ id: `cert-${Date.now()}`, name: "", issuingOrganization: "", date: "", credentialID: "" })}><PlusCircle className="mr-2 h-4 w-4"/>Add</Button>}
                </CardHeader>
                <CardContent className="space-y-4">
                {certificationFields.map((field, index) => (
                    <div key={field.id} className="p-4 border rounded-md space-y-3 relative bg-secondary/30 shadow-sm">
                    {isEditing && <Button type="button" variant="ghost" size="icon" className="absolute top-1 right-1 text-destructive hover:bg-destructive/10 h-7 w-7" onClick={() => removeCertification(index)}><Trash2 className="h-4 w-4"/></Button>}
                    <FormField control={form.control} name={`certifications.${index}.name`} render={({ field }) => (<FormItem><FormLabel>Certification Name *</FormLabel><FormControl><Input {...field} readOnly={!isEditing} /></FormControl><FormMessage /></FormItem>)}/>
                    <FormField control={form.control} name={`certifications.${index}.issuingOrganization`} render={({ field }) => (<FormItem><FormLabel>Issuing Organization *</FormLabel><FormControl><Input {...field} readOnly={!isEditing} /></FormControl><FormMessage /></FormItem>)}/>
                    <div className="grid grid-cols-2 gap-4">
                        <FormField control={form.control} name={`certifications.${index}.date`} render={({ field }) => (<FormItem><FormLabel>Date Issued</FormLabel><FormControl><Input type={isEditing ? "month" : "text"} {...field} readOnly={!isEditing} /></FormControl><FormMessage /></FormItem>)}/>
                        <FormField control={form.control} name={`certifications.${index}.credentialID`} render={({ field }) => (<FormItem><FormLabel>Credential ID (Optional)</FormLabel><FormControl><Input {...field} readOnly={!isEditing} /></FormControl><FormMessage /></FormItem>)}/>
                    </div>
                    </div>
                ))}
                {certificationFields.length === 0 && <p className="text-muted-foreground text-sm text-center py-4">No certifications added yet.</p>}
                </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="shadow-lg">
              <CardHeader><CardTitle className="flex items-center"><VideoIcon className="mr-2 h-5 w-5 text-primary"/> My Introduction Video</CardTitle></CardHeader>
              <CardContent>
                {currentIntroductionVideoUrl ? (
                  <video src={currentIntroductionVideoUrl} controls className="w-full rounded-md aspect-video shadow-inner bg-muted"></video>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    <VideoIcon className="mx-auto h-10 w-10 mb-2" />
                    <p className="text-sm">No introduction video uploaded yet.</p>
                    {isEditing && <p className="text-xs mt-1">You can add a video URL below.</p>}
                  </div>
                )}
                {isEditing && (
                  <FormField
                    control={form.control}
                    name="introductionVideoUrl"
                    render={({ field }) => (
                      <FormItem className="mt-4">
                        <FormLabel>Video URL</FormLabel>
                        <FormControl><Input {...field} placeholder="https://example.com/intro.mp4" /></FormControl>
                        <FormDescription>Paste a link to your hosted introduction video.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </CardContent>
            </Card>

            <Card className="shadow-lg">
              <CardHeader><CardTitle>Skills</CardTitle></CardHeader>
              <CardContent>
                {isEditing && (
                  <div className="flex gap-2 mb-4">
                      <Input value={skillsInput} onChange={(e) => setSkillsInput(e.target.value)} placeholder="Add a skill (e.g., Python)" onKeyPress={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill();}}} />
                      <Button type="button" onClick={addSkill} variant="outline" size="sm">Add</Button>
                    </div>
                )}
                <div className="flex flex-wrap gap-2">
                  {(form.watch("skills") || []).map((skill) => (<Badge key={skill} variant="default" className="py-1 px-3 text-sm">{skill}{isEditing && (<button type="button" onClick={() => removeSkill(skill)} className="ml-2 font-bold hover:text-destructive-foreground/80"><Trash2 className="h-3 w-3"/></button>)}</Badge>))}
                  {(form.watch("skills") || []).length === 0 && !isEditing && <p className="text-muted-foreground text-sm">No skills added yet.</p>}
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg">
              <CardHeader><CardTitle>Resume</CardTitle><CardDescription>Upload your latest resume. AI can help enrich your profile based on it.</CardDescription></CardHeader>
              <CardContent>
                <FormField control={form.control} name="resume" render={({ field: { onChange, value, ...rest } }) => {
                    const currentFile = value instanceof FileList ? value[0] : value;
                    return (
                    <FormItem>
                      <div className="flex items-center gap-4">
                        <FormControl>
                          <div> {/* This div will now receive the ID */}
                            <Input
                              type="file"
                              id={resumeFileInputId}
                              accept=".pdf,.txt" 
                              onChange={(e) => {
                                const files = e.target.files;
                                if (files && files.length > 0) {
                                  onChange(files); 
                                  handleResumeUpload(files[0]);
                                } else {
                                  onChange(null);
                                }
                              }}
                              className="sr-only"
                              disabled={!isEditing || isAiProcessing}
                              {...rest}
                            />
                            <Label
                              htmlFor={resumeFileInputId}
                              className={cn(
                                "inline-flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium cursor-pointer w-full",
                                "bg-primary text-primary-foreground shadow-md hover:bg-primary/90 hover:shadow-lg transition-all"
                              )}
                            >
                              <FileUp className="mr-2 h-4 w-4" />
                              {currentFile instanceof File ? "Change Resume" : "Upload Resume"}
                            </Label>
                          </div>
                        </FormControl>
                        {isAiProcessing && <Loader2 className="h-5 w-5 animate-spin text-primary" />}
                      </div>
                      <FormDescription className="mt-2 text-xs">
                        {currentFile instanceof File ? `Current file: ${currentFile.name}` : "No resume uploaded. (PDF or TXT only)"}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                    );
                  }}/>
              </CardContent>
            </Card>
          </div>

          {isEditing && (
            <CardFooter className="lg:col-span-3 flex justify-end gap-2 pt-8 border-t mt-0">
              <Button type="button" variant="outline" onClick={() => { setIsEditing(false); if(user) resetFormValues(user); }} disabled={isSubmitting || isAiProcessing}>Cancel</Button>
              <Button type="button" onClick={form.handleSubmit(onSubmit)} disabled={isSubmitting || isAiProcessing}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
                Save Changes
              </Button>
            </CardFooter>
          )}
        </form>
      </Form>
    </div>
  );
}

