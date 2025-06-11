
"use client";

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Shield, Video, Info, Mic, Camera } from 'lucide-react';

interface AIInterviewConsentProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAccept: () => void;
}

const AIInterviewConsent: React.FC<AIInterviewConsentProps> = ({
  open,
  onOpenChange,
  onAccept,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl shadow-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Shield className="h-6 w-6 text-primary" />
            AI Interview Guidelines & Consent
          </DialogTitle>
          <DialogDescription>
            Please review these important guidelines before starting your AI interview.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4 max-h-[60vh] overflow-y-auto pr-2">
          <div>
            <h3 className="font-semibold mb-2 flex items-center gap-2 text-md">
              <Camera className="h-5 w-5 text-primary" />
              Device & Environment Setup
            </h3>
            <ul className="space-y-1.5 text-sm text-muted-foreground list-disc list-inside pl-2">
              <li>Find a quiet, well-lit room with minimal background distractions.</li>
              <li>Ensure your face is clearly visible with good lighting in front of you.</li>
              <li>Test your camera and microphone before starting.</li>
              <li>Use a plain, professional background or a tidy space.</li>
              <li>Maintain a stable internet connection.</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-2 flex items-center gap-2 text-md">
              <Shield className="h-5 w-5 text-primary" />
              Interview Rules & Conduct
            </h3>
            <ul className="space-y-1.5 text-sm text-muted-foreground list-disc list-inside pl-2">
              <li>No dual screens or additional devices allowed during the interview.</li>
              <li>Reading from prepared answers or documents is prohibited.</li>
              <li>Stay within the camera frame throughout the interview.</li>
              <li>No headphones or earpieces unless required for accessibility.</li>
              <li>No other applications or browsers should be open.</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-2 flex items-center gap-2 text-md">
              <Info className="h-5 w-5 text-primary" />
              Important Consents & Notes
            </h3>
            <ul className="space-y-1.5 text-sm text-muted-foreground list-disc list-inside pl-2">
              <li>This interview requires access to your camera for video recording.</li>
              <li>This interview requires access to your microphone for interacting with the AI and recording your audio.</li>
              <li>Your entire session (video and audio/transcript) will be recorded and analyzed by AI to provide feedback.</li>
              <li>Any violation of guidelines may result in interview disqualification.</li>
              <li>You can pause the interview for emergencies (if feature available), but excessive pauses will be flagged.</li>
              <li>Technical issues should be reported immediately if a support channel is provided.</li>
            </ul>
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row sm:justify-end space-y-2 sm:space-y-0 sm:space-x-2 mt-6 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onAccept} className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground">
            <Shield className="h-4 w-4" />
            Accept & Start Interview
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AIInterviewConsent;
