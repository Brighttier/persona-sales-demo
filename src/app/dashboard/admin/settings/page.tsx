
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Save, Bell, Palette, Shield, Zap, Users2, Link2, KeyRound, ListChecks } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel as RHFFormLabel, FormMessage, FormDescription as RHFFormDescription } from "@/components/ui/form"; // Renamed to avoid conflict
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";


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

const securitySettingsSchema = z.object({
  passwordMinLength: z.number().min(8).max(32),
  passwordRequireUppercase: z.boolean(),
  passwordRequireNumber: z.boolean(),
  passwordRequireSpecialChar: z.boolean(),
  enable2FA: z.boolean(),
  auditLogRetentionDays: z.enum(["30", "90", "180", "365"]),
});

// Mock data for User Roles tab
const mockUserRoles = [
  { id: "admin", name: "Administrator", description: "Full access to all system features and settings." },
  { id: "recruiter", name: "Recruiter", description: "Manages job listings, candidates, and screening." },
  { id: "hiring-manager", name: "Hiring Manager", description: "Reviews candidates, approves jobs, and manages interviews for their team." },
  { id: "candidate", name: "Candidate", description: "Applies for jobs, manages profile, and tracks applications." },
];


export default function SystemSettingsPage() {
  const { toast } = useToast();

  const generalForm = useForm<z.infer<typeof generalSettingsSchema>>({
    resolver: zodResolver(generalSettingsSchema),
    defaultValues: {
      appName: "Persona AI",
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

  const securityForm = useForm<z.infer<typeof securitySettingsSchema>>({
    resolver: zodResolver(securitySettingsSchema),
    defaultValues: {
      passwordMinLength: 10,
      passwordRequireUppercase: true,
      passwordRequireNumber: true,
      passwordRequireSpecialChar: false,
      enable2FA: false,
      auditLogRetentionDays: "90",
    },
  });
  
  function onGeneralSubmit(values: z.infer<typeof generalSettingsSchema>) {
    console.log("General Settings Saved (Placeholder):", values);
    toast({ title: "General Settings Saved", description: "Your changes have been applied. (Placeholder)" });
  }

  function onNotificationSubmit(values: z.infer<typeof notificationSettingsSchema>) {
    console.log("Notification Settings Saved (Placeholder):", values);
    toast({ title: "Notification Settings Saved", description: "Your preferences have been updated. (Placeholder)" });
  }

  function onSecuritySubmit(values: z.infer<typeof securitySettingsSchema>) {
    console.log("Security Settings Saved (Placeholder):", values);
    toast({ title: "Security Settings Saved", description: "Security configurations updated. (Placeholder)" });
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl">System Settings & Configuration</CardTitle>
          <CardDescription>Manage global settings for the Persona AI platform.</CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-5 mb-6">
          <TabsTrigger value="general"><Palette className="mr-2 h-4 w-4"/>General</TabsTrigger>
          <TabsTrigger value="notifications"><Bell className="mr-2 h-4 w-4"/>Notifications</TabsTrigger>
          <TabsTrigger value="security"><Shield className="mr-2 h-4 w-4"/>Security</TabsTrigger>
          <TabsTrigger value="integrations"><Zap className="mr-2 h-4 w-4"/>Integrations</TabsTrigger>
          <TabsTrigger value="user_roles"><Users2 className="mr-2 h-4 w-4"/>User Roles</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card className="shadow-lg">
             <Form {...generalForm}>
                <form onSubmit={generalForm.handleSubmit(onGeneralSubmit)}>
                    <CardHeader>
                        <CardTitle>General Settings</CardTitle>
                        <CardDescription>Configure basic application settings.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <FormField control={generalForm.control} name="appName" render={({ field }) => (
                            <FormItem>
                                <RHFFormLabel>Application Name</RHFFormLabel>
                                <FormControl><Input {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}/>
                        <FormField control={generalForm.control} name="defaultLanguage" render={({ field }) => (
                             <FormItem>
                                <RHFFormLabel>Default Language</RHFFormLabel>
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
                                <RHFFormLabel>Max Resume File Size (MB)</RHFFormLabel>
                                <FormControl><Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} /></FormControl>
                                <RHFFormDescription>Maximum allowed file size for resume uploads.</RHFFormDescription>
                                <FormMessage />
                            </FormItem>
                        )}/>
                        <FormField control={generalForm.control} name="maintenanceMode" render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm">
                                <div className="space-y-0.5">
                                    <RHFFormLabel className="text-base">Maintenance Mode</RHFFormLabel>
                                    <RHFFormDescription>Temporarily disable access for users (except admins).</RHFFormDescription>
                                </div>
                                <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                            </FormItem>
                        )}/>
                        <FormField control={generalForm.control} name="allowPublicJobBoard" render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm">
                                <div className="space-y-0.5">
                                    <RHFFormLabel className="text-base">Enable Public Job Board</RHFFormLabel>
                                    <RHFFormDescription>Allow non-logged-in users to view job listings.</RHFFormDescription>
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
           <Card className="shadow-lg">
             <Form {...notificationForm}>
                <form onSubmit={notificationForm.handleSubmit(onNotificationSubmit)}>
                    <CardHeader>
                        <CardTitle>Notification Settings</CardTitle>
                        <CardDescription>Manage how users receive notifications.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <FormField control={notificationForm.control} name="emailNotifications" render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm">
                                <div className="space-y-0.5">
                                    <RHFFormLabel className="text-base">Global Email Notifications</RHFFormLabel>
                                    <RHFFormDescription>Enable or disable all email notifications system-wide.</RHFFormDescription>
                                </div>
                                <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                            </FormItem>
                        )}/>
                        <FormField control={notificationForm.control} name="newApplicantAlerts" render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm">
                                <div className="space-y-0.5">
                                    <RHFFormLabel className="text-base">New Applicant Alerts for Recruiters</RHFFormLabel>
                                    <RHFFormDescription>Notify recruiters when a new candidate applies.</RHFFormDescription>
                                </div>
                                <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} disabled={!notificationForm.getValues("emailNotifications")} /></FormControl>
                            </FormItem>
                        )}/>
                        <FormField control={notificationForm.control} name="interviewReminders" render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm">
                                <div className="space-y-0.5">
                                    <RHFFormLabel className="text-base">Interview Reminders for Candidates & Interviewers</RHFFormLabel>
                                    <RHFFormDescription>Send reminders for scheduled interviews.</RHFFormDescription>
                                </div>
                                <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} disabled={!notificationForm.getValues("emailNotifications")} /></FormControl>
                            </FormItem>
                        )}/>
                         <FormField control={notificationForm.control} name="systemUpdateNotifications" render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm">
                                <div className="space-y-0.5">
                                    <RHFFormLabel className="text-base">System Update Notifications</RHFFormLabel>
                                    <RHFFormDescription>Inform users about new features or important system updates.</RHFFormDescription>
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
        
        <TabsContent value="security">
            <Card className="shadow-lg">
                <Form {...securityForm}>
                    <form onSubmit={securityForm.handleSubmit(onSecuritySubmit)}>
                        <CardHeader>
                            <CardTitle>Security Settings</CardTitle>
                            <CardDescription>Configure password policies, 2FA, and audit logs.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <FormField control={securityForm.control} name="passwordMinLength" render={({ field }) => (
                                <FormItem>
                                    <RHFFormLabel>Password Minimum Length</RHFFormLabel>
                                    <FormControl><Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}/>
                             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <FormField control={securityForm.control} name="passwordRequireUppercase" render={({ field }) => (
                                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm"><RHFFormLabel>Require Uppercase</RHFFormLabel><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>
                                )}/>
                                <FormField control={securityForm.control} name="passwordRequireNumber" render={({ field }) => (
                                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm"><RHFFormLabel>Require Number</RHFFormLabel><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>
                                )}/>
                                <FormField control={securityForm.control} name="passwordRequireSpecialChar" render={({ field }) => (
                                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm"><RHFFormLabel>Require Special Char</RHFFormLabel><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>
                                )}/>
                             </div>
                             <FormField control={securityForm.control} name="enable2FA" render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm">
                                    <div className="space-y-0.5"><RHFFormLabel className="text-base">Enable Two-Factor Auth (2FA)</RHFFormLabel><RHFFormDescription>Require users to set up 2FA for enhanced security.</RHFFormDescription></div>
                                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                </FormItem>
                            )}/>
                             <FormField control={securityForm.control} name="auditLogRetentionDays" render={({ field }) => (
                                <FormItem>
                                    <RHFFormLabel>Audit Log Retention Period</RHFFormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl><SelectTrigger><SelectValue placeholder="Select retention period" /></SelectTrigger></FormControl>
                                        <SelectContent>
                                            <SelectItem value="30">30 Days</SelectItem>
                                            <SelectItem value="90">90 Days</SelectItem>
                                            <SelectItem value="180">180 Days</SelectItem>
                                            <SelectItem value="365">365 Days</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}/>
                        </CardContent>
                        <CardFooter className="border-t pt-6">
                            <Button type="submit"><Save className="mr-2 h-4 w-4"/> Save Security Settings</Button>
                        </CardFooter>
                    </form>
                </Form>
            </Card>
        </TabsContent>

        <TabsContent value="integrations">
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle>Integrations</CardTitle>
                    <CardDescription>Manage connections with third-party services.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <Card className="p-4 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-semibold">Google Calendar</h3>
                                <p className="text-sm text-muted-foreground">Sync interview schedules.</p>
                            </div>
                            <Button variant="outline" onClick={() => toast({ title: "Placeholder Action", description: "Connect to Google Calendar" })}><Link2 className="mr-2 h-4 w-4"/>Connect</Button>
                        </div>
                    </Card>
                     <Card className="p-4 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-semibold">Slack</h3>
                                <p className="text-sm text-muted-foreground">Receive notifications for important events.</p>
                            </div>
                             <Button variant="outline" onClick={() => toast({ title: "Placeholder Action", description: "Connect to Slack" })}><Link2 className="mr-2 h-4 w-4"/>Connect</Button>
                        </div>
                    </Card>
                    <Card className="p-4 shadow-sm">
                        <Label htmlFor="hrisApiKey">HRIS System API Key (Placeholder)</Label>
                        <div className="flex items-center gap-2 mt-1">
                            <Input id="hrisApiKey" type="password" placeholder="Enter API Key for HRIS Integration" />
                            <Button onClick={() => toast({ title: "Placeholder Action", description: "Save HRIS API Key" })}><KeyRound className="mr-2 h-4 w-4"/>Save & Connect</Button>
                        </div>
                        <p className="text-xs mt-1 text-muted-foreground">Connect to your Human Resources Information System.</p>
                    </Card>
                </CardContent>
                 <CardFooter className="border-t pt-6">
                    <p className="text-sm text-muted-foreground">More integrations coming soon.</p>
                </CardFooter>
            </Card>
        </TabsContent>

        <TabsContent value="user_roles">
            <Card className="shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>User Roles & Permissions</CardTitle>
                        <CardDescription>Define and customize user roles and their permissions.</CardDescription>
                    </div>
                    <Button variant="outline" onClick={() => toast({ title: "Placeholder Action", description: "Add New Role form would appear." })}><Users2 className="mr-2 h-4 w-4"/> Add New Role</Button>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Role Name</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {mockUserRoles.map((role) => (
                                <TableRow key={role.id}>
                                    <TableCell className="font-medium">{role.name}</TableCell>
                                    <TableCell className="text-sm text-muted-foreground">{role.description}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="sm" onClick={() => toast({ title: "Placeholder Action", description: `View/Edit permissions for ${role.name}` })}>
                                            <ListChecks className="mr-2 h-4 w-4"/> Permissions
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

    
