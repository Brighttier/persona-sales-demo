
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { CalendarIcon, Download, FileText, Filter, PlayCircle, Settings, BarChartHorizontalBig, Eye } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { cn } from "@/lib/utils";

const reportFormSchema = z.object({
  reportType: z.string().min(1, "Report type is required."),
  dateFrom: z.date().optional(),
  dateTo: z.date().optional(),
  filterUserRole: z.string().optional(),
  filterCompany: z.string().optional(),
  filterJobStatus: z.string().optional(),
});

type ReportFormValues = z.infer<typeof reportFormSchema>;

const mockSavedReports = [
  { id: "rep1", name: "Monthly User Activity - July 2024", dateGenerated: "2024-08-01", type: "User Activity" },
  { id: "rep2", name: "Q2 Hiring Pipeline Summary", dateGenerated: "2024-07-05", type: "Hiring Pipeline" },
  { id: "rep3", name: "Annual Financial Overview 2023", dateGenerated: "2024-01-15", type: "Financial Summary" },
];

export default function AdminReportsPage() {
  const { toast } = useToast();
  const [generatedReportContent, setGeneratedReportContent] = useState<string | null>(null);

  const form = useForm<ReportFormValues>({
    resolver: zodResolver(reportFormSchema),
    defaultValues: {
      reportType: "",
      filterUserRole: "all",
      filterCompany: "all",
      filterJobStatus: "all",
    },
  });

  const onGenerateReport = (data: ReportFormValues) => {
    console.log("Generate Report (Placeholder):", data);
    // Simulate report generation
    setGeneratedReportContent(`Report Type: ${data.reportType}\nDate Range: ${data.dateFrom ? format(data.dateFrom, "PPP") : "N/A"} - ${data.dateTo ? format(data.dateTo, "PPP") : "N/A"}\nFilters: User Role - ${data.filterUserRole}, Company - ${data.filterCompany}, Job Status - ${data.filterJobStatus}\n\nThis is placeholder report data. Actual report content would be generated and displayed here based on selections. It might include tables, charts, and summaries.`);
    toast({
      title: "Report Generation Started (Placeholder)",
      description: `Generating "${data.reportType}" report. This is a placeholder action.`,
    });
  };

  const handleDownloadReport = () => {
    toast({
      title: "Download Report (Placeholder)",
      description: "Report download would start here. This is a placeholder.",
    });
  }

  return (
    <div className="space-y-8">
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center">
            <BarChartHorizontalBig className="mr-2 h-6 w-6 text-primary" /> System Reports & Analytics
          </CardTitle>
          <CardDescription>
            Generate, view, and manage various reports and analytics across the TalentVerse AI platform.
          </CardDescription>
        </CardHeader>
      </Card>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onGenerateReport)}>
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg">Report Configuration</CardTitle>
              <CardDescription>Select criteria to generate your desired report or analysis.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <FormField
                control={form.control}
                name="reportType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Report/Analytics Type *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a report type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="user_activity">User Activity Report</SelectItem>
                        <SelectItem value="hiring_pipeline">Hiring Pipeline Analysis</SelectItem>
                        <SelectItem value="financial_summary">Financial Summary</SelectItem>
                        <SelectItem value="system_health">System Health & Performance</SelectItem>
                        <SelectItem value="company_engagement">Company Engagement Metrics</SelectItem>
                        <SelectItem value="ai_usage_stats">AI Feature Usage Statistics</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dateFrom"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Date From</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dateTo"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Date To</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="filterUserRole"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center"><Filter className="mr-1 h-3 w-3"/> Filter by User Role</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="All Roles" /></SelectTrigger></FormControl>
                        <SelectContent>
                            <SelectItem value="all">All Roles</SelectItem>
                            <SelectItem value="candidate">Candidate</SelectItem>
                            <SelectItem value="recruiter">Recruiter</SelectItem>
                            <SelectItem value="hiring-manager">Hiring Manager</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="filterCompany"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center"><Filter className="mr-1 h-3 w-3"/> Filter by Company (ID/Name)</FormLabel>
                    <FormControl><Input placeholder="All Companies or Enter ID/Name" {...field} /></FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="filterJobStatus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center"><Filter className="mr-1 h-3 w-3"/> Filter by Job Status</FormLabel>
                     <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="All Statuses" /></SelectTrigger></FormControl>
                        <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="paused">Paused</SelectItem>
                            <SelectItem value="closed">Closed</SelectItem>
                            <SelectItem value="draft">Draft</SelectItem>
                        </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className="border-t pt-6">
              <Button type="submit" size="lg">
                <PlayCircle className="mr-2 h-5 w-5" /> Generate Report / Analysis
              </Button>
            </CardFooter>
          </Card>
        </form>
      </Form>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg">Report / Analytics Preview</CardTitle>
          <CardDescription>The generated content will be displayed below. This may include data tables, charts, or summaries.</CardDescription>
        </CardHeader>
        <CardContent className="min-h-[200px] border rounded-md p-4 bg-muted/50">
          {generatedReportContent ? (
            <pre className="text-sm whitespace-pre-wrap">{generatedReportContent}</pre>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <FileText className="h-12 w-12 mb-2" />
              <p>Configure and generate a report or analysis to see a preview here.</p>
              <p className="text-xs mt-1">For enterprise needs, complex data will be visualized appropriately.</p>
            </div>
          )}
        </CardContent>
        <CardFooter className="border-t pt-6">
          <Button variant="outline" onClick={handleDownloadReport} disabled={!generatedReportContent}>
            <Download className="mr-2 h-4 w-4" /> Download (PDF/CSV)
          </Button>
        </CardFooter>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg">Saved Reports & Analyses</CardTitle>
          <CardDescription>Access previously generated reports and analytical views.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Report Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Date Generated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockSavedReports.map((report) => (
                <TableRow key={report.id}>
                  <TableCell className="font-medium">{report.name}</TableCell>
                  <TableCell>{report.type}</TableCell>
                  <TableCell>{report.dateGenerated}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => toast({ title: "View Report (Placeholder)", description: `Viewing ${report.name}`})}>
                      <Eye className="mr-1 h-4 w-4" /> View
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => toast({ title: "Download Report (Placeholder)", description: `Downloading ${report.name}`})}>
                      <Download className="mr-1 h-4 w-4" /> Download
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {mockSavedReports.length === 0 && (
                 <TableRow><TableCell colSpan={4} className="h-24 text-center text-muted-foreground">No saved reports or analyses found.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

    