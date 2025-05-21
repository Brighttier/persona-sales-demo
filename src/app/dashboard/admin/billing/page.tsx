
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Download, CreditCard, DollarSign, CalendarDays, RefreshCw, Settings2, PlusCircle, Save, Edit } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

const mockSubscriptions = [
  { id: "sub1", companyName: "Tech Solutions Inc.", plan: "Enterprise", amount: "$500/mo", status: "Active", nextBillingDate: "2024-08-01", paymentMethod: "**** **** **** 1234" },
  { id: "sub2", companyName: "Innovate Hub", plan: "Pro", amount: "$200/mo", status: "Active", nextBillingDate: "2024-08-15", paymentMethod: "**** **** **** 5678" },
  { id: "sub3", companyName: "Creative Designs Co.", plan: "Basic", amount: "$50/mo", status: "Past Due", nextBillingDate: "2024-07-20", paymentMethod: "**** **** **** 9012" },
  { id: "sub4", companyName: "Analytics Corp", plan: "Enterprise", amount: "$500/mo", status: "Canceled", nextBillingDate: "N/A", paymentMethod: "**** **** **** 3456" },
];

const mockPlans = [
    { id: "basic", name: "Basic", price: "$50/month", featuresString: "10 Job Postings, 5 Users, Basic Reporting", featuresArray: ["10 Job Postings", "5 Users", "Basic Reporting"] },
    { id: "pro", name: "Pro", price: "$200/month", featuresString: "Unlimited Job Postings, 25 Users, Advanced Reporting, AI Screening Credits", featuresArray: ["Unlimited Job Postings", "25 Users", "Advanced Reporting", "AI Screening Credits"] },
    { id: "enterprise", name: "Enterprise", price: "Custom", featuresString: "All Pro Features, Dedicated Support, Custom Integrations, Volume AI Credits", featuresArray: ["All Pro Features", "Dedicated Support", "Custom Integrations", "Volume AI Credits"] },
];

const billingSettingsFormSchema = z.object({
  defaultCurrency: z.string().min(1, "Default currency is required."),
  invoiceFooterText: z.string().max(200, "Footer text cannot exceed 200 characters.").optional(),
  sendRenewalReminders: z.boolean(),
});

type BillingSettingsFormValues = z.infer<typeof billingSettingsFormSchema>;

const planFormSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(3, "Plan name must be at least 3 characters."),
    price: z.string().min(1, "Price is required (e.g., $50/month or Custom)."),
    features: z.string().min(10, "Features description must be at least 10 characters."),
});
type PlanFormValues = z.infer<typeof planFormSchema>;


