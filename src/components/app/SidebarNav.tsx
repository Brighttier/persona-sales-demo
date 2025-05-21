
"use client";

import { NAV_LINKS, getNavLinksForRole, type NavLink } from '@/config/nav-links';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarSeparator,
  useSidebar, // Import useSidebar
} from "@/components/ui/sidebar";
import { Logo } from './Logo';
import { Button } from '../ui/button';
import { useGuidedTour } from '@/hooks/useGuidedTour';
import { WandSparkles, ChevronsLeft } from 'lucide-react'; // Import ChevronsLeft


export function SidebarNav() {
  const { role } = useAuth();
  const pathname = usePathname();
  const { open, isMobile, toggleSidebar } = useSidebar(); // Get open, isMobile, and toggleSidebar
  const { startTour, isTourActive } = useGuidedTour();
  const navLinks = getNavLinksForRole(role);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  const renderLink = (link: NavLink, isSubLink = false) => {
    const itemKey = link.href;
    const tourProps: { "data-tour-id"?: string } = {};
    if (link.tourStepId) {
      tourProps["data-tour-id"] = link.tourStepId;
    }

    if (isSubLink) {
      return (
        <SidebarMenuSubItem key={itemKey} {...tourProps}>
          <SidebarMenuSubButton
            asChild
            isActive={isActive(link.href)}
            className="justify-start"
          >
            <Link href={link.href}>
              {link.label}
            </Link>
          </SidebarMenuSubButton>
        </SidebarMenuSubItem>
      );
    }

    return (
      <SidebarMenuItem key={itemKey} {...tourProps}>
        <SidebarMenuButton
          asChild
          isActive={isActive(link.href)}
          className="justify-start"
          icon={<link.icon />} 
          tooltip={link.label}
        >
          <Link href={link.href}>
            {open && link.label} 
          </Link>
        </SidebarMenuButton>
        {link.subLinks && link.subLinks.length > 0 && open && (
          <SidebarMenuSub>
            {link.subLinks.map(subLink => renderLink(subLink, true))}
          </SidebarMenuSub>
        )}
      </SidebarMenuItem>
    );
  };

  return (
    <>
      <SidebarHeader>
        <Logo iconSize={24} textSize="text-xl" className={cn(!open && "hidden")} />
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {navLinks.map(link => renderLink(link))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="mt-auto">
        <SidebarSeparator />
         {!isMobile && open && ( // Only show on desktop when sidebar is expanded
          <Button
            variant="ghost"
            size="icon"
            className="mx-auto my-1 h-7 w-7 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
            onClick={toggleSidebar}
            aria-label="Collapse sidebar"
          >
            <ChevronsLeft className="h-5 w-5" />
          </Button>
        )}
        <div className={cn("p-2 space-y-2", open ? "text-sm" : "text-center")}>
          <Button variant="outline" size="sm" className="w-full" onClick={() => startTour()} disabled={isTourActive}>
            <WandSparkles className={cn("h-4 w-4", open && "mr-2")} />
            {open && (isTourActive ? "Tour in progress..." : "Start Guided Tour")}
          </Button>
          <p className={cn("text-xs text-sidebar-foreground/70", !open && "hidden")}>
            AI Credits: Unlimited (Demo)
          </p>
        </div>
      </SidebarFooter>
    </>
  );
}

    