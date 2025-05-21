
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
import { Edit3, FileUp, Loader2, Save, VenetianMask, PlusCircle, Trash2, ExternalLink } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
// Placeholder for AI flow import
import { enrichProfile, type EnrichProfileOutput } from "@/ai/flows/profile-enrichment";

const experienceSchema = z.object({
  title: z.string().min(1, "Title is required"),
  company: z.string().min(1, "Company is required"),
  startDate: z.string().min(1, "Start date is required"), // Could use date type if parsing
  endDate: z.string().optional(),
  description: z.string().optional(),
});

const educationSchema = z.object({
  institution: z.string().min(1, "Institution is required"),
  degree: z.string().min(1, "Degree is required"),
  fieldOfStudy: z.string().optional(),
  graduationDate: z.string().optional(), // Could use date type
});


const profileFormSchema = z.object({
  fullName: z.string().min(2, "Full name is required."),
  email: z.string().email(),
  phone: z.string().optional(),
  location: z.string().optional(),
  headline: z.string().min(5, "Headline should be descriptive.").optional(),
  summary: z.string().min(20, "Summary should be a bit longer.").optional(),
  skills: z.array(z.string()).optional(), 
  experience: z.array(experienceSchema).optional(),
  education: z.array(educationSchema).optional(),
  resume: z.any().optional(), 
  linkedinProfile: z.string().url("Invalid LinkedIn URL, ensure it includes http(s)://").optional().or(z.literal('')),
  portfolioUrl: z.string().url("Invalid portfolio URL, ensure it includes http(s)://").optional().or(z.literal('')),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export default function CandidateProfilePage() {
  const { user, isLoading: authLoading, login } = useAuth(); // Assuming login can update user details
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [skillsInput, setSkillsInput] = useState("");
  
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      fullName: "",
      email: "",
      skills: [],
      experience: [],
      education: [],
      linkedinProfile: "",
      portfolioUrl: "",
    },
  });
  
  const { fields: experienceFields, append: appendExperience, remove: removeExperience } = useFieldArray({ control: form.control, name: "experience" });
  const { fields: educationFields, append: appendEducation, remove: removeEducation } = useFieldArray({ control: form.control, name: "education" });

  const resetFormValues = useCallback((currentUser: typeof user) => {
    if (currentUser) {
      form.reset({
        fullName: currentUser.name,
        email: currentUser.email,
        // Mock data for other fields until actual data source or first edit
        headline: form.getValues("headline") || "Aspiring Software Innovator | Eager to Learn",
        summary: form.getValues("summary") || "Passionate about creating impactful technology solutions. Eager to learn and contribute to a dynamic team. Seeking new challenges to grow my skills in web development and AI.",
        skills: form.getValues("skills")?.length ? form.getValues("skills") : ["JavaScript", "React", "Node.js", "Problem Solving"],
        experience: form.getValues("experience")?.length ? form.getValues("experience") : [{ title: "Software Development Intern", company: "Tech Startup X", startDate: "2023-06-01", endDate: "2023-08-31", description: "Assisted senior developers in building and testing new features for a web application. Gained experience with agile methodologies and version control."}],
        education: form.getValues("education")?.length ? form.getValues("education") : [{institution: "State University", degree: "BSc", fieldOfStudy: "Computer Science", graduationDate: "2024-05-01"}],
        location: form.getValues("location") || "Anytown, USA",
        phone: form.getValues("phone") || "123-456-7890",
        linkedinProfile: form.getValues("linkedinProfile") || "",
        portfolioUrl: form.getValues("portfolioUrl") || "",
        resume: null, // Reset resume file input
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
        const result = await enrichProfile({ resumeDataUri }); // AI Call
        
        if (result.skills) {
          const currentSkills = form.getValues("skills") || [];
          const newSkills = Array.from(new Set([...currentSkills, ...result.skills]));
          form.setValue("skills", newSkills, {shouldValidate: true});
        }
        if (result.experienceSummary && (!form.getValues("summary") || form.getValues("summary")?.length < result.experienceSummary.length)) {
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
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Update user in AuthContext (if name changed for avatar/header)
    if (user && data.fullName !== user.name) {
        // This is a mock update. In a real app, you'd update the backend
        // and then potentially re-fetch user or update context from response.
        const updatedUser = { ...user, name: data.fullName };
        login(user.role); 
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
      if (!currentSkills.includes(skillsInput.trim())) {
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
              className="absolute top-4 right-4 bg-background/80 hover:bg-background"
              onClick={() => {
                  setIsEditing(!isEditing);
                  if(isEditing) form.handleSubmit(onSubmit)(); 
                  else if(user) resetFormValues(user); 
                }}
              disabled={isSubmitting || isAiProcessing}
            >
              {isEditing ? (isSubmitting ? <Loader2 className="h-4 w-4 animate-spin"/> : <Save className="h-4 w-4 mr-1" />) : <Edit3 className="h-4 w-4 mr-1" />}
              {isEditing ? (isSubmitting ? "Saving..." : "Save") : "Edit"}
            </Button>
        </div>
        <div className="px-6 pb-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-end -mt-16 md:-mt-20">
            <Avatar className="h-32 w-32 md:h-40 md:w-40 border-4 border-background shadow-lg">
              <AvatarImage src={user.avatar || `https://placehold.co/200x200.png?text=${user.name.charAt(0)}`} alt={user.name} data-ai-hint="person professional"/>
              <AvatarFallback>{user.name.split(" ").map(n=>n[0]).join("").toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="sm:ml-6 mt-4 sm:mt-0 text-center sm:text-left">
             <CardTitle className="text-2xl md:text-3xl">{form.watch("fullName")}</CardTitle>
             <CardDescription className="text-base mt-1">{form.watch("headline")}</CardDescription>
             <p className="text-sm text-muted-foreground mt-1">{form.watch("location")}</p>
             <div className="flex gap-2 mt-2 justify-center sm:justify-start">
                {form.watch("linkedinProfile") && <Button variant="ghost" size="sm" asChild><Link href={form.watch("linkedinProfile")!} target="_blank"><ExternalLink className="h-4 w-4 mr-1"/> LinkedIn</Link></Button>}
                {form.watch("portfolioUrl") && <Button variant="ghost" size="sm" asChild><Link href={form.watch("portfolioUrl")!} target="_blank"><ExternalLink className="h-4 w-4 mr-1"/> Portfolio</Link></Button>}
             </div>
            </div>
          </div>
        </div>
      </Card>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
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
            <CardHeader><CardTitle>Resume</CardTitle><CardDescription>Upload your latest resume. Our AI can help enrich your profile based on it.</CardDescription></CardHeader>
            <CardContent>
               <FormField control={form.control} name="resume" render={({ field: { onChange, value, ...rest } }) => (
                  <FormItem>
                    <FormLabel>Upload Resume (PDF, DOCX)</FormLabel>
                    <div className="flex items-center gap-4">
                      <FormControl><Input type="file" accept=".pdf,.doc,.docx" onChange={(e) => { if (e.target.files && e.target.files.length > 0) { onChange(e.target.files[0]); handleResumeUpload(e.target.files[0]); } }} {...rest} className="flex-grow" disabled={!isEditing || isAiProcessing} /></FormControl>
                       {isAiProcessing && <Loader2 className="h-5 w-5 animate-spin text-primary" />}
                    </div>
                    <FormDescription>{typeof value === 'object' && value?.name ? `Current file: ${value.name}` : "No resume uploaded for this session or AI processing."}</FormDescription><FormMessage />
                  </FormItem>)}/>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader><CardTitle>Professional Summary</CardTitle></CardHeader>
            <CardContent>
              <FormField control={form.control} name="summary" render={({ field }) => (
                  <FormItem><FormControl><Textarea rows={5} {...field} readOnly={!isEditing} placeholder="A brief summary about your professional background, goals, and what you bring to the table..." /></FormControl><FormMessage /></FormItem>)}/>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader><CardTitle>Skills</CardTitle></CardHeader>
            <CardContent>
              {isEditing && (
                 <div className="flex gap-2 mb-4">
                    <Input value={skillsInput} onChange={(e) => setSkillsInput(e.target.value)} placeholder="Add a skill (e.g., Python)" onKeyPress={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill();}}} />
                    <Button type="button" onClick={addSkill} variant="outline">Add</Button>
                  </div>
              )}
              <div className="flex flex-wrap gap-2">
                {form.watch("skills")?.map((skill) => (<Badge key={skill} variant="secondary" className="py-1 px-3 text-sm">{skill}{isEditing && (<button type="button" onClick={() => removeSkill(skill)} className="ml-2 font-bold hover:text-destructive">×</button>)}</Badge>))}
                {form.watch("skills")?.length === 0 && !isEditing && <p className="text-muted-foreground text-sm">No skills added yet. Click 'Edit' to add your skills.</p>}
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Work Experience</CardTitle>
                {isEditing && <Button type="button" variant="outline" size="sm" onClick={() => appendExperience({ title: "", company: "", startDate: "", description: "" })}><PlusCircle className="mr-2 h-4 w-4"/>Add Experience</Button>}
            </CardHeader>
            <CardContent className="space-y-6">
              {experienceFields.map((field, index) => (
                <div key={field.id} className="p-4 border rounded-md space-y-3 relative bg-secondary/30 shadow-sm">
                   {isEditing && <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2 text-destructive hover:bg-destructive/10" onClick={() => removeExperience(index)}><Trash2 className="h-4 w-4"/></Button>}
                  <FormField control={form.control} name={`experience.${index}.title`} render={({ field }) => (<FormItem><FormLabel>Job Title</FormLabel><FormControl><Input {...field} readOnly={!isEditing} /></FormControl><FormMessage /></FormItem>)}/>
                  <FormField control={form.control} name={`experience.${index}.company`} render={({ field }) => (<FormItem><FormLabel>Company</FormLabel><FormControl><Input {...field} readOnly={!isEditing} /></FormControl><FormMessage /></FormItem>)}/>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name={`experience.${index}.startDate`} render={({ field }) => (<FormItem><FormLabel>Start Date</FormLabel><FormControl><Input type={isEditing ? "month": "text"} {...field} readOnly={!isEditing} /></FormControl><FormMessage /></FormItem>)}/>
                    <FormField control={form.control} name={`experience.${index}.endDate`} render={({ field }) => (<FormItem><FormLabel>End Date (or Present)</FormLabel><FormControl><Input type={isEditing ? "month": "text"} {...field} readOnly={!isEditing} placeholder="Present" /></FormControl><FormMessage /></FormItem>)}/>
                  </div>
                  <FormField control={form.control} name={`experience.${index}.description`} render={({ field }) => (<FormItem><FormLabel>Description</FormLabel><FormControl><Textarea {...field} readOnly={!isEditing} rows={3} placeholder="Key responsibilities and achievements..."/></FormControl><FormMessage /></FormItem>)}/>
                </div>
              ))}
               {experienceFields.length === 0 && <p className="text-muted-foreground text-sm">No work experience added yet.</p>}
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Education</CardTitle>
                {isEditing && <Button type="button" variant="outline" size="sm" onClick={() => appendEducation({ institution: "", degree: "", fieldOfStudy: "", graduationDate: "" })}><PlusCircle className="mr-2 h-4 w-4"/>Add Education</Button>}
            </CardHeader>
            <CardContent className="space-y-6">
               {educationFields.map((field, index) => (
                <div key={field.id} className="p-4 border rounded-md space-y-3 relative bg-secondary/30 shadow-sm">
                   {isEditing && <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2 text-destructive hover:bg-destructive/10" onClick={() => removeEducation(index)}><Trash2 className="h-4 w-4"/></Button>}
                  <FormField control={form.control} name={`education.${index}.institution`} render={({ field }) => (<FormItem><FormLabel>Institution</FormLabel><FormControl><Input {...field} readOnly={!isEditing} /></FormControl><FormMessage /></FormItem>)}/>
                  <FormField control={form.control} name={`education.${index}.degree`} render={({ field }) => (<FormItem><FormLabel>Degree</FormLabel><FormControl><Input {...field} readOnly={!isEditing} /></FormControl><FormMessage /></FormItem>)}/>
                  <FormField control={form.control} name={`education.${index}.fieldOfStudy`} render={({ field }) => (<FormItem><FormLabel>Field of Study</FormLabel><FormControl><Input {...field} readOnly={!isEditing} /></FormControl><FormMessage /></FormItem>)}/>
                  <FormField control={form.control} name={`education.${index}.graduationDate`} render={({ field }) => (<FormItem><FormLabel>Graduation Date (or Expected)</FormLabel><FormControl><Input type={isEditing ? "month": "text"} {...field} readOnly={!isEditing} /></FormControl><FormMessage /></FormItem>)}/>
                </div>
              ))}
              {educationFields.length === 0 && <p className="text-muted-foreground text-sm">No education details added yet.</p>}
            </CardContent>
          </Card>

          {isEditing && (
            <CardFooter className="flex justify-end gap-2 pt-8">
              <Button type="button" variant="outline" onClick={() => { setIsEditing(false); if(user) resetFormValues(user); }} disabled={isSubmitting || isAiProcessing}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting || isAiProcessing}>
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
