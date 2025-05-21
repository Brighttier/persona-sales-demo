
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Save, Bell, Palette, Shield, Zap, Users2, Mail } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";


const generalSettingsSchema = z.object({
  appName: z.string().min(1, "App name is required."),
  defaultLanguage: z.string(),
  maintenanceMode: z.boolean(),
  allowPublicJobBoard: z.boolean(),
  maxResumeFileSizeMB: z.number().min(1).max(20),
});

const notificationSettingsSchema = z.object({
  emailNotifications: z.boolean(),
  newApplicantAlerts: z.boolean(),
  interviewReminders: z.boolean(),
  systemUpdateNotifications: z.boolean(),
});

// Add more schemas for other tabs as needed...

export default function SystemSettingsPage() {
  const { toast } = useToast();

  const generalForm = useForm<z.infer<typeof generalSettingsSchema>>({
    resolver: zodResolver(generalSettingsSchema),
    defaultValues: {
      appName: "TalentVerse AI",
      defaultLanguage: "en",
      maintenanceMode: false,
      allowPublicJobBoard: true,
      maxResumeFileSizeMB: 5,
    },
  });

  const notificationForm = useForm<z.infer<typeof notificationSettingsSchema>>({
    resolver: zodResolver(notificationSettingsSchema),
    defaultValues: {
      emailNotifications: true,
      newApplicantAlerts: true,
      interviewReminders: true,
      systemUpdateNotifications: false,
    },
  });
  
  function onGeneralSubmit(values: z.infer<typeof generalSettingsSchema>) {
    console.log("General Settings Saved:", values);
    toast({ title: "General Settings Saved", description: "Your changes have been applied." });
  }

  function onNotificationSubmit(values: z.infer<typeof notificationSettingsSchema>) {
    console.log("Notification Settings Saved:", values);
    toast({ title: "Notification Settings Saved", description: "Your preferences have been updated." });
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-2xl">System Settings & Configuration</CardTitle>
          <CardDescription>Manage global settings for the TalentVerse AI platform.</CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-5 mb-6">
          <TabsTrigger value="general"><Palette className="mr-2 h-4 w-4"/>General</TabsTrigger>
          <TabsTrigger value="notifications"><Bell className="mr-2 h-4 w-4"/>Notifications</TabsTrigger>
          <TabsTrigger value="security" disabled><Shield className="mr-2 h-4 w-4"/>Security (Placeholder)</TabsTrigger>
          <TabsTrigger value="integrations" disabled><Zap className="mr-2 h-4 w-4"/>Integrations (Placeholder)</TabsTrigger>
          <TabsTrigger value="user_roles" disabled><Users2 className="mr-2 h-4 w-4"/>User Roles (Placeholder)</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
             <Form {...generalForm}>
                <form onSubmit={generalForm.handleSubmit(onGeneralSubmit)}>
                    <CardHeader>
                        <CardTitle>General Settings</CardTitle>
                        <CardDescription>Configure basic application settings.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <FormField control={generalForm.control} name="appName" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Application Name</FormLabel>
                                <FormControl><Input {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}/>
                        <FormField control={generalForm.control} name="defaultLanguage" render={({ field }) => (
                             <FormItem>
                                <FormLabel>Default Language</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl><SelectTrigger><SelectValue placeholder="Select language" /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        <SelectItem value="en">English</SelectItem>
                                        <SelectItem value="es" disabled>Español (Coming Soon)</SelectItem>
                                        <SelectItem value="fr" disabled>Français (Coming Soon)</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}/>
                         <FormField control={generalForm.control} name="maxResumeFileSizeMB" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Max Resume File Size (MB)</FormLabel>
                                <FormControl><Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} /></FormControl>
                                <FormDescription>Maximum allowed file size for resume uploads.</FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}/>
                        <FormField control={generalForm.control} name="maintenanceMode" render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                    <FormLabel className="text-base">Maintenance Mode</FormLabel>
                                    <FormDescription>Temporarily disable access for users (except admins).</FormDescription>
                                </div>
                                <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                            </FormItem>
                        )}/>
                        <FormField control={generalForm.control} name="allowPublicJobBoard" render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                    <FormLabel className="text-base">Enable Public Job Board</FormLabel>
                                    <FormDescription>Allow non-logged-in users to view job listings.</FormDescription>
                                </div>
                                <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                            </FormItem>
                        )}/>
                    </CardContent>
                    <CardFooter className="border-t pt-6">
                        <Button type="submit"><Save className="mr-2 h-4 w-4"/> Save General Settings</Button>
                    </CardFooter>
                </form>
             </Form>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
           <Card>
             <Form {...notificationForm}>
                <form onSubmit={notificationForm.handleSubmit(onNotificationSubmit)}>
                    <CardHeader>
                        <CardTitle>Notification Settings</CardTitle>
                        <CardDescription>Manage how users receive notifications.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <FormField control={notificationForm.control} name="emailNotifications" render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                    <FormLabel className="text-base">Global Email Notifications</FormLabel>
                                    <FormDescription>Enable or disable all email notifications system-wide.</FormDescription>
                                </div>
                                <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                            </FormItem>
                        )}/>
                        <FormField control={notificationForm.control} name="newApplicantAlerts" render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                    <FormLabel className="text-base">New Applicant Alerts for Recruiters</FormLabel>
                                    <FormDescription>Notify recruiters when a new candidate applies.</FormDescription>
                                </div>
                                <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} disabled={!notificationForm.getValues("emailNotifications")} /></FormControl>
                            </FormItem>
                        )}/>
                        <FormField control={notificationForm.control} name="interviewReminders" render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                    <FormLabel className="text-base">Interview Reminders for Candidates & Interviewers</FormLabel>
                                    <FormDescription>Send reminders for scheduled interviews.</FormDescription>
                                </div>
                                <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} disabled={!notificationForm.getValues("emailNotifications")} /></FormControl>
                            </FormItem>
                        )}/>
                         <FormField control={notificationForm.control} name="systemUpdateNotifications" render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                    <FormLabel className="text-base">System Update Notifications</FormLabel>
                                    <FormDescription>Inform users about new features or important system updates.</FormDescription>
                                </div>
                                <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                            </FormItem>
                        )}/>
                    </CardContent>
                    <CardFooter className="border-t pt-6">
                        <Button type="submit"><Save className="mr-2 h-4 w-4"/> Save Notification Settings</Button>
                    </CardFooter>
                </form>
             </Form>
          </Card>
        </TabsContent>
        
        {/* Placeholder for other tabs */}
        <TabsContent value="security">
            <Card><CardHeader><CardTitle>Security Settings</CardTitle><CardDescription>Coming soon.</CardDescription></CardHeader><CardContent><p>Configure password policies, 2FA, audit logs, etc.</p></CardContent></Card>
        </TabsContent>
        <TabsContent value="integrations">
            <Card><CardHeader><CardTitle>Integrations</CardTitle><CardDescription>Coming soon.</CardDescription></CardHeader><CardContent><p>Manage integrations with third-party services like calendars, HRIS, etc.</p></CardContent></Card>
        </TabsContent>
        <TabsContent value="user_roles">
            <Card><CardHeader><CardTitle>User Roles & Permissions</CardTitle><CardDescription>Coming soon.</CardDescription></CardHeader><CardContent><p>Define and customize user roles and their permissions.</p></CardContent></Card>
        </TabsContent>

      </Tabs>
    </div>
  );
}
