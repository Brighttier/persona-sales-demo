"use client";

import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function DashboardRedirectPage() {
  const { user, role, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (user && role) {
        router.replace(`/dashboard/${role}/dashboard`);
      } else {
        router.replace("/login");
      }
    }
  }, [user, role, isLoading, router]);

  return (
    <div className="flex h-screen items-center justify-center">
      <p>Loading dashboard...</p>
    </div>
  );
}
