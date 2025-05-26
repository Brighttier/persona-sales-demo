
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
import { useState, useMemo, useEffect } from "react";

interface MockCompany {
  id: string;
  name: string;
  plan: string;
  users: number;
  jobsPosted: number;
  status: string;
  logo: string;
}

const initialMockCompanies: MockCompany[] = [
  { id: "comp1", name: "Tech Solutions Inc.", plan: "Enterprise", users: 150, jobsPosted: 25, status: "Active", logo: "https://placehold.co/40x40.png?text=TS" },
  { id: "comp2", name: "Innovate Hub", plan: "Pro", users: 75, jobsPosted: 10, status: "Active", logo: "https://placehold.co/40x40.png?text=IH" },
  { id: "comp3", name: "Creative Designs Co.", plan: "Basic", users: 20, jobsPosted: 5, status: "Trial", logo: "https://placehold.co/40x40.png?text=CD" },
  { id: "comp4", name: "Legacy Corp", plan: "Pro", users: 50, jobsPosted: 8, status: "Inactive", logo: "https://placehold.co/40x40.png?text=LC" },
];

const companyFormSchema = z.object({
  id: z.string().optional(),
  companyName: z.string().min(2, "Company name must be at least 2 characters."),
});

type CompanyFormValues = z.infer<typeof companyFormSchema>;

export default function CompanyManagementPage() {
  const { toast } = useToast();
  const [companies, setCompanies] = useState<MockCompany[]>(initialMockCompanies);
  const [isAddCompanyDialogOpen, setIsAddCompanyDialogOpen] = useState(false);
  const [isEditCompanyDialogOpen, setIsEditCompanyDialogOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<MockCompany | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const companyForm = useForm<CompanyFormValues>({
    resolver: zodResolver(companyFormSchema),
    defaultValues: { companyName: "" },
  });

  useEffect(() => {
    if (editingCompany && isEditCompanyDialogOpen) {
      companyForm.reset({ id: editingCompany.id, companyName: editingCompany.name });
    }
  }, [editingCompany, isEditCompanyDialogOpen, companyForm]);

  const handleAction = (companyId: string, action: string) => {
    const company = companies.find(c => c.id === companyId);
    if (!company) return;

    if (action === 'edit') {
      setEditingCompany(company);
      setIsEditCompanyDialogOpen(true);
    } else if (action === 'view_details') {
      toast({ title: `View Details (Placeholder)`, description: `Viewing details for ${company.name}.`});
    } else if (action === 'delete') {
      toast({ title: `Delete Company (Placeholder)`, description: `Company ${company.name} would be deleted.`});
    }
  };

  const onAddCompanySubmit = (data: CompanyFormValues) => {
    const newCompany: MockCompany = {
      id: `comp-${Date.now()}`,
      name: data.companyName,
      plan: "Basic", // Default plan
      users: 0,
      jobsPosted: 0,
      status: "Active",
      logo: `https://placehold.co/40x40.png?text=${data.companyName.substring(0,2).toUpperCase()}`,
    };
    setCompanies(prev => [newCompany, ...prev]);
    toast({
      title: "Add Company (Placeholder)",
      description: `Company "${data.companyName}" has been added.`,
    });
    companyForm.reset({ companyName: "" });
    setIsAddCompanyDialogOpen(false);
  };
  
  const onEditCompanySubmit = (data: CompanyFormValues) => {
    if (!editingCompany) return;
    setCompanies(prev => prev.map(c => c.id === editingCompany.id ? {...c, name: data.companyName} : c));
    toast({ title: "Company Updated (Placeholder)", description: `Company name updated to ${data.companyName}.` });
    setIsEditCompanyDialogOpen(false);
    setEditingCompany(null);
  };

  const filteredCompanies = useMemo(() => {
    return companies.filter(company =>
      company.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [companies, searchTerm]);

  return (
    <div className="space-y-6">
      <Card className="shadow-xl">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl">Company Management</CardTitle>
            <CardDescription>Manage companies using the Persona AI platform.</CardDescription>
          </div>
          <Dialog open={isAddCompanyDialogOpen} onOpenChange={setIsAddCompanyDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => companyForm.reset({ companyName: "" })}>
                <PlusCircle className="mr-2 h-4 w-4" /> Add New Company
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader><DialogTitle>Add New Company</DialogTitle><DialogDescription>Fill in the details below to add a new company.</DialogDescription></DialogHeader>
              <Form {...companyForm}>
                <form onSubmit={companyForm.handleSubmit(onAddCompanySubmit)} className="space-y-4 py-4">
                  <FormField control={companyForm.control} name="companyName" render={({ field }) => (
                      <FormItem><FormLabel>Company Name</FormLabel><FormControl><Input placeholder="Acme Corp" {...field} /></FormControl><FormMessage /></FormItem> )}/>
                  <DialogFooter>
                    <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                    <Button type="submit"><Save className="mr-2 h-4 w-4" /> Add Company</Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </CardHeader>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
            <div className="flex justify-between items-center">
                 <div className="relative flex-grow max-w-xs">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search companies..." className="pl-8" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
            </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow><TableHead>Company</TableHead><TableHead>Subscription Plan</TableHead><TableHead><Users className="inline mr-1 h-4 w-4"/>Users</TableHead><TableHead><Briefcase className="inline mr-1 h-4 w-4"/>Jobs Posted</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {filteredCompanies.map((company) => (
                <TableRow key={company.id}>
                  <TableCell><div className="flex items-center gap-3">
                        <Image src={company.logo} alt={`${company.name} logo`} width={32} height={32} className="rounded-sm" data-ai-hint="company logo"/>
                        <span className="font-medium">{company.name}</span></div></TableCell>
                  <TableCell>{company.plan}</TableCell><TableCell>{company.users}</TableCell><TableCell>{company.jobsPosted}</TableCell>
                  <TableCell><span className={`px-2 py-1 text-xs rounded-full ${ company.status === "Active" ? "bg-green-100 text-green-700" :  company.status === "Trial" ? "bg-yellow-100 text-yellow-700" : "bg-gray-100 text-gray-700" }`}>{company.status}</span></TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
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
              {filteredCompanies.length === 0 && (<TableRow><TableCell colSpan={6} className="text-center h-24">No companies found matching your search.</TableCell></TableRow>)}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Company Dialog */}
      <Dialog open={isEditCompanyDialogOpen} onOpenChange={setIsEditCompanyDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader><DialogTitle>Edit Company: {editingCompany?.name}</DialogTitle><DialogDescription>Update company details.</DialogDescription></DialogHeader>
          <Form {...companyForm}>
            <form onSubmit={companyForm.handleSubmit(onEditCompanySubmit)} className="space-y-4 py-4">
              <FormField control={companyForm.control} name="companyName" render={({ field }) => (
                  <FormItem><FormLabel>Company Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )}/>
              <DialogFooter>
                <DialogClose asChild><Button type="button" variant="outline" onClick={() => setEditingCompany(null)}>Cancel</Button></DialogClose>
                <Button type="submit"><Save className="mr-2 h-4 w-4" /> Save Changes</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
