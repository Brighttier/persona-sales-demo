
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { USER_ROLES, type UserRole } from "@/config/roles";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Logo } from "@/components/app/Logo";

export default function LoginPage() {
  const [selectedRole, setSelectedRole] = useState<UserRole | undefined>(undefined);
  const { login, user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user && user.role) {
      router.push(`/dashboard/${user.role}/dashboard`);
    }
  }, [user, isLoading, router]);

  const handleLogin = () => {
    if (selectedRole) {
      login(selectedRole);
    }
  };

  // Show "Loading..." only while the AuthContext is determining the initial auth state.
  // If isLoading is false:
  // - and user is null, the form will render.
  // - and user is true, the useEffect above will handle the redirect.
  if (isLoading) {
    return <div className="flex h-screen items-center justify-center"><p>Loading...</p></div>;
  }

  // If already logged in (user is true) and not loading, the useEffect should have redirected.
  // If somehow the redirect hasn't happened yet, and we are not loading, but user is true,
  // rendering the form momentarily is okay as redirect will occur.
  // This prevents getting stuck if user is true.
  if (user && !isLoading) {
    // This state should ideally be very brief as useEffect redirects.
    // You could show a specific "Redirecting..." message or just let the form flash.
    // For now, let the useEffect handle it which might cause a brief form flash.
    // Alternatively, return a redirecting message:
    // return <div className="flex h-screen items-center justify-center"><p>Redirecting...</p></div>;
    // However, sticking to the form rendering and letting useEffect redirect is common.
  }


  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/10 via-background to-background p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <Logo className="justify-center mb-4" text="Persona AI" />
          <CardTitle className="text-2xl">Welcome to TalentVerse AI</CardTitle>
          <CardDescription>Select your role to continue (Demo Login)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="role">Select Role</Label>
            <Select onValueChange={(value) => setSelectedRole(value as UserRole)} value={selectedRole}>
              <SelectTrigger id="role">
                <SelectValue placeholder="Choose your role..." />
              </SelectTrigger>
              <SelectContent>
                {Object.values(USER_ROLES).map((role) => (
                  <SelectItem key={role} value={role} className="capitalize">
                    {role.replace('-', ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
        <CardFooter>
          <Button className="w-full" onClick={handleLogin} disabled={!selectedRole}>
            Login as {selectedRole ? selectedRole.replace('-', ' ') : '...'}
          </Button>
        </CardFooter>
         <p className="px-6 pb-4 text-center text-xs text-muted-foreground">
            This is a demo environment. No real credentials are required.
          </p>
      </Card>
    </div>
  );
}
