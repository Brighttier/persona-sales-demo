
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Download, CreditCard, DollarSign, CalendarDays, RefreshCw, Settings2, PlusCircle } from "lucide-react";

const mockSubscriptions = [
  { id: "sub1", companyName: "Tech Solutions Inc.", plan: "Enterprise", amount: "$500/mo", status: "Active", nextBillingDate: "2024-08-01", paymentMethod: "**** **** **** 1234" },
  { id: "sub2", companyName: "Innovate Hub", plan: "Pro", amount: "$200/mo", status: "Active", nextBillingDate: "2024-08-15", paymentMethod: "**** **** **** 5678" },
  { id: "sub3", companyName: "Creative Designs Co.", plan: "Basic", amount: "$50/mo", status: "Past Due", nextBillingDate: "2024-07-20", paymentMethod: "**** **** **** 9012" },
  { id: "sub4", companyName: "Analytics Corp", plan: "Enterprise", amount: "$500/mo", status: "Canceled", nextBillingDate: "N/A", paymentMethod: "**** **** **** 3456" },
];

const mockPlans = [
    { id: "basic", name: "Basic", price: "$50/month", features: ["10 Job Postings", "5 Users", "Basic Reporting"] },
    { id: "pro", name: "Pro", price: "$200/month", features: ["Unlimited Job Postings", "25 Users", "Advanced Reporting", "AI Screening Credits"] },
    { id: "enterprise", name: "Enterprise", price: "Custom", features: ["All Pro Features", "Dedicated Support", "Custom Integrations", "Volume AI Credits"] },
]

export default function BillingPage() {

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
      <Card className="shadow-md">
        <CardHeader className="flex flex-row items-start justify-between">
          <div>
            <CardTitle className="text-2xl">Billing & Subscriptions</CardTitle>
            <CardDescription>Manage company subscriptions, view invoices, and configure billing settings.</CardDescription>
          </div>
          <Button variant="outline"><Settings2 className="mr-2 h-4 w-4"/> Billing Settings (Placeholder)</Button>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center"><DollarSign className="mr-2 h-4 w-4 text-muted-foreground"/>Monthly Recurring Revenue</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-3xl font-bold">$15,500</div>
                <p className="text-xs text-muted-foreground">+5% from last month</p>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center"><CreditCard className="mr-2 h-4 w-4 text-muted-foreground"/>Active Subscriptions</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-3xl font-bold">125</div>
                <p className="text-xs text-muted-foreground">3 new this week</p>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center"><CalendarDays className="mr-2 h-4 w-4 text-muted-foreground"/>Upcoming Renewals (Next 7 Days)</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-3xl font-bold">15</div>
                <p className="text-xs text-muted-foreground">Totaling $2,300</p>
            </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Subscription Plans</CardTitle>
          <CardDescription>Overview of available subscription plans.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {mockPlans.map(plan => (
            <Card key={plan.id} className="flex flex-col">
              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
                <CardDescription className="text-2xl font-bold text-primary">{plan.price}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <ul className="space-y-1 text-sm text-muted-foreground list-disc list-inside">
                  {plan.features.map(feature => <li key={feature}>{feature}</li>)}
                </ul>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full">Edit Plan (Placeholder)</Button>
              </CardFooter>
            </Card>
          ))}
        </CardContent>
         <CardFooter className="border-t pt-6">
            <Button><PlusCircle className="mr-2 h-4 w-4"/> Add New Plan (Placeholder)</Button>
        </CardFooter>
      </Card>

      <Card>
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
                    <Button variant="ghost" size="sm"><Download className="mr-1 h-4 w-4"/> Invoice</Button>
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
