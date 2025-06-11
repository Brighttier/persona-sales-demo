
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
  useSidebar,
} from "@/components/ui/sidebar";
import { Logo } from './Logo';
import { Button } from '../ui/button';
import { useGuidedTour } from '@/hooks/useGuidedTour';
import { WandSparkles, ChevronsLeft } from 'lucide-react';


export function SidebarNav() {
  const { role } = useAuth();
  const pathname = usePathname();
  const { open, isMobile, toggleSidebar } = useSidebar();
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
            // className prop for variants is handled by SidebarMenuSubButton itself
          >
            <Link href={link.href} className="flex items-center gap-2 w-full"> {/* Ensure internal layout */}
              <span className="truncate">{link.label}</span>
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
          // className for variants handled by SidebarMenuButton
          tooltip={link.label}
          // icon prop is NOT used by SidebarMenuButton when asChild is true
        >
          <Link href={link.href} className="flex items-center gap-2 w-full"> {/* Ensure internal layout */}
            {link.icon && <link.icon />} {/* Icon rendered inside Link */}
            {open && <span className="truncate">{link.label}</span>} {/* Label rendered inside Link */}
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
         {!isMobile && open && (
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
