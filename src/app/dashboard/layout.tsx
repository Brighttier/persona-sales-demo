
"use client";

import type { ReactNode } from 'react';
import { SidebarProvider, Sidebar, SidebarInset, SidebarRail } from "@/components/ui/sidebar";
import { Header } from '@/components/app/Header';
import { SidebarNav } from '@/components/app/SidebarNav';
import { useAuth } from '@/hooks/useAuth';
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { DEMO_USERS } from '@/config/roles'; // For validating role in path
import { TourStep } from '@/components/app/guided-tour/TourStep';


export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, isLoading, role } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  // Basic route protection: check if current role matches the path segment
  useEffect(() => {
    if (!isLoading && user && role && pathname.startsWith('/dashboard/')) {
      const pathRole = pathname.split('/')[2];
      if (pathRole !== role) { // Simplified: if pathRole doesn't match current role, redirect
        console.warn(`Role mismatch in path. Path: ${pathname}, User Role: ${role}. Redirecting.`);
        router.push(`/dashboard/${role}/dashboard`); // Redirect to user's correct dashboard
      } else if (!DEMO_USERS[role as keyof typeof DEMO_USERS]) {
        // This case implies the 'role' itself is invalid according to DEMO_USERS, which is unlikely if login works.
        // However, as a safeguard, if the role is somehow invalid, redirect to login.
        console.warn(`Invalid role detected: ${role}. Redirecting to login.`);
        router.push('/login');
      }
    }
  }, [user, role, pathname, router, isLoading]); // Added isLoading to dependencies


  if (isLoading || (!isLoading && !user)) { // Keep showing loading if user is not yet determined, or redirecting
    return (
        <div className="flex h-screen items-center justify-center bg-background">
            {/* You can use a more sophisticated loading spinner here if desired */}
            <svg className="animate-spin h-10 w-10 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
        </div>
    );
  }
  
  return (
    <SidebarProvider defaultOpen>
      <div className="flex min-h-screen w-full">
        <Sidebar collapsible="icon" className="border-r">
          <SidebarNav />
          <SidebarRail />
        </Sidebar>
        <div className="flex flex-1 flex-col">
          <Header />
          <SidebarInset>
            <main className="flex-1 p-4 md:p-6 lg:p-8">
              {children}
            </main>
          </SidebarInset>
        </div>
      </div>
      <TourStep />
    </SidebarProvider>
  );
}
