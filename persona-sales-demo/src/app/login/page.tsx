
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

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center"><p>Loading...</p></div>;
  }

  if (user && !isLoading) {
    // Brief moment while redirecting
  }


  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/10 via-background to-background p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <Logo className="justify-center mb-4" text="Persona AI" />
          <CardTitle className="text-2xl">Welcome to Persona AI</CardTitle>
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
