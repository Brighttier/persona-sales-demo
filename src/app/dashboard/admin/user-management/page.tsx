
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { USER_ROLES, type UserRole } from "@/config/roles";
import { MoreHorizontal, PlusCircle, Search, UserCog, UserX, Edit, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState, useMemo, useEffect } from "react";

interface MockUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: string;
  lastLogin: string;
  companyName?: string;
}

// Simplified list of mock companies for selection
// In a real app, this would be fetched or come from a shared context/store
const MOCK_COMPANIES_FOR_SELECTION = [
  { id: "comp1", name: "Tech Solutions Inc." },
  { id: "comp2", name: "Innovate Hub" },
  { id: "comp3", name: "Creative Designs Co." },
  { id: "comp4", name: "Legacy Corp" },
];


const initialMockUsers: MockUser[] = [
  { id: "user1", name: "Alex Johnson", email: "alex.johnson@example.com", role: USER_ROLES.CANDIDATE, status: "Active", lastLogin: "2024-07-22" },
  { id: "user2", name: "Brenda Smith", email: "brenda.smith@example.com", role: USER_ROLES.RECRUITER, status: "Active", lastLogin: "2024-07-23", companyName: "Tech Solutions Inc." },
  { id: "user3", name: "Charles Brown", email: "charles.brown@example.com", role: USER_ROLES.HIRING_MANAGER, status: "Inactive", lastLogin: "2024-06-15", companyName: "Innovate Hub" },
  { id: "user4", name: "Diana Green", email: "diana.green@example.com", role: USER_ROLES.ADMIN, status: "Active", lastLogin: "2024-07-23" },
  { id: "user5", name: "Edward Black", email: "edward.black@example.com", role: USER_ROLES.CANDIDATE, status: "Pending", lastLogin: "N/A" },
  { id: "user6", name: "Ian Reviewer", email: "ian.reviewer@example.com", role: USER_ROLES.INTERVIEWER, status: "Active", lastLogin: "2024-07-24", companyName: "Tech Solutions Inc." },
];

const userFormSchema = z.object({
  id: z.string().optional(),
  fullName: z.string().min(2, "Full name must be at least 2 characters."),
  email: z.string().email("Invalid email address."),
  role: z.nativeEnum(USER_ROLES, { errorMap: () => ({ message: "Please select a valid role."}) }),
  companyName: z.string().optional(),
}).superRefine((data, ctx) => {
  if ((data.role === USER_ROLES.RECRUITER || data.role === USER_ROLES.HIRING_MANAGER || data.role === USER_ROLES.INTERVIEWER) && (!data.companyName || data.companyName.trim() === "")) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Company name is required for Recruiters, Hiring Managers, and Interviewers.",
      path: ["companyName"],
    });
  }
});

type UserFormValues = z.infer<typeof userFormSchema>;

