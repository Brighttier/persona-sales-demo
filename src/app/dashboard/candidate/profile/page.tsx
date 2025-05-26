
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
import { Edit3, FileUp, Loader2, Save, PlusCircle, Trash2, ExternalLink, Mail, Phone, Linkedin, Briefcase, GraduationCap, Award } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
// Placeholder for AI flow import
import { enrichProfile, type EnrichProfileOutput } from "@/ai/flows/profile-enrichment";

const experienceSchema = z.object({
  title: z.string().min(1, "Title is required"),
  company: z.string().min(1, "Company is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().optional().or(z.literal('')),
  description: z.string().optional().or(z.literal('')),
});

const educationSchema = z.object({
  institution: z.string().min(1, "Institution is required"),
  degree: z.string().min(1, "Degree is required"),
  fieldOfStudy: z.string().optional().or(z.literal('')),
  graduationDate: z.string().optional().or(z.literal('')),
});

const certificationSchema = z.object({
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
  resume: z.any().optional(),
  linkedinProfile: z.string().url("Invalid LinkedIn URL, ensure it includes http(s)://").optional().or(z.literal('')),
  portfolioUrl: z.string().url("Invalid portfolio URL, ensure it includes http(s)://").optional().or(z.literal('')),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export default function CandidateProfilePage() {
  const { user, isLoading: authLoading, login } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [skillsInput, setSkillsInput] = useState("");

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      fullName: "", email: "", phone: "", location: "", headline: "", summary: "",
      skills: [],
      experience: [],
      education: [],
      certifications: [],
      resume: null,
      linkedinProfile: "",
      portfolioUrl: "",
    },
  });

  const { fields: experienceFields, append: appendExperience, remove: removeExperience } = useFieldArray({ control: form.control, name: "experience" });
  const { fields: educationFields, append: appendEducation, remove: removeEducation } = useFieldArray({ control: form.control, name: "education" });
  const { fields: certificationFields, append: appendCertification, remove: removeCertification } = useFieldArray({ control: form.control, name: "certifications" });


  const resetFormValues = useCallback((currentUser: typeof user) => {
    if (currentUser) {
      form.reset({
        fullName: currentUser.name,
        email: currentUser.email,
        phone: form.getValues("phone") || "123-456-7890",
        location: form.getValues("location") || "Anytown, USA",
        headline: form.getValues("headline") || "Aspiring Software Innovator | Eager to Learn",
        summary: form.getValues("summary") || "Passionate about creating impactful technology solutions. Eager to learn and contribute to a dynamic team. Seeking new challenges to grow my skills in web development and AI.",
        skills: form.getValues("skills")?.length ? form.getValues("skills") : ["JavaScript", "React", "Node.js", "Problem Solving"],
        experience: form.getValues("experience")?.length ? form.getValues("experience") : [{ title: "Software Development Intern", company: "Tech Startup X", startDate: "2023-06", endDate: "2023-08", description: "Assisted senior developers in building and testing new features for a web application. Gained experience with agile methodologies and version control."}],
        education: form.getValues("education")?.length ? form.getValues("education") : [{institution: "State University", degree: "BSc", fieldOfStudy: "Computer Science", graduationDate: "2024-05"}],
        certifications: form.getValues("certifications")?.length ? form.getValues("certifications") : [{name: "Certified React Developer", issuingOrganization: "React Org", date: "2023-11"}],
        linkedinProfile: form.getValues("linkedinProfile") || "",
        portfolioUrl: form.getValues("portfolioUrl") || "",
        resume: form.getValues("resume") || null,
      });
    }
  }, [form]);

  useEffect(() => {
    if (user) {
      resetFormValues(user);
    }
  }, [user, resetFormValues]);

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
      toast({ variant: "destructive", title: "AI Enrichment Failed", description: "Could not process your resume with AI." });
    } finally {
      setIsAiProcessing(false);
    }
  };

  const onSubmit = async (data: ProfileFormValues) => {
    setIsSubmitting(true);
    console.log("Profile Data Submitted:", data);
    await new Promise(resolve => setTimeout(resolve, 1500));

    if (user && data.fullName !== user.name && login) {
        const updatedUser = { ...user, name: data.fullName };
        login(user.role); // This might be a simplified update for context
    }

    setIsSubmitting(false);
    setIsEditing(false);
    toast({
      title: "Profile Updated!",
      description: "Your profile information has been successfully saved.",
    });
  };

  const addSkill = () => {
    if (skillsInput.trim() !== "") {
      const currentSkills = form.getValues("skills") || [];
      if (!currentSkills.includes(skillsInput.trim().toLowerCase())) {
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

  return (
    <div className="space-y-6">
      <Card className="shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-primary/80 to-primary/60 h-32 md:h-40 relative">
           <Button
              variant="outline"
              size="sm"
              className="absolute top-4 right-4 bg-background/80 hover:bg-background shadow-md"
              onClick={() => {
                  if (isEditing) {
                    form.handleSubmit(onSubmit)();
                  } else {
                    setIsEditing(true);
                  }
                }}
              disabled={isSubmitting || isAiProcessing}
            >
              {isEditing ? (isSubmitting ? <Loader2 className="h-4 w-4 animate-spin"/> : <Save className="h-4 w-4 mr-1" />) : <Edit3 className="h-4 w-4 mr-1" />}
              {isEditing ? (isSubmitting ? "Saving..." : "Save Changes") : "Edit Profile"}
            </Button>
        </div>
        <div className="px-6 pb-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-end -mt-16 md:-mt-20">
            <Avatar className="h-32 w-32 md:h-40 md:w-40 border-4 border-background shadow-lg">
              <AvatarImage src={user.avatar || `https://placehold.co/200x200.png?text=${(form.watch("fullName") || user.name).charAt(0)}`} alt={form.watch("fullName") || user.name} data-ai-hint="person professional"/>
              <AvatarFallback>{(form.watch("fullName") || user.name).split(" ").map(n=>n[0]).join("").toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="sm:ml-6 mt-4 sm:mt-0 text-center sm:text-left">
             <CardTitle className="text-2xl md:text-3xl">{form.watch("fullName")}</CardTitle>
             <CardDescription className="text-base mt-1 text-primary">{form.watch("headline")}</CardDescription>
             <p className="text-sm text-muted-foreground mt-1">{form.watch("location")}</p>
             <div className="flex gap-2 mt-2 justify-center sm:justify-start">
                {form.watch("linkedinProfile") && <Button variant="ghost" size="sm" asChild><Link href={form.watch("linkedinProfile")!} target="_blank"><Linkedin className="h-4 w-4 mr-1"/> LinkedIn</Link></Button>}
                {form.watch("portfolioUrl") && <Button variant="ghost" size="sm" asChild><Link href={form.watch("portfolioUrl")!} target="_blank"><ExternalLink className="h-4 w-4 mr-1"/> Portfolio</Link></Button>}
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
                    <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input {...field} readOnly={!isEditing} /></FormControl><FormMessage /></FormItem>)}/>
                <FormField control={form.control} name="email" render={({ field }) => (
                    <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" {...field} readOnly /></FormControl><FormMessage /></FormItem>)}/>
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
                  {isEditing && <Button type="button" variant="outline" size="sm" onClick={() => appendExperience({ title: "", company: "", startDate: "", description: "" })}><PlusCircle className="mr-2 h-4 w-4"/>Add</Button>}
              </CardHeader>
              <CardContent className="space-y-4">
                {experienceFields.map((field, index) => (
                  <div key={field.id} className="p-4 border rounded-md space-y-3 relative bg-secondary/30 shadow-sm">
                    {isEditing && <Button type="button" variant="ghost" size="icon" className="absolute top-1 right-1 text-destructive hover:bg-destructive/10 h-7 w-7" onClick={() => removeExperience(index)}><Trash2 className="h-4 w-4"/></Button>}
                    <FormField control={form.control} name={`experience.${index}.title`} render={({ field }) => (<FormItem><FormLabel>Job Title</FormLabel><FormControl><Input {...field} readOnly={!isEditing} /></FormControl><FormMessage /></FormItem>)}/>
                    <FormField control={form.control} name={`experience.${index}.company`} render={({ field }) => (<FormItem><FormLabel>Company</FormLabel><FormControl><Input {...field} readOnly={!isEditing} /></FormControl><FormMessage /></FormItem>)}/>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField control={form.control} name={`experience.${index}.startDate`} render={({ field }) => (<FormItem><FormLabel>Start Date</FormLabel><FormControl><Input type={isEditing ? "month" : "text"} {...field} readOnly={!isEditing} /></FormControl><FormMessage /></FormItem>)}/>
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
                    {isEditing && <Button type="button" variant="outline" size="sm" onClick={() => appendEducation({ institution: "", degree: "", fieldOfStudy: "", graduationDate: "" })}><PlusCircle className="mr-2 h-4 w-4"/>Add</Button>}
                </CardHeader>
                <CardContent className="space-y-4">
                {educationFields.map((field, index) => (
                    <div key={field.id} className="p-4 border rounded-md space-y-3 relative bg-secondary/30 shadow-sm">
                    {isEditing && <Button type="button" variant="ghost" size="icon" className="absolute top-1 right-1 text-destructive hover:bg-destructive/10 h-7 w-7" onClick={() => removeEducation(index)}><Trash2 className="h-4 w-4"/></Button>}
                    <FormField control={form.control} name={`education.${index}.institution`} render={({ field }) => (<FormItem><FormLabel>Institution</FormLabel><FormControl><Input {...field} readOnly={!isEditing} /></FormControl><FormMessage /></FormItem>)}/>
                    <FormField control={form.control} name={`education.${index}.degree`} render={({ field }) => (<FormItem><FormLabel>Degree</FormLabel><FormControl><Input {...field} readOnly={!isEditing} /></FormControl><FormMessage /></FormItem>)}/>
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
                    {isEditing && <Button type="button" variant="outline" size="sm" onClick={() => appendCertification({ name: "", issuingOrganization: "", date: "", credentialID: "" })}><PlusCircle className="mr-2 h-4 w-4"/>Add</Button>}
                </CardHeader>
                <CardContent className="space-y-4">
                {certificationFields.map((field, index) => (
                    <div key={field.id} className="p-4 border rounded-md space-y-3 relative bg-secondary/30 shadow-sm">
                    {isEditing && <Button type="button" variant="ghost" size="icon" className="absolute top-1 right-1 text-destructive hover:bg-destructive/10 h-7 w-7" onClick={() => removeCertification(index)}><Trash2 className="h-4 w-4"/></Button>}
                    <FormField control={form.control} name={`certifications.${index}.name`} render={({ field }) => (<FormItem><FormLabel>Certification Name</FormLabel><FormControl><Input {...field} readOnly={!isEditing} /></FormControl><FormMessage /></FormItem>)}/>
                    <FormField control={form.control} name={`certifications.${index}.issuingOrganization`} render={({ field }) => (<FormItem><FormLabel>Issuing Organization</FormLabel><FormControl><Input {...field} readOnly={!isEditing} /></FormControl><FormMessage /></FormItem>)}/>
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
              <CardHeader><CardTitle>Skills</CardTitle></CardHeader>
              <CardContent>
                {isEditing && (
                  <div className="flex gap-2 mb-4">
                      <Input value={skillsInput} onChange={(e) => setSkillsInput(e.target.value)} placeholder="Add a skill (e.g., Python)" onKeyPress={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill();}}} />
                      <Button type="button" onClick={addSkill} variant="outline" size="sm">Add</Button>
                    </div>
                )}
                <div className="flex flex-wrap gap-2">
                  {form.watch("skills")?.map((skill) => (<Badge key={skill} variant="default" className="py-1 px-3 text-sm">{skill}{isEditing && (<button type="button" onClick={() => removeSkill(skill)} className="ml-2 font-bold hover:text-destructive-foreground/80"><Trash2 className="h-3 w-3"/></button>)}</Badge>))}
                  {form.watch("skills")?.length === 0 && !isEditing && <p className="text-muted-foreground text-sm">No skills added yet.</p>}
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg">
              <CardHeader><CardTitle>Resume</CardTitle><CardDescription>Upload your latest resume. AI can help enrich your profile based on it.</CardDescription></CardHeader>
              <CardContent>
                <FormField control={form.control} name="resume" render={({ field: { onChange, value, ...rest } }) => (
                    <FormItem>
                      <FormLabel className="sr-only">Upload Resume (PDF, DOCX)</FormLabel>
                      <div className="flex items-center gap-4">
                        <FormControl><Input type="file" accept=".pdf,.doc,.docx" onChange={(e) => { if (e.target.files && e.target.files.length > 0) { onChange(e.target.files[0]); handleResumeUpload(e.target.files[0]); } }} {...rest} className="flex-grow" disabled={!isEditing || isAiProcessing} /></FormControl>
                        {isAiProcessing && <Loader2 className="h-5 w-5 animate-spin text-primary" />}
                      </div>
                      <FormDescription>{typeof value === 'object' && value?.name ? `Current file: ${value.name}` : "No resume uploaded."}</FormDescription><FormMessage />
                    </FormItem>)}/>
              </CardContent>
            </Card>
          </div>

          {isEditing && (
            <CardFooter className="lg:col-span-3 flex justify-end gap-2 pt-8 border-t mt-0"> {/* Adjusted mt-0 for better fit */}
              <Button type="button" variant="outline" onClick={() => { setIsEditing(false); if(user) resetFormValues(user); }} disabled={isSubmitting || isAiProcessing}>Cancel</Button>
              <Button type="button" onClick={form.handleSubmit(onSubmit)} disabled={isSubmitting || isAiProcessing}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save Changes
              </Button>
            </CardFooter>
          )}
        </form>
      </Form>
    </div>
  );
}
