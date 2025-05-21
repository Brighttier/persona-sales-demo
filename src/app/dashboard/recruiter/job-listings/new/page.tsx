
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Save, Send, FileText } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";

const jobPostingSchema = z.object({
  jobTitle: z.string().min(5, "Job title must be at least 5 characters."),
  department: z.string().min(2, "Department is required."),
  location: z.string().min(2, "Location is required (e.g., City, State or Remote)."),
  jobType: z.enum(["Full-time", "Part-time", "Contract", "Internship"], { required_error: "Job type is required."}),
  salaryRange: z.string().optional(),
  jobDescription: z.string().min(50, "Job description must be at least 50 characters."),
  responsibilities: z.string().min(50, "Responsibilities section must be at least 50 characters. Use bullet points for clarity."),
  qualifications: z.string().min(50, "Qualifications section must be at least 50 characters. Use bullet points for clarity."),
  skills: z.string().optional(),
});

type JobPostingFormValues = z.infer<typeof jobPostingSchema>;

export default function CreateNewJobPage() {
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<JobPostingFormValues>({
    resolver: zodResolver(jobPostingSchema),
    defaultValues: {
      jobTitle: "",
      department: "",
      location: "",
      jobType: undefined,
      salaryRange: "",
      jobDescription: "",
      responsibilities: "- ", // Start with a bullet point
      qualifications: "- ", // Start with a bullet point
      skills: "",
    },
  });

  const handleSaveAsDraft = (data: JobPostingFormValues) => {
    console.log("Save as Draft (Placeholder):", data);
    toast({
      title: "Job Saved as Draft (Placeholder)",
      description: `Job posting "${data.jobTitle}" has been saved as a draft.`,
    });
    // router.push("/dashboard/recruiter/job-listings");
  };

  const handleSubmitForApproval = (data: JobPostingFormValues) => {
    console.log("Submit for Approval (Placeholder):", data);
    toast({
      title: "Job Submitted for Approval (Placeholder)",
      description: `Job posting "${data.jobTitle}" has been submitted for approval.`,
    });
    router.push("/dashboard/recruiter/job-listings");
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
          <CardTitle className="text-2xl flex items-center"><FileText className="mr-2 h-6 w-6 text-primary" /> Create New Job Posting</CardTitle>
          <CardDescription>Fill in the details below to create a new job listing for approval.</CardDescription>
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
                  <FormItem className="md:col-span-2">
                    <FormLabel>Job Title *</FormLabel>
                    <FormControl><Input placeholder="e.g., Senior Software Engineer" {...field} /></FormControl>
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
                  <FormItem>
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
            <CardHeader><CardTitle className="text-lg">Job Details</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="jobDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Job Description *</FormLabel>
                    <FormControl><Textarea placeholder="Provide a compelling overview of the role and company culture..." {...field} rows={6} /></FormControl>
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
                    <FormControl><Textarea placeholder="List the main duties and tasks. Start each with a hyphen (-) for a bullet point." {...field} rows={8} /></FormControl>
                    <FormDescription>Clearly outline what the candidate will be doing.</FormDescription>
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
                    <FormControl><Textarea placeholder="List essential skills, experience, and education. Start each with a hyphen (-)." {...field} rows={8} /></FormControl>
                    <FormDescription>Specify the must-have criteria for candidates.</FormMessage>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="skills"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preferred Skills (Optional)</FormLabel>
                    <FormControl><Textarea placeholder="e.g., Python, Agile Methodologies, Public Speaking..." {...field} rows={3} /></FormControl>
                    <FormDescription>List any desirable but not essential skills.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
          
          <CardFooter className="flex flex-col md:flex-row justify-end gap-3 pt-8 border-t">
            <Button type="button" variant="outline" onClick={() => router.push("/dashboard/recruiter/job-listings")}>
              Cancel
            </Button>
            <Button type="button" variant="secondary" onClick={form.handleSubmit(handleSaveAsDraft)}>
              <Save className="mr-2 h-4 w-4" /> Save as Draft (Placeholder)
            </Button>
            <Button type="button" onClick={form.handleSubmit(handleSubmitForApproval)}>
              <Send className="mr-2 h-4 w-4" /> Submit for Approval (Placeholder)
            </Button>
          </CardFooter>
        </form>
      </Form>
    </div>
  );
}