export default function UserManagementPage() {
  const { toast } = useToast();
  const [users, setUsers] = useState<MockUser[]>(initialMockUsers);
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
  const [isEditUserDialogOpen, setIsEditUserDialogOpen] = useState(false);
  const [isChangeRoleDialogOpen, setIsChangeRoleDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<MockUser | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<UserRole | "all">("all");
  const [statusFilter, setStatusFilter] = useState<string | "all">("all");

  const userForm = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: { fullName: "", email: "", companyName: "" },
  });
  const watchedRole = userForm.watch("role");

  const changeRoleForm = useForm<{ newRole: UserRole; newCompanyName?: string }>({
    resolver: zodResolver(z.object({ 
      newRole: z.nativeEnum(USER_ROLES),
      newCompanyName: z.string().optional(),
    }).superRefine((data, ctx) => {
      if ((data.newRole === USER_ROLES.RECRUITER || data.newRole === USER_ROLES.HIRING_MANAGER || data.newRole === USER_ROLES.INTERVIEWER) && (!data.newCompanyName || data.newCompanyName.trim() === "")) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Company name is required for this role.",
          path: ["newCompanyName"],
        });
      }
    })),
    defaultValues: { newCompanyName: "" },
  });
  const watchedNewRole = changeRoleForm.watch("newRole");

  useEffect(() => {
    if (editingUser && isEditUserDialogOpen) {
      userForm.reset({
        id: editingUser.id,
        fullName: editingUser.name,
        email: editingUser.email,
        role: editingUser.role,
        companyName: editingUser.companyName || "",
      });
    }
  }, [editingUser, isEditUserDialogOpen, userForm]);

  useEffect(() => {
    if (editingUser && isChangeRoleDialogOpen) {
      changeRoleForm.reset({ newRole: editingUser.role, newCompanyName: editingUser.companyName || "" });
    }
  }, [editingUser, isChangeRoleDialogOpen, changeRoleForm]);

  const handleAction = (userId: string, action: string) => {
    const userToActOn = users.find(u => u.id === userId);
    if (!userToActOn) return;

    if (action === 'edit') {
      setEditingUser(userToActOn);
      setIsEditUserDialogOpen(true);
    } else if (action === 'change_role') {
      setEditingUser(userToActOn);
      setIsChangeRoleDialogOpen(true);
    } else if (action === 'deactivate') {
      setUsers(prev => prev.map(u => u.id === userId ? {...u, status: "Inactive"} : u));
      toast({ title: "User Deactivated", description: `${userToActOn.name} has been deactivated.` });
    } else if (action === 'activate') {
      setUsers(prev => prev.map(u => u.id === userId ? {...u, status: "Active"} : u));
      toast({ title: "User Activated", description: `${userToActOn.name} has been activated.` });
    } else if (action === 'delete') {
      toast({ title: "Delete User (Placeholder)", description: `User ${userToActOn.name} would be deleted. This is a placeholder.`});
    }
  };

  const onAddUserSubmit = (data: UserFormValues) => {
    const newUser: MockUser = {
      id: `user-${Date.now()}`,
      name: data.fullName,
      email: data.email,
      role: data.role,
      status: "Pending",
      lastLogin: "N/A",
      companyName: (data.role === USER_ROLES.RECRUITER || data.role === USER_ROLES.HIRING_MANAGER || data.role === USER_ROLES.INTERVIEWER) ? data.companyName : undefined,
    };
    setUsers(prev => [newUser, ...prev]);
    toast({
      title: "User Added (Placeholder)",
      description: `User "${data.fullName}" with role "${data.role}" ${newUser.companyName ? `for company "${newUser.companyName}"` : ''} has been added.`,
    });
    userForm.reset({ fullName: "", email: "", role: undefined, companyName: "" });
    setIsAddUserDialogOpen(false);
  };

  const onEditUserSubmit = (data: UserFormValues) => {
    if (!editingUser) return;
    setUsers(prev => prev.map(u => u.id === editingUser.id ? {
      ...u, 
      name: data.fullName, 
      email: data.email, 
      companyName: (data.role === USER_ROLES.RECRUITER || data.role === USER_ROLES.HIRING_MANAGER || data.role === USER_ROLES.INTERVIEWER) ? data.companyName : u.companyName,
    } : u));
    toast({ title: "User Updated (Placeholder)", description: `Details for ${data.fullName} have been updated.` });
    setIsEditUserDialogOpen(false);
    setEditingUser(null);
  };

  const onChangeRoleSubmit = (data: { newRole: UserRole; newCompanyName?: string }) => {
    if (!editingUser) return;
    setUsers(prev => prev.map(u => u.id === editingUser.id ? {
      ...u, 
      role: data.newRole, 
      companyName: (data.newRole === USER_ROLES.RECRUITER || data.newRole === USER_ROLES.HIRING_MANAGER || data.newRole === USER_ROLES.INTERVIEWER) ? data.newCompanyName : undefined
    } : u));
    toast({ title: "User Role Changed (Placeholder)", description: `${editingUser.name}'s role changed to ${data.newRole}. ${ (data.newRole === USER_ROLES.RECRUITER || data.newRole === USER_ROLES.HIRING_MANAGER || data.newRole === USER_ROLES.INTERVIEWER) && data.newCompanyName ? `Company set to ${data.newCompanyName}.` : '' }` });
    setIsChangeRoleDialogOpen(false);
    setEditingUser(null);
  };

  const getRoleBadgeVariant = (role: UserRole) => {
    switch(role) {
        case USER_ROLES.ADMIN: return "destructive";
        case USER_ROLES.RECRUITER: return "default";
        case USER_ROLES.HIRING_MANAGER: return "outline";
        case USER_ROLES.INTERVIEWER: return "secondary"
        default: return "secondary";
    }
  }

  const getStatusBadgeVariant = (status: string) => {
    switch(status) {
        case "Active": return "default";
        case "Inactive": return "secondary";
        case "Pending": return "outline";
        default: return "outline";
    }
  }

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const searchMatch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (user.companyName && user.companyName.toLowerCase().includes(searchTerm.toLowerCase()));
      const roleMatch = roleFilter === "all" || user.role === roleFilter;
      const statusMatch = statusFilter === "all" || user.status === statusFilter;
      return searchMatch && roleMatch && statusMatch;
    });
  }, [users, searchTerm, roleFilter, statusFilter]);


  return (
    <div className="space-y-6">
      <Card className="shadow-xl">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl">User Management</CardTitle>
            <CardDescription>Add, edit, and manage user accounts across the platform.</CardDescription>
          </div>
          <Dialog open={isAddUserDialogOpen} onOpenChange={setIsAddUserDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => userForm.reset({fullName: "", email: "", role: undefined, companyName: ""})}><PlusCircle className="mr-2 h-4 w-4" /> Add New User</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add New User</DialogTitle>
                <DialogDescription>
                  Fill in the details below to add a new user to the platform.
                </DialogDescription>
              </DialogHeader>
              <Form {...userForm}>
                <form onSubmit={userForm.handleSubmit(onAddUserSubmit)} className="space-y-4 py-4">
                  <FormField control={userForm.control} name="fullName" render={({ field }) => (
                      <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input placeholder="John Doe" {...field} /></FormControl><FormMessage /></FormItem> )}/>
                  <FormField control={userForm.control} name="email" render={({ field }) => (
                      <FormItem><FormLabel>Email Address</FormLabel><FormControl><Input type="email" placeholder="john.doe@example.com" {...field} /></FormControl><FormMessage /></FormItem> )}/>
                  <FormField control={userForm.control} name="role" render={({ field }) => (
                      <FormItem><FormLabel>User Role</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Select a role" /></SelectTrigger></FormControl>
                          <SelectContent>{Object.values(USER_ROLES).map((roleValue) => (<SelectItem key={roleValue} value={roleValue} className="capitalize">{roleValue.replace('-', ' ')}</SelectItem>))}</SelectContent>
                        </Select><FormMessage /></FormItem>)}/>
                  {(watchedRole === USER_ROLES.RECRUITER || watchedRole === USER_ROLES.HIRING_MANAGER || watchedRole === USER_ROLES.INTERVIEWER) && (
                     <FormField control={userForm.control} name="companyName" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company Name</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Select a company" /></SelectTrigger></FormControl>
                            <SelectContent>
                              {MOCK_COMPANIES_FOR_SELECTION.map((company) => (
                                <SelectItem key={company.id} value={company.name}>{company.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}/>
                  )}
                  <DialogFooter>
                    <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                    <Button type="submit"><Save className="mr-2 h-4 w-4" /> Add User</Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </CardHeader>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
            <div className="flex-grow relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search users by name, email or company..." className="pl-8 w-full md:w-auto" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <div className="flex gap-2">
                 <Select value={roleFilter} onValueChange={(value) => setRoleFilter(value as UserRole | "all")}>
                    <SelectTrigger className="w-full md:w-[180px]"> <SelectValue placeholder="Filter by Role" /></SelectTrigger>
                    <SelectContent><SelectItem value="all">All Roles</SelectItem>{Object.values(USER_ROLES).map(r => <SelectItem key={r} value={r} className="capitalize">{r.replace("-", " ")}</SelectItem>)}</SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value)}>
                    <SelectTrigger className="w-full md:w-[180px]"><SelectValue placeholder="Filter by Status" /></SelectTrigger>
                    <SelectContent><SelectItem value="all">All Statuses</SelectItem><SelectItem value="Active">Active</SelectItem><SelectItem value="Inactive">Inactive</SelectItem><SelectItem value="Pending">Pending</SelectItem></SelectContent>
                </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow><TableHead>User</TableHead><TableHead>Email</TableHead><TableHead>Role</TableHead><TableHead>Company</TableHead><TableHead>Status</TableHead><TableHead>Last Login</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell><div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9"><AvatarImage src={`https://placehold.co/40x40.png?text=${user.name[0]}`} alt={user.name} data-ai-hint="person avatar"/><AvatarFallback>{user.name.split(" ").map(n=>n[0]).join("")}</AvatarFallback></Avatar>
                        <span className="font-medium">{user.name}</span></div></TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell><Badge variant={getRoleBadgeVariant(user.role)} className="capitalize">{user.role.replace("-"," ")}</Badge></TableCell>
                  <TableCell>{user.companyName || "N/A"}</TableCell>
                  <TableCell><Badge variant={getStatusBadgeVariant(user.status)} className={ user.status === "Active" ? "bg-green-100 text-green-700 border-green-300" : user.status === "Inactive" ? "bg-gray-100 text-gray-700 border-gray-300" : user.status === "Pending" ? "bg-yellow-100 text-yellow-700 border-yellow-300" : "" }>{user.status}</Badge></TableCell>
                  <TableCell>{user.lastLogin}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleAction(user.id, 'edit')}><Edit className="mr-2 h-4 w-4" />Edit User</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleAction(user.id, 'change_role')}><UserCog className="mr-2 h-4 w-4" />Change Role</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {user.status === "Active" && <DropdownMenuItem className="text-orange-600 focus:text-orange-600" onClick={() => handleAction(user.id, 'deactivate')}><UserX className="mr-2 h-4 w-4" />Deactivate User</DropdownMenuItem>}
                        {user.status !== "Active" && <DropdownMenuItem className="text-green-600 focus:text-green-600" onClick={() => handleAction(user.id, 'activate')}><UserCog className="mr-2 h-4 w-4" />Activate User</DropdownMenuItem>}
                        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => handleAction(user.id, 'delete')}><UserX className="mr-2 h-4 w-4" />Delete User</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {filteredUsers.length === 0 && (<TableRow><TableCell colSpan={7} className="text-center h-24">No users found matching your criteria.</TableCell></TableRow>)}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={isEditUserDialogOpen} onOpenChange={setIsEditUserDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Edit User: {editingUser?.name}</DialogTitle><DialogDescription>Update user details.</DialogDescription></DialogHeader>
          <Form {...userForm}>
            <form onSubmit={userForm.handleSubmit(onEditUserSubmit)} className="space-y-4 py-4">
              <FormField control={userForm.control} name="fullName" render={({ field }) => (
                  <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )}/>
              <FormField control={userForm.control} name="email" render={({ field }) => (
                  <FormItem><FormLabel>Email (Cannot be changed)</FormLabel><FormControl><Input type="email" {...field} readOnly /></FormControl><FormMessage /></FormItem> )}/>
              {(userForm.getValues("role") === USER_ROLES.RECRUITER || userForm.getValues("role") === USER_ROLES.HIRING_MANAGER || userForm.getValues("role") === USER_ROLES.INTERVIEWER) && (
                <FormField control={userForm.control} name="companyName" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Name</FormLabel>
                     <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select a company" /></SelectTrigger></FormControl>
                        <SelectContent>
                          {MOCK_COMPANIES_FOR_SELECTION.map((company) => (
                            <SelectItem key={company.id} value={company.name}>{company.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    <FormMessage />
                  </FormItem> 
                )}/>
              )}
              <DialogFooter>
                <DialogClose asChild><Button type="button" variant="outline" onClick={() => { setEditingUser(null); setIsEditUserDialogOpen(false);}}>Cancel</Button></DialogClose>
                <Button type="submit"><Save className="mr-2 h-4 w-4" /> Save Changes</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Change Role Dialog */}
      <Dialog open={isChangeRoleDialogOpen} onOpenChange={setIsChangeRoleDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Change Role for: {editingUser?.name}</DialogTitle><DialogDescription>Current Role: <Badge variant={getRoleBadgeVariant(editingUser?.role || USER_ROLES.CANDIDATE)} className="capitalize">{editingUser?.role.replace("-"," ")}</Badge></DialogDescription></DialogHeader>
          <Form {...changeRoleForm}>
            <form onSubmit={changeRoleForm.handleSubmit(onChangeRoleSubmit)} className="space-y-4 py-4">
              <FormField control={changeRoleForm.control} name="newRole" render={({ field }) => (
                  <FormItem><FormLabel>New Role</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select a new role" /></SelectTrigger></FormControl>
                      <SelectContent>{Object.values(USER_ROLES).map((roleValue) => (<SelectItem key={roleValue} value={roleValue} className="capitalize">{roleValue.replace('-', ' ')}</SelectItem>))}</SelectContent>
                    </Select><FormMessage /></FormItem>)}/>
               {(watchedNewRole === USER_ROLES.RECRUITER || watchedNewRole === USER_ROLES.HIRING_MANAGER || watchedNewRole === USER_ROLES.INTERVIEWER) && (
                    <FormField control={changeRoleForm.control} name="newCompanyName" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Company Name</FormLabel>
                             <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Select a company" /></SelectTrigger></FormControl>
                                <SelectContent>
                                {MOCK_COMPANIES_FOR_SELECTION.map((company) => (
                                    <SelectItem key={company.id} value={company.name}>{company.name}</SelectItem>
                                ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}/>
                  )}
              <DialogFooter>
                <DialogClose asChild><Button type="button" variant="outline" onClick={() => { setEditingUser(null); setIsChangeRoleDialogOpen(false);}}>Cancel</Button></DialogClose>
                <Button type="submit"><Save className="mr-2 h-4 w-4" /> Update Role</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

    