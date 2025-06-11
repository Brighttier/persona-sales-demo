"use client";

import { GuidedTourContext } from '@/contexts/GuidedTourContext';
import { useContext } from 'react';

export function useGuidedTour() {
  const context = useContext(GuidedTourContext);
  if (context === undefined) {
    throw new Error('useGuidedTour must be used within a GuidedTourProvider');
  }
  return context;
}
