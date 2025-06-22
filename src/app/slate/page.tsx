'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { MagicCanvasSection } from '@/components/MagicCanvasSection';
import { OnboardingDialog, type OnboardingStep } from '@/components/OnboardingDialog';
import { register } from '@/app/service_worker';
import { useRouter } from 'next/navigation';

export default function SlatePage() {
  const { user, isSignedIn, isLoaded } = useUser();
  const router = useRouter();
  const [currentOnboardingStep, setCurrentOnboardingStep] = useState<OnboardingStep | 'done'>('done');
  const [showOnboardingDialog, setShowOnboardingDialog] = useState(false);
  const [initialCheckComplete, setInitialCheckComplete] = useState(false);
  
  useEffect(() => {
    register();
    
    if (isLoaded) {
      // Redirect to home if not signed in
      if (!isSignedIn) {
        router.push('/');
        return;
      }

      let nextStep: OnboardingStep | 'done' = 'done';

      if (isSignedIn && user) {
        // Check if user is new (created within the last 24 hours)
        if (user.createdAt) {
          const userCreatedAt = new Date(user.createdAt);
          const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
          const isNewUser = userCreatedAt > twentyFourHoursAgo;
          
          if (isNewUser) {
            nextStep = 'privacy';
          }
        }
      }
      
      setCurrentOnboardingStep(nextStep);
      setShowOnboardingDialog(nextStep !== 'done');
      setInitialCheckComplete(true);
    }
  }, [isLoaded, isSignedIn, user, router]);

  const handlePrivacyAcknowledged = () => {
    // Check if tour needs to be shown next
    // For new users, we'll show the tour after privacy
    setCurrentOnboardingStep('tour');
  };

  const handleTourFinished = () => {
    setShowOnboardingDialog(false);
    setCurrentOnboardingStep('done');
  };

  if (!initialCheckComplete || !isLoaded) {
    return (
      <div className="flex flex-col flex-grow h-full items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If not signed in, don't render anything (will redirect)
  if (!isSignedIn) {
    return null;
  }

  return (
    <div className="flex flex-col flex-grow h-full">
      <MagicCanvasSection />

      {showOnboardingDialog && currentOnboardingStep !== 'done' && (
        <OnboardingDialog
          initialStep={currentOnboardingStep}
          onPrivacyAcknowledged={handlePrivacyAcknowledged}
          onTourFinished={handleTourFinished}
        />
      )}
    </div>
  );
} 