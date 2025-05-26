
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
import { useState, useMemo } from "react";

const mockUsers = [
  { id: "user1", name: "Alex Johnson", email: "alex.johnson@example.com", role: USER_ROLES.CANDIDATE, status: "Active", lastLogin: "2024-07-22" },
  { id: "user2", name: "Brenda Smith", email: "brenda.smith@example.com", role: USER_ROLES.RECRUITER, status: "Active", lastLogin: "2024-07-23" },
  { id: "user3", name: "Charles Brown", email: "charles.brown@example.com", role: USER_ROLES.HIRING_MANAGER, status: "Inactive", lastLogin: "2024-06-15" },
  { id: "user4", name: "Diana Green", email: "diana.green@example.com", role: USER_ROLES.ADMIN, status: "Active", lastLogin: "2024-07-23" },
  { id: "user5", name: "Edward Black", email: "edward.black@example.com", role: USER_ROLES.CANDIDATE, status: "Pending", lastLogin: "N/A" },
];

const addUserFormSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters."),
  email: z.string().email("Invalid email address."),
  role: z.nativeEnum(USER_ROLES, { errorMap: () => ({ message: "Please select a valid role."}) }),
});

type AddUserFormValues = z.infer<typeof addUserFormSchema>;

export default function UserManagementPage() {
  const { toast } = useToast();
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<UserRole | "all">("all");
  const [statusFilter, setStatusFilter] = useState<string | "all">("all");

  const form = useForm<AddUserFormValues>({
    resolver: zodResolver(addUserFormSchema),
    defaultValues: {
      fullName: "",
      email: "",
    },
  });

  const handleAction = (userId: string, action: string) => {
    toast({ title: `Action: ${action}`, description: `Performed ${action} on user ${userId}. (Simulated)`});
  };

  const onAddUserSubmit = (data: AddUserFormValues) => {
    console.log("Add User Data (Placeholder):", data);
    toast({
      title: "Add User (Placeholder)",
      description: `User "${data.fullName}" with role "${data.role}" would be added. This is a placeholder.`,
    });
    form.reset();
    setIsAddUserDialogOpen(false);
  };
  
  const getRoleBadgeVariant = (role: UserRole) => {
    switch(role) {
        case USER_ROLES.ADMIN: return "destructive";
        case USER_ROLES.RECRUITER: return "default";
        case USER_ROLES.HIRING_MANAGER: return "outline";
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
    return mockUsers.filter(user => {
      const searchMatch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          user.email.toLowerCase().includes(searchTerm.toLowerCase());
      const roleMatch = roleFilter === "all" || user.role === roleFilter;
      const statusMatch = statusFilter === "all" || user.status === statusFilter;
      return searchMatch && roleMatch && statusMatch;
    });
  }, [searchTerm, roleFilter, statusFilter]);


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
              <Button><PlusCircle className="mr-2 h-4 w-4" /> Add New User</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add New User</DialogTitle>
                <DialogDescription>
                  Fill in the details below to add a new user to the platform. (Placeholder)
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onAddUserSubmit)} className="space-y-4 py-4">
                  <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input placeholder="John Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="john.doe@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>User Role</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a role" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.values(USER_ROLES).map((roleValue) => (
                              <SelectItem key={roleValue} value={roleValue} className="capitalize">
                                {roleValue.replace('-', ' ')}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <DialogClose asChild>
                       <Button type="button" variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button type="submit">
                      <Save className="mr-2 h-4 w-4" /> Add User
                    </Button>
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
                <Input 
                  placeholder="Search users by name or email..." 
                  className="pl-8 w-full md:w-auto" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <div className="flex gap-2">
                 <Select value={roleFilter} onValueChange={(value) => setRoleFilter(value as UserRole | "all")}>
                    <SelectTrigger className="w-full md:w-[180px]"> <SelectValue placeholder="Filter by Role" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Roles</SelectItem>
                        {Object.values(USER_ROLES).map(r => <SelectItem key={r} value={r} className="capitalize">{r.replace("-", " ")}</SelectItem>)}
                    </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value)}>
                    <SelectTrigger className="w-full md:w-[180px]"><SelectValue placeholder="Filter by Status" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="Inactive">Inactive</SelectItem>
                        <SelectItem value="Pending">Pending</SelectItem>
                    </SelectContent>
                </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                            <AvatarImage src={`https://placehold.co/40x40.png?text=${user.name[0]}`} alt={user.name} data-ai-hint="person avatar"/>
                            <AvatarFallback>{user.name.split(" ").map(n=>n[0]).join("")}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{user.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell><Badge variant={getRoleBadgeVariant(user.role)} className="capitalize">{user.role.replace("-"," ")}</Badge></TableCell>
                  <TableCell><Badge variant={getStatusBadgeVariant(user.status)} className={
                      user.status === "Active" ? "bg-green-100 text-green-700 border-green-300" :
                      user.status === "Inactive" ? "bg-gray-100 text-gray-700 border-gray-300" :
                      user.status === "Pending" ? "bg-yellow-100 text-yellow-700 border-yellow-300" : ""
                  }>{user.status}</Badge></TableCell>
                  <TableCell>{user.lastLogin}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
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
              {filteredUsers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-24">No users found matching your criteria.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
