
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Save, Send, FileText, WandSparkles, Loader2, Trash2, Briefcase } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { generateJobPostingDetails, type GenerateJobPostingOutput } from "@/ai/flows/generate-job-posting-flow";

const jobPostingSchema = z.object({
  jobTitle: z.string().min(5, "Job title must be at least 5 characters."),
  company: z.string().min(1, "Company name is required."),
  department: z.string().min(2, "Department is required."),
  location: z.string().min(2, "Location is required (e.g., City, State or Remote)."),
  experienceRequired: z.string().min(1, "Experience level is required (e.g., 3+ Years, Senior Level)."),
  jobType: z.enum(["Full-time", "Part-time", "Contract", "Internship"], { required_error: "Job type is required."}),
  salaryRange: z.string().optional(),
  jobDescription: z.string().min(10, "Job description should be at least 10 characters. AI can help generate more.").optional(),
  responsibilities: z.string().min(10, "Responsibilities section should be at least 10 characters. AI can help generate more.").optional(),
  qualifications: z.string().min(10, "Qualifications section should be at least 10 characters. AI can help generate more.").optional(),
  skills: z.array(z.string()).optional(),
  companyBenefits: z.string().min(10, "Company benefits section should be at least 10 characters. AI can help generate more.").optional(),
});

type JobPostingFormValues = z.infer<typeof jobPostingSchema>;

export default function RecruiterCreateNewJobPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [skillsInput, setSkillsInput] = useState("");

  const form = useForm<JobPostingFormValues>({
    resolver: zodResolver(jobPostingSchema),
    defaultValues: {
      jobTitle: "",
      company: "", 
      department: "",
      location: "",
      experienceRequired: "",
      jobType: undefined,
      salaryRange: "",
      jobDescription: "",
      responsibilities: "• ",
      qualifications: "• ",
      skills: [],
      companyBenefits: "• ",
    },
  });

  const handleSaveAsDraft = (data: JobPostingFormValues) => {
    console.log("Save as Draft (Placeholder by Recruiter):", data);
    toast({
      title: "Job Saved as Draft (Placeholder)",
      description: `Job posting "${data.jobTitle}" has been saved as a draft by Recruiter.`,
    });
  };

  const handlePublishJob = (data: JobPostingFormValues) => {
    console.log("Publish Job (Placeholder by Recruiter):", data);
    toast({
      title: "Job Published (Placeholder)",
      description: `Job posting "${data.jobTitle}" has been published.`,
    });
    router.push("/dashboard/recruiter/job-listings");
  };

  const handleGenerateWithAI = async () => {
    const jobTitle = form.getValues("jobTitle");
    const company = form.getValues("company");
    const experienceRequired = form.getValues("experienceRequired");
    const location = form.getValues("location");

    if (!jobTitle) {
      toast({
        variant: "destructive",
        title: "Job Title Required",
        description: "Please enter a job title before generating with AI.",
      });
      return;
    }

    setIsAiGenerating(true);
    toast({ title: "AI is Generating...", description: "Please wait while Persona AI drafts the job details." });

    try {
      const result: GenerateJobPostingOutput = await generateJobPostingDetails({
        jobTitle,
        company: company || undefined,
        experienceRequired: experienceRequired || undefined,
        location: location || undefined,
      });

      form.setValue("jobDescription", result.jobDescription, { shouldValidate: true });
      form.setValue("responsibilities", result.responsibilities, { shouldValidate: true });
      form.setValue("qualifications", result.qualifications, { shouldValidate: true });
      form.setValue("skills", result.skills || [], { shouldValidate: true });
      form.setValue("companyBenefits", result.companyBenefits || "• ", { shouldValidate: true });

      toast({ title: "AI Generation Complete!", description: "Job details have been populated." });
    } catch (error) {
      console.error("AI Generation Error:", error);
      toast({
        variant: "destructive",
        title: "AI Generation Failed",
        description: "Could not generate job details. Please try again or fill them manually.",
      });
    } finally {
      setIsAiGenerating(false);
    }
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

  const handleBulletTextareaKeyDown = (
    event: React.KeyboardEvent<HTMLTextAreaElement>,
    field: any 
  ) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      const target = event.target as HTMLTextAreaElement;
      const { selectionStart, selectionEnd, value } = target;
      const textToInsert = value.substring(0, selectionStart).trim() === "" || value.substring(selectionStart-1, selectionStart) === "\n" ? "• " : "\n• ";

      const newValue = `${value.substring(0, selectionStart)}${textToInsert}${value.substring(selectionEnd)}`;
      field.onChange(newValue);

      setTimeout(() => {
        target.selectionStart = selectionStart + textToInsert.length;
        target.selectionEnd = selectionStart + textToInsert.length;
      }, 0);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-start">
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/recruiter/job-listings">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Job Listings
          </Link>
        </Button>
      </div>

      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center"><Briefcase className="mr-2 h-6 w-6 text-primary" /> Recruiter: Define New Job Posting</CardTitle>
          <CardDescription>As a Recruiter, outline the details for the new role. AI can help generate content.</CardDescription>
        </CardHeader>
      </Card>

      <Form {...form}>
        <form className="space-y-8">
          <Card className="shadow-lg">
            <CardHeader><CardTitle className="text-lg">Job Overview</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="jobTitle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Job Title *</FormLabel>
                    <FormControl><Input placeholder="e.g., Senior Software Engineer" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="company"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Name *</FormLabel>
                    <FormControl><Input placeholder="e.g., Persona AI Inc." {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="department"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Department *</FormLabel>
                    <FormControl><Input placeholder="e.g., Engineering" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location *</FormLabel>
                    <FormControl><Input placeholder="e.g., San Francisco, CA or Remote" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="experienceRequired"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Experience Required *</FormLabel>
                    <FormControl><Input placeholder="e.g., 5+ Years, Senior Level, Entry Level" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="jobType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Job Type *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select job type" /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="Full-time">Full-time</SelectItem>
                        <SelectItem value="Part-time">Part-time</SelectItem>
                        <SelectItem value="Contract">Contract</SelectItem>
                        <SelectItem value="Internship">Internship</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="salaryRange"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Salary Range (Optional)</FormLabel>
                    <FormControl><Input placeholder="e.g., $100,000 - $120,000 per year" {...field} /></FormControl>
                    <FormDescription>Provide an estimated salary range for this role.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader className="flex flex-row justify-between items-center">
                <CardTitle className="text-lg">Job Details</CardTitle>
                <Button type="button" variant="outline" onClick={handleGenerateWithAI} disabled={isAiGenerating}>
                    {isAiGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <WandSparkles className="mr-2 h-4 w-4 text-accent"/>}
                    Generate with AI
                </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="jobDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Job Description *</FormLabel>
                    <FormControl><Textarea placeholder="A compelling overview of the role and company (4-5 lines recommended)... AI can help!" {...field} rows={5} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="responsibilities"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Key Responsibilities *</FormLabel>
                    <FormControl><Textarea
                        placeholder="List main duties (7-15 bullet points recommended). Start each with '• '... AI can help!"
                        {...field}
                        rows={10}
                        onKeyDown={(e) => handleBulletTextareaKeyDown(e, field)}
                    /></FormControl>
                    <FormDescription>Clearly outline what the candidate will be doing. Press Enter for new bullet point.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="qualifications"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Required Qualifications & Experience *</FormLabel>
                    <FormControl><Textarea
                        placeholder="List essential skills, experience, and education (5-10 bullet points recommended). Start each with '• '... AI can help!"
                        {...field}
                        rows={10}
                        onKeyDown={(e) => handleBulletTextareaKeyDown(e, field)}
                    /></FormControl>
                    <FormDescription>Specify the must-have criteria for candidates. Press Enter for new bullet point.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="skills"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preferred Skills (AI can help populate this)</FormLabel>
                    <div className="flex gap-2 items-center mb-2">
                      <Input
                        value={skillsInput}
                        onChange={(e) => setSkillsInput(e.target.value)}
                        placeholder="Type a skill and press Add"
                        onKeyPress={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill();}}}
                        className="flex-grow"
                      />
                      <Button type="button" variant="outline" onClick={addSkill}>Add Skill</Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {(field.value || []).map((skill) => (
                        <Badge key={skill} variant="default" className="py-1 px-3 text-sm bg-primary text-primary-foreground">
                          {skill}
                          <button type="button" onClick={() => removeSkill(skill)} className="ml-2 hover:text-primary-foreground/80">
                            <Trash2 className="h-3 w-3"/>
                          </button>
                        </Badge>
                      ))}
                       {(!field.value || field.value.length === 0) && <p className="text-xs text-muted-foreground">No skills added yet.</p>}
                    </div>
                    <FormDescription>List any desirable but not essential skills. AI can suggest these.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="companyBenefits"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Benefits (AI can help generate some)</FormLabel>
                    <FormControl><Textarea
                        placeholder="List company benefits (e.g., Health Insurance, 401k, Paid Time Off). Start each with '• '... AI can help!"
                        {...field}
                        rows={7}
                        onKeyDown={(e) => handleBulletTextareaKeyDown(e, field)}
                    /></FormControl>
                    <FormDescription>Outline the benefits provided by the company. Press Enter for new bullet point.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <CardFooter className="flex flex-col md:flex-row justify-end gap-3 pt-8 border-t">
            <Button type="button" variant="outline" onClick={() => router.push("/dashboard/recruiter/job-listings")} disabled={isAiGenerating}>
              Cancel
            </Button>
            <Button type="button" variant="secondary" onClick={form.handleSubmit(handleSaveAsDraft)} disabled={isAiGenerating}>
              <Save className="mr-2 h-4 w-4" /> Save as Draft
            </Button>
            <Button type="button" onClick={form.handleSubmit(handlePublishJob)} disabled={isAiGenerating}>
              <Send className="mr-2 h-4 w-4" /> Publish Job
            </Button>
          </CardFooter>
        </form>
      </Form>
    </div>
  );
}

    