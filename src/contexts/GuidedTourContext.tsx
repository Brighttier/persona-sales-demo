
"use client";

import type { NavLink } from '@/config/nav-links';
import { getTourStepsForRole } from '@/config/nav-links';
import type { ReactNode} from 'react';
import { createContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { usePathname, useRouter } from 'next/navigation';

interface TourStepData extends NavLink {
  targetId: string; // DOM element ID to highlight
}

interface GuidedTourContextType {
  isTourActive: boolean;
  currentStepIndex: number;
  currentStep: TourStepData | null;
  startTour: () => void;
  nextStep: () => void;
  prevStep: () => void;
  endTour: () => void;
  isLastStep: boolean;
}

export const GuidedTourContext = createContext<GuidedTourContextType | undefined>(undefined);

const LOCAL_STORAGE_TOUR_PREFIX = 'persona-ai-tour-';

export function GuidedTourProvider({ children }: { children: ReactNode }) {
  const { role, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const [isTourActive, setIsTourActive] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [tourSteps, setTourSteps] = useState<TourStepData[]>([]);
  
  useEffect(() => {
    if (role) {
      const stepsForRole = getTourStepsForRole(role);
      setTourSteps(stepsForRole.map(step => ({ ...step, targetId: step.tourStepId || step.href })));
    } else {
      setTourSteps([]);
    }
  }, [role]);

  const currentStep = isTourActive && tourSteps.length > 0 ? tourSteps[currentStepIndex] : null;
  const isLastStep = currentStepIndex === tourSteps.length - 1;

  const navigateToStepPage = useCallback((stepIndex: number) => {
    if (tourSteps[stepIndex] && tourSteps[stepIndex].href !== pathname) {
      router.push(tourSteps[stepIndex].href);
    }
  }, [tourSteps, pathname, router]);

  const startTour = useCallback(() => {
    if (tourSteps.length > 0) {
      const tourCompletedKey = `${LOCAL_STORAGE_TOUR_PREFIX}${role}-completed`;
      // Optional: Uncomment to allow re-taking the tour
      // localStorage.removeItem(tourCompletedKey); 
      
      const hasCompletedTour = localStorage.getItem(tourCompletedKey);
      if (!hasCompletedTour) {
        setCurrentStepIndex(0);
        setIsTourActive(true);
        navigateToStepPage(0);
      } else {
        // console.log("Tour already completed for this role.");
      }
    }
  }, [tourSteps, role, navigateToStepPage]);

  const endTour = useCallback(() => {
    setIsTourActive(false);
    setCurrentStepIndex(0);
    if (role) {
      localStorage.setItem(`${LOCAL_STORAGE_TOUR_PREFIX}${role}-completed`, 'true');
    }
  }, [role]);

  const nextStep = useCallback(() => {
    if (isLastStep) {
      endTour();
    } else {
      const nextIndex = currentStepIndex + 1;
      setCurrentStepIndex(nextIndex);
      navigateToStepPage(nextIndex);
    }
  }, [isLastStep, currentStepIndex, endTour, navigateToStepPage]);

  const prevStep = useCallback(() => {
    if (currentStepIndex > 0) {
      const prevIndex = currentStepIndex - 1;
      setCurrentStepIndex(prevIndex);
      navigateToStepPage(prevIndex);
    }
  }, [currentStepIndex, navigateToStepPage]);
  
  // Auto-start tour for new users (if not completed)
  // This could be triggered on first login or dashboard visit
  useEffect(() => {
    // Simple auto-start logic: if user is logged in and on their dashboard, try to start tour.
    // A more robust solution might involve a "first login" flag.
    if (user && role && pathname === `/dashboard/${role}/dashboard`) {
        // Small delay to ensure page elements are loaded
        // setTimeout(() => startTour(), 500); 
        // For now, we will rely on manual start via button
    }
  }, [user, role, pathname, startTour]);


  return (
    <GuidedTourContext.Provider value={{ 
        isTourActive, 
        currentStepIndex, 
        currentStep, 
        startTour, 
        nextStep, 
        prevStep, 
        endTour,
        isLastStep 
    }}>
      {children}
    </GuidedTourContext.Provider>
  );
}
