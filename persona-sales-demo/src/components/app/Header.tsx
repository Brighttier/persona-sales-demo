import { Logo } from "@/components/app/Logo";
import { UserProfileDropdown } from "@/components/app/UserProfileDropdown";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Briefcase } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between max-w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4">
          <SidebarTrigger className="md:hidden" />
          <Logo className="hidden md:flex" />
        </div>
        <div className="flex items-center gap-4">
            <Button variant="outline" asChild>
                <Link href="/jobs">
                    <Briefcase className="mr-2 h-4 w-4" />
                    Jobs
                </Link>
            </Button>
          <UserProfileDropdown />
        </div>
      </div>
    </header>
  );
}