export default function BillingPage() {
  const { toast } = useToast();
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);
  const [isAddPlanDialogOpen, setIsAddPlanDialogOpen] = useState(false);
  const [isEditPlanDialogOpen, setIsEditPlanDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<PlanFormValues | null>(null);

  const settingsForm = useForm<BillingSettingsFormValues>({
    resolver: zodResolver(billingSettingsFormSchema),
    defaultValues: {
      defaultCurrency: "USD",
      invoiceFooterText: "Thank you for your business! Please contact support for any billing inquiries.",
      sendRenewalReminders: true,
    },
  });
  
  const planForm = useForm<PlanFormValues>({
    resolver: zodResolver(planFormSchema),
    defaultValues: { name: "", price: "", features: "" },
  });

  useEffect(() => {
    if (editingPlan) {
      planForm.reset(editingPlan);
    } else {
      planForm.reset({ name: "", price: "", features: "" });
    }
  }, [editingPlan, planForm]);


  const onSettingsSubmit = (data: BillingSettingsFormValues) => {
    console.log("Billing Settings Data (Placeholder):", data);
    toast({
      title: "Billing Settings Saved (Placeholder)",
      description: "Your billing settings have been updated. This is a placeholder action.",
    });
    setIsSettingsDialogOpen(false);
  };

  const onPlanSubmit = (data: PlanFormValues) => {
    if (data.id) { // Editing existing plan
        console.log("Edit Plan Data (Placeholder):", data);
        toast({
          title: "Plan Updated (Placeholder)",
          description: `Plan "${data.name}" has been updated. This is a placeholder.`,
        });
    } else { // Adding new plan
        console.log("Add Plan Data (Placeholder):", data);
        toast({
          title: "Plan Added (Placeholder)",
          description: `New plan "${data.name}" has been added. This is a placeholder.`,
        });
    }
    setIsAddPlanDialogOpen(false);
    setIsEditPlanDialogOpen(false);
    setEditingPlan(null);
    planForm.reset();
  };
  
  const openEditPlanDialog = (plan: typeof mockPlans[0]) => {
    setEditingPlan({
        id: plan.id,
        name: plan.name,
        price: plan.price,
        features: plan.featuresArray.join("\n") // Convert array to newline-separated string for textarea
    });
    setIsEditPlanDialogOpen(true);
  };


  const getStatusPill = (status: string) => {
    switch(status) {
        case "Active": return <Badge variant="default" className="bg-green-100 text-green-700 border-green-300">{status}</Badge>;
        case "Past Due": return <Badge variant="destructive" className="bg-red-100 text-red-700 border-red-300">{status}</Badge>;
        case "Canceled": return <Badge variant="secondary" className="bg-gray-100 text-gray-700 border-gray-300">{status}</Badge>;
        default: return <Badge>{status}</Badge>;
    }
  }


  return (
    <div className="space-y-8">
      <Card className="shadow-xl">
        <CardHeader className="flex flex-row items-start justify-between">
          <div>
            <CardTitle className="text-2xl">Billing & Subscriptions</CardTitle>
            <CardDescription>Manage company subscriptions, view invoices, and configure billing settings.</CardDescription>
          </div>
          <Dialog open={isSettingsDialogOpen} onOpenChange={setIsSettingsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline"><Settings2 className="mr-2 h-4 w-4"/> Billing Settings</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Billing Settings</DialogTitle>
                <DialogDescription>
                  Configure default billing options for the platform. (Placeholder)
                </DialogDescription>
              </DialogHeader>
              <Form {...settingsForm}>
                <form onSubmit={settingsForm.handleSubmit(onSettingsSubmit)} className="space-y-4 py-4">
                  <FormField
                    control={settingsForm.control}
                    name="defaultCurrency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Default Currency</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a currency" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="USD">USD - US Dollar</SelectItem>
                            <SelectItem value="EUR">EUR - Euro</SelectItem>
                            <SelectItem value="GBP">GBP - British Pound</SelectItem>
                            <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={settingsForm.control}
                    name="invoiceFooterText"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Invoice Footer Text</FormLabel>
                        <FormControl>
                          <Textarea placeholder="e.g., Thank you for your business!" {...field} rows={3}/>
                        </FormControl>
                        <FormDescription>This text will appear on all generated invoices.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={settingsForm.control}
                    name="sendRenewalReminders"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                        <div className="space-y-0.5">
                          <FormLabel>Send Renewal Reminders</FormLabel>
                          <FormDescription>
                            Automatically email customers before their subscription renews.
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <DialogFooter className="pt-4">
                    <DialogClose asChild>
                       <Button type="button" variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button type="submit">
                      <Save className="mr-2 h-4 w-4" /> Save Settings
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="shadow-lg">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center"><DollarSign className="mr-2 h-4 w-4 text-muted-foreground"/>Monthly Recurring Revenue</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-3xl font-bold">$15,500</div>
                <p className="text-xs text-muted-foreground">+5% from last month</p>
            </CardContent>
        </Card>
        <Card className="shadow-lg">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center"><CreditCard className="mr-2 h-4 w-4 text-muted-foreground"/>Active Subscriptions</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-3xl font-bold">125</div>
                <p className="text-xs text-muted-foreground">3 new this week</p>
            </CardContent>
        </Card>
        <Card className="shadow-lg">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center"><CalendarDays className="mr-2 h-4 w-4 text-muted-foreground"/>Upcoming Renewals (Next 7 Days)</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-3xl font-bold">15</div>
                <p className="text-xs text-muted-foreground">Totaling $2,300</p>
            </CardContent>
        </Card>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Subscription Plans</CardTitle>
          <CardDescription>Overview of available subscription plans.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {mockPlans.map(plan => (
            <Card key={plan.id} className="flex flex-col shadow-md">
              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
                <CardDescription className="text-2xl font-bold text-primary">{plan.price}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <ul className="space-y-1 text-sm text-muted-foreground list-disc list-inside">
                  {plan.featuresArray.map(feature => <li key={feature}>{feature}</li>)}
                </ul>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full" onClick={() => openEditPlanDialog(plan)}>
                  <Edit className="mr-2 h-4 w-4"/> Edit Plan
                </Button>
              </CardFooter>
            </Card>
          ))}
        </CardContent>
         <CardFooter className="border-t pt-6">
            <Button onClick={() => { setEditingPlan(null); planForm.reset(); setIsAddPlanDialogOpen(true);}}>
              <PlusCircle className="mr-2 h-4 w-4"/> Add New Plan
            </Button>
        </CardFooter>
      </Card>

      {/* Dialog for Add/Edit Plan */}
      <Dialog open={isAddPlanDialogOpen || isEditPlanDialogOpen} onOpenChange={(open) => {
            if (!open) {
                setIsAddPlanDialogOpen(false);
                setIsEditPlanDialogOpen(false);
                setEditingPlan(null);
                planForm.reset();
            }
        }}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>{editingPlan ? "Edit Subscription Plan" : "Add New Subscription Plan"}</DialogTitle>
                    <DialogDescription>
                        {editingPlan ? "Modify the details of this plan." : "Define a new subscription plan for your customers."} (Placeholder)
                    </DialogDescription>
                </DialogHeader>
                <Form {...planForm}>
                    <form onSubmit={planForm.handleSubmit(onPlanSubmit)} className="space-y-4 py-4">
                        <FormField
                            control={planForm.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Plan Name</FormLabel>
                                    <FormControl><Input placeholder="e.g., Professional Tier" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={planForm.control}
                            name="price"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Price</FormLabel>
                                    <FormControl><Input placeholder="e.g., $99/month or Custom" {...field} /></FormControl>
                                    <FormDescription>Enter the price or 'Custom' for enterprise plans.</FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={planForm.control}
                            name="features"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Features</FormLabel>
                                    <FormControl><Textarea placeholder="List features, one per line..." {...field} rows={5}/></FormControl>
                                    <FormDescription>Describe the key features and limits of this plan. Each feature on a new line.</FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter className="pt-4">
                            <DialogClose asChild>
                                <Button type="button" variant="outline" onClick={() => { setIsAddPlanDialogOpen(false); setIsEditPlanDialogOpen(false); setEditingPlan(null); planForm.reset();}}>Cancel</Button>
                            </DialogClose>
                            <Button type="submit">
                                <Save className="mr-2 h-4 w-4" /> {editingPlan ? "Save Changes" : "Add Plan"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>


      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Customer Subscriptions</CardTitle>
          <CardDescription>List of all active and past customer subscriptions.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Next Billing</TableHead>
                <TableHead>Payment Method</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockSubscriptions.map((sub) => (
                <TableRow key={sub.id}>
                  <TableCell className="font-medium">{sub.companyName}</TableCell>
                  <TableCell>{sub.plan}</TableCell>
                  <TableCell>{sub.amount}</TableCell>
                  <TableCell>{getStatusPill(sub.status)}</TableCell>
                  <TableCell>{sub.nextBillingDate}</TableCell>
                  <TableCell>{sub.paymentMethod}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => toast({title: "Invoice Download (Placeholder)", description: `Invoice for ${sub.companyName} would be downloaded.`})}><Download className="mr-1 h-4 w-4"/> Invoice</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

