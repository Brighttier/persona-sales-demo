
"use client";

import { useGuidedTour } from "@/hooks/useGuidedTour";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

export function TourStep() {
  const { isTourActive, currentStep, nextStep, prevStep, endTour, isLastStep, currentStepIndex, startTour } = useGuidedTour();
  const highlightedElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    // Clean up previous highlight
    if (highlightedElementRef.current) {
      highlightedElementRef.current.style.outline = "";
      highlightedElementRef.current.style.boxShadow = "";
      highlightedElementRef.current.style.position = "";
      highlightedElementRef.current.style.zIndex = "";
      highlightedElementRef.current = null; // Reset ref after cleanup
    }

    if (isTourActive && currentStep) {
      const targetElement = document.querySelector(`[data-tour-id="${currentStep.targetId}"]`) as HTMLElement;
      if (targetElement) {
        targetElement.style.outline = "3px solid hsl(var(--accent))";
        targetElement.style.boxShadow = "0 0 0 9999px rgba(0, 0, 0, 0.5)"; // Overlay effect
        targetElement.style.position = "relative"; // Ensure z-index works
        targetElement.style.zIndex = "10000"; // Bring to front
        targetElement.scrollIntoView({ behavior: "smooth", block: "center" });
        highlightedElementRef.current = targetElement;
      }
    }

    // Cleanup on component unmount or when tour ends/step changes
    return () => {
      if (highlightedElementRef.current) {
        highlightedElementRef.current.style.outline = "";
        highlightedElementRef.current.style.boxShadow = "";
        highlightedElementRef.current.style.position = "";
        highlightedElementRef.current.style.zIndex = "";
        highlightedElementRef.current = null; // Also reset here
      }
    };
  }, [isTourActive, currentStep]);

  if (!isTourActive || !currentStep) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none">
      <Card className="w-full max-w-sm shadow-2xl pointer-events-auto bg-background fixed bottom-10 right-10 animate-in slide-in-from-bottom-5 fade-in-0 duration-300">
        <CardHeader>
          <CardTitle className="text-lg">{currentStep.label}</CardTitle>
          <CardDescription>{currentStep.tourText || "Explore this feature!"}</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Progress indicator can be added here */}
          {/* <p className="text-xs text-muted-foreground">Step {currentStepIndex + 1} of X</p> */}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={endTour} size="sm">End Tour</Button>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={prevStep} disabled={currentStepIndex === 0} size="sm">
              <ArrowLeft className="mr-1 h-4 w-4"/> Prev
            </Button>
            <Button onClick={nextStep} size="sm">
              {isLastStep ? "Finish" : "Next"} {isLastStep ? <Check className="ml-1 h-4 w-4"/> : <ArrowRight className="ml-1 h-4 w-4"/>}
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
