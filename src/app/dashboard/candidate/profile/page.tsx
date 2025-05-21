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
import { Edit3, FileUp, Loader2, Save, Share2, VenetianMask } from "lucide-react";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
// Placeholder for AI flow import
// import { enrichProfile, type EnrichProfileOutput } from "@/ai/flows/profile-enrichment";

const profileFormSchema = z.object({
  fullName: z.string().min(2, "Full name is required."),
  email: z.string().email(),
  phone: z.string().optional(),
  location: z.string().optional(),
  headline: z.string().optional(), // e.g., "Senior Software Engineer at Tech Corp"
  summary: z.string().optional(),
  skills: z.array(z.string()).optional(), // Will be an array of strings
  experience: z.array(z.object({
    title: z.string(),
    company: z.string(),
    startDate: z.string(),
    endDate: z.string().optional(),
    description: z.string().optional(),
  })).optional(),
  education: z.array(z.object({
    institution: z.string(),
    degree: z.string(),
    fieldOfStudy: z.string(),
    graduationDate: z.string().optional(),
  })).optional(),
  resume: z.any().optional(), // For file upload
  linkedinProfile: z.string().url("Invalid LinkedIn URL").optional(),
  portfolioUrl: z.string().url("Invalid portfolio URL").optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

interface EnrichedData {
  skills: string[];
  experienceSummary: string;
}

export default function CandidateProfilePage() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [enrichedData, setEnrichedData] = useState<EnrichedData | null>(null);
  const [skillsInput, setSkillsInput] = useState("");


  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      fullName: user?.name || "",
      email: user?.email || "",
      skills: [],
      experience: [],
      education: [],
    },
  });

  useEffect(() => {
    if (user) {
      form.reset({
        fullName: user.name,
        email: user.email,
        // Mock data for other fields until actual data source
        headline: "Aspiring Software Innovator",
        summary: "Passionate about creating impactful technology solutions. Eager to learn and contribute to a dynamic team.",
        skills: ["JavaScript", "React", "Node.js"],
        experience: [{ title: "Intern", company: "Tech Startup", startDate: "2023-06-01", endDate: "2023-08-31", description: "Assisted senior developers..."}],
        education: [{institution: "State University", degree: "BSc", fieldOfStudy: "Computer Science", graduationDate: "2024-05-01"}],
        location: "Anytown, USA",
      });
    }
  }, [user, form]);
  
  useEffect(() => {
    if (enrichedData?.skills) {
      const currentSkills = form.getValues("skills") || [];
      const newSkills = Array.from(new Set([...currentSkills, ...enrichedData.skills]));
      form.setValue("skills", newSkills);
    }
    if (enrichedData?.experienceSummary && !form.getValues("summary")) { // only set if summary is empty
        form.setValue("summary", enrichedData.experienceSummary);
    }
  }, [enrichedData, form]);


  const handleResumeUpload = async (file: File) => {
    setIsSubmitting(true); // Use submitting state for loader on AI processing
    toast({
      title: "Processing Resume with AI...",
      description: "Extracting skills and summarizing experience.",
    });
    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = async () => {
        const resumeDataUri = reader.result as string;
        // const result = await enrichProfile({ resumeDataUri }); // AI Call
        // Mocking AI call result
        await new Promise(resolve => setTimeout(resolve, 2000));
        const result: EnrichedData = {
            skills: ["AI Extracted Skill 1", "Python", "Machine Learning"],
            experienceSummary: "AI summarized experience: Successfully led multiple projects, demonstrating strong leadership and technical expertise in software development over 5 years."
        };

        setEnrichedData(result);
        toast({ title: "Profile Enriched by AI!", description: "Skills and summary updated from your resume." });
      };
    } catch (error) {
      console.error("Error enriching profile:", error);
      toast({ variant: "destructive", title: "AI Enrichment Failed", description: "Could not process your resume." });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const onSubmit = async (data: ProfileFormValues) => {
    setIsSubmitting(true);
    console.log("Profile Data:", data);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsSubmitting(false);
    setIsEditing(false);
    toast({
      title: "Profile Updated!",
      description: "Your profile information has been saved.",
    });
  };

  const addSkill = () => {
    if (skillsInput.trim() !== "") {
      const currentSkills = form.getValues("skills") || [];
      if (!currentSkills.includes(skillsInput.trim())) {
        form.setValue("skills", [...currentSkills, skillsInput.trim()]);
      }
      setSkillsInput("");
    }
  };

  const removeSkill = (skillToRemove: string) => {
    const currentSkills = form.getValues("skills") || [];
    form.setValue("skills", currentSkills.filter(skill => skill !== skillToRemove));
  };


  if (authLoading || !user) {
    return <div className="flex h-screen items-center justify-center"><p>Loading profile...</p></div>;
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-primary to-primary/70 h-32 md:h-40 relative">
           <Button 
              variant="outline" 
              size="icon" 
              className="absolute top-4 right-4 bg-background/80 hover:bg-background"
              onClick={() => setIsEditing(!isEditing)}
            >
              {isEditing ? <Save className="h-5 w-5" /> : <Edit3 className="h-5 w-5" />}
            </Button>
        </div>
        <div className="px-6 pb-6">
          <div className="flex justify-center md:justify-start -mt-16 md:-mt-20">
            <Avatar className="h-32 w-32 md:h-40 md:w-40 border-4 border-background shadow-lg">
              <AvatarImage src={user.avatar || `https://placehold.co/200x200.png`} alt={user.name} data-ai-hint="person professional" />
              <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
          </div>
           <div className="pt-4 md:pt-2 md:ml-44 text-center md:text-left">
             <CardTitle className="text-2xl md:text-3xl">{form.watch("fullName")}</CardTitle>
             <CardDescription className="text-base">{form.watch("headline")}</CardDescription>
             <p className="text-sm text-muted-foreground mt-1">{form.watch("location")}</p>
          </div>
        </div>
      </Card>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField control={form.control} name="fullName" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl><Input {...field} readOnly={!isEditing} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl><Input type="email" {...field} readOnly /></FormControl> {/* Email usually not editable by user */}
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField control={form.control} name="phone" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl><Input {...field} readOnly={!isEditing} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField control={form.control} name="location" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl><Input {...field} readOnly={!isEditing} placeholder="e.g., San Francisco, CA" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField control={form.control} name="headline" render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Headline</FormLabel>
                    <FormControl><Input {...field} readOnly={!isEditing} placeholder="e.g., Senior Software Engineer | AI Enthusiast" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Resume & Online Presence</CardTitle>
               <CardDescription>Upload your latest resume. Our AI can help enrich your profile based on it.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
               <FormField
                control={form.control}
                name="resume"
                render={({ field: { onChange, value, ...rest } }) => (
                  <FormItem>
                    <FormLabel>Upload Resume (PDF, DOC, DOCX)</FormLabel>
                    <div className="flex items-center gap-4">
                      <FormControl>
                        <Input 
                          type="file" 
                          accept=".pdf,.doc,.docx" 
                          onChange={(e) => {
                            if (e.target.files && e.target.files.length > 0) {
                              onChange(e.target.files[0]); // Store file object
                              handleResumeUpload(e.target.files[0]);
                            }
                          }}
                          {...rest}
                          className="flex-grow"
                          disabled={!isEditing || isSubmitting}
                        />
                      </FormControl>
                       {isSubmitting && <Loader2 className="h-5 w-5 animate-spin text-primary" />}
                    </div>
                     <FormDescription>
                      {value?.name ? `Current file: ${value.name}` : "No resume uploaded yet."}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField control={form.control} name="linkedinProfile" render={({ field }) => (
                  <FormItem>
                    <FormLabel>LinkedIn Profile URL</FormLabel>
                    <FormControl><Input {...field} readOnly={!isEditing} placeholder="https://linkedin.com/in/yourprofile" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField control={form.control} name="portfolioUrl" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Portfolio/Website URL</FormLabel>
                    <FormControl><Input {...field} readOnly={!isEditing} placeholder="https://yourportfolio.com" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Summary</CardTitle></CardHeader>
            <CardContent>
              <FormField control={form.control} name="summary" render={({ field }) => (
                  <FormItem>
                    <FormControl><Textarea rows={5} {...field} readOnly={!isEditing} placeholder="A brief summary about your professional background..." /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Skills</CardTitle></CardHeader>
            <CardContent>
              {isEditing && (
                 <div className="flex gap-2 mb-4">
                    <Input 
                      value={skillsInput}
                      onChange={(e) => setSkillsInput(e.target.value)}
                      placeholder="Add a skill (e.g., Python)"
                      onKeyPress={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill();}}}
                    />
                    <Button type="button" onClick={addSkill}>Add Skill</Button>
                  </div>
              )}
              <div className="flex flex-wrap gap-2">
                {form.watch("skills")?.map((skill) => (
                  <Badge key={skill} variant="secondary" className="py-1 px-3 text-sm">
                    {skill}
                    {isEditing && (
                      <button type="button" onClick={() => removeSkill(skill)} className="ml-2 font-bold hover:text-destructive">×</button>
                    )}
                  </Badge>
                ))}
                {form.watch("skills")?.length === 0 && !isEditing && <p className="text-muted-foreground">No skills added yet.</p>}
              </div>
            </CardContent>
          </Card>
          
          {/* Experience and Education sections would be more complex, involving dynamic arrays of fields. 
              For brevity, these are simplified or shown as display-only for now.
              Full form controls for these would use react-hook-form's useFieldArray.
          */}
           <Card>
            <CardHeader><CardTitle>Work Experience</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {form.watch("experience")?.map((exp, index) => (
                <div key={index} className="border-b pb-2 mb-2">
                  <h4 className="font-semibold">{exp.title} at {exp.company}</h4>
                  <p className="text-sm text-muted-foreground">{exp.startDate} - {exp.endDate || 'Present'}</p>
                  {isEditing ? <Textarea defaultValue={exp.description} placeholder="Role description..." className="mt-1"/> : <p className="text-sm mt-1">{exp.description}</p>}
                </div>
              ))}
               {form.watch("experience")?.length === 0 && <p className="text-muted-foreground">No experience added yet.</p>}
               {isEditing && <Button type="button" variant="outline" size="sm" className="mt-2">Add Experience (UI Placeholder)</Button>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Education</CardTitle></CardHeader>
            <CardContent className="space-y-4">
               {form.watch("education")?.map((edu, index) => (
                <div key={index} className="border-b pb-2 mb-2">
                  <h4 className="font-semibold">{edu.degree} in {edu.fieldOfStudy}</h4>
                  <p className="text-sm text-muted-foreground">{edu.institution} ({edu.graduationDate || 'Expected'})</p>
                </div>
              ))}
              {form.watch("education")?.length === 0 && <p className="text-muted-foreground">No education added yet.</p>}
              {isEditing && <Button type="button" variant="outline" size="sm" className="mt-2">Add Education (UI Placeholder)</Button>}
            </CardContent>
          </Card>

          {isEditing && (
            <CardFooter className="flex justify-end gap-2 pt-8">
              <Button type="button" variant="outline" onClick={() => { setIsEditing(false); form.reset(); /* TODO: Reset to original fetched data */ }}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>
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
