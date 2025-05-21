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
    if (user && role && pathname.startsWith('/dashboard/')) {
      const pathRole = pathname.split('/')[2];
      if (pathRole !== role || !DEMO_USERS[role as keyof typeof DEMO_USERS]) {
         // If role in path doesn't match current user's role, or is invalid
        console.warn(`Role mismatch or invalid role in path. Path: ${pathname}, User Role: ${role}`);
        router.push(`/dashboard/${role}/dashboard`); // Redirect to user's correct dashboard
      }
    }
  }, [user, role, pathname, router]);


  if (isLoading || !user) {
    // You can render a loading spinner here
    return (
        <div className="flex h-screen items-center justify-center">
            <p>Loading...</p>
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
