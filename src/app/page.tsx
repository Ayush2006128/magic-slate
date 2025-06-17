'use client';

import { useEffect, useState, useCallback } from 'react';
import { MagicCanvasSection } from '@/components/MagicCanvasSection';
import { OnboardingDialog, type OnboardingStep } from '@/components/OnboardingDialog';
import { getCookie, setCookie } from '@/lib/cookieUtils';
import { register } from '@/app/service_worker';

const PRIVACY_ACKNOWLEDGED_COOKIE_NAME = 'magicSlatePrivacyAcknowledged';
const TOUR_COOKIE_NAME = 'magicSlateTourFinished';

export default function HomePage() {
  const [currentOnboardingStep, setCurrentOnboardingStep] = useState<OnboardingStep | 'done'>('done');
  const [showOnboardingDialog, setShowOnboardingDialog] = useState(false);
  const [initialCheckComplete, setInitialCheckComplete] = useState(false);
  
  useEffect(() => {
    register();
    if (typeof window !== 'undefined') {
      const privacyAcknowledged = getCookie(PRIVACY_ACKNOWLEDGED_COOKIE_NAME) === 'true';
      const tourFinished = getCookie(TOUR_COOKIE_NAME) === 'true';

      let nextStep: OnboardingStep | 'done' = 'done';

      if (!privacyAcknowledged) {
        nextStep = 'privacy';
      } else if (!tourFinished) {
        nextStep = 'tour';
      }
      
      setCurrentOnboardingStep(nextStep);
      setShowOnboardingDialog(nextStep !== 'done');
    }
    setInitialCheckComplete(true);
  }, []);

  const handlePrivacyAcknowledged = () => {
    setCookie(PRIVACY_ACKNOWLEDGED_COOKIE_NAME, 'true', 365);
    // Check if tour needs to be shown next
    const tourFinished = getCookie(TOUR_COOKIE_NAME) === 'true';
    if (!tourFinished) {
      setCurrentOnboardingStep('tour');
    } else {
      setShowOnboardingDialog(false);
      setCurrentOnboardingStep('done');
    }
  };

  const handleTourFinished = () => {
    setCookie(TOUR_COOKIE_NAME, 'true', 365);
    setShowOnboardingDialog(false);
    setCurrentOnboardingStep('done');
  };

  if (!initialCheckComplete) {
    return (
      <div className="flex flex-col flex-grow h-full items-center justify-center">
        {/* Optional: Add a loading spinner here */}
      </div>
    );
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
