
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MoreHorizontal, PlusCircle, Search, Edit, Trash2, Eye, Users, Briefcase, Save } from "lucide-react";
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";

const mockCompanies = [
  { id: "comp1", name: "Tech Solutions Inc.", plan: "Enterprise", users: 150, jobsPosted: 25, status: "Active", logo: "https://placehold.co/40x40.png?text=TS" },
  { id: "comp2", name: "Innovate Hub", plan: "Pro", users: 75, jobsPosted: 10, status: "Active", logo: "https://placehold.co/40x40.png?text=IH" },
  { id: "comp3", name: "Creative Designs Co.", plan: "Basic", users: 20, jobsPosted: 5, status: "Trial", logo: "https://placehold.co/40x40.png?text=CD" },
  { id: "comp4", name: "Legacy Corp", plan: "Pro", users: 50, jobsPosted: 8, status: "Inactive", logo: "https://placehold.co/40x40.png?text=LC" },
];

const addCompanyFormSchema = z.object({
  companyName: z.string().min(2, "Company name must be at least 2 characters."),
  // Add more fields as needed for a real implementation, e.g., plan, admin user email
});

type AddCompanyFormValues = z.infer<typeof addCompanyFormSchema>;

export default function CompanyManagementPage() {
  const { toast } = useToast();
  const [isAddCompanyDialogOpen, setIsAddCompanyDialogOpen] = useState(false);

  const form = useForm<AddCompanyFormValues>({
    resolver: zodResolver(addCompanyFormSchema),
    defaultValues: {
      companyName: "",
    },
  });

  const handleAction = (companyId: string, action: string) => {
    toast({ title: `Action: ${action}`, description: `Performed ${action} on company ${companyId}. (Simulated)`});
    // API call would happen here
  };

  const onAddCompanySubmit = (data: AddCompanyFormValues) => {
    console.log("Add Company Data (Placeholder):", data);
    toast({
      title: "Add Company (Placeholder)",
      description: `Company "${data.companyName}" would be added. This is a placeholder.`,
    });
    form.reset();
    setIsAddCompanyDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-md">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl">Company Management</CardTitle>
            <CardDescription>Manage companies using the TalentVerse AI platform.</CardDescription>
          </div>
          <Dialog open={isAddCompanyDialogOpen} onOpenChange={setIsAddCompanyDialogOpen}>
            <DialogTrigger asChild>
              <Button><PlusCircle className="mr-2 h-4 w-4" /> Add New Company</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add New Company</DialogTitle>
                <DialogDescription>
                  Fill in the details below to add a new company to the platform. (Placeholder)
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onAddCompanySubmit)} className="space-y-4 py-4">
                  <FormField
                    control={form.control}
                    name="companyName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Acme Corp" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {/* Add more fields here for a real form */}
                  <DialogFooter>
                    <DialogClose asChild>
                       <Button type="button" variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button type="submit">
                      <Save className="mr-2 h-4 w-4" /> Add Company
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
            <div className="flex justify-between items-center">
                 <div className="relative flex-grow max-w-xs">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search companies..." className="pl-8" />
                </div>
            </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company</TableHead>
                <TableHead>Subscription Plan</TableHead>
                <TableHead><Users className="inline mr-1 h-4 w-4"/>Users</TableHead>
                <TableHead><Briefcase className="inline mr-1 h-4 w-4"/>Jobs Posted</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockCompanies.map((company) => (
                <TableRow key={company.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                        <Image src={company.logo} alt={`${company.name} logo`} width={32} height={32} className="rounded-sm" data-ai-hint="company logo"/>
                        <span className="font-medium">{company.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>{company.plan}</TableCell>
                  <TableCell>{company.users}</TableCell>
                  <TableCell>{company.jobsPosted}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                        company.status === "Active" ? "bg-green-100 text-green-700" : 
                        company.status === "Trial" ? "bg-yellow-100 text-yellow-700" :
                        "bg-gray-100 text-gray-700"
                    }`}>
                        {company.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleAction(company.id, 'view_details')}><Eye className="mr-2 h-4 w-4" />View Details</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleAction(company.id, 'edit')}><Edit className="mr-2 h-4 w-4" />Edit Company</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => handleAction(company.id, 'delete')}><Trash2 className="mr-2 h-4 w-4" />Delete Company</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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
