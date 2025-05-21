"use client";

import type { ReactNode } from 'react';
import { AuthProvider } from '@/contexts/AuthContext';
import { GuidedTourProvider } from '@/contexts/GuidedTourContext';
import { TooltipProvider } from '@/components/ui/tooltip';

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <TooltipProvider>
        <GuidedTourProvider>
            {children}
        </GuidedTourProvider>
      </TooltipProvider>
    </AuthProvider>
  );
}
