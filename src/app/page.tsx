
'use client';

import { useEffect, useState, useCallback } from 'react';
import { MagicCanvasSection } from '@/components/MagicCanvasSection';
import { OnboardingDialog, type OnboardingStep } from '@/components/OnboardingDialog';
import { getCookie, setCookie } from '@/lib/cookieUtils';
import { encryptData, decryptData } from '@/lib/cryptoUtils';
import { register } from '@/app/service_worker';

const PRIVACY_ACKNOWLEDGED_COOKIE_NAME = 'magicSlatePrivacyAcknowledged';
const TOUR_COOKIE_NAME = 'magicSlateTourFinished';
const API_KEY_ENCRYPTED_COOKIE_NAME = 'genkitUserApiKeyEncrypted';
const API_KEY_IV_COOKIE_NAME = 'genkitUserApiKeyIV';
const API_KEY_SALT_COOKIE_NAME = 'genkitUserApiKeySalt';

export default function HomePage() {
  const [currentOnboardingStep, setCurrentOnboardingStep] = useState<OnboardingStep | 'done'>('done');
  const [showOnboardingDialog, setShowOnboardingDialog] = useState(false);
  const [userApiKey, setUserApiKey] = useState<string | null>(null);
  
  const [initialCheckComplete, setInitialCheckComplete] = useState(false);

  const clearApiCookiesAndResetState = useCallback(() => {
    if (typeof window !== 'undefined') {
      setCookie(API_KEY_ENCRYPTED_COOKIE_NAME, '', -1); 
      setCookie(API_KEY_IV_COOKIE_NAME, '', -1); 
      setCookie(API_KEY_SALT_COOKIE_NAME, '', -1); 
      setUserApiKey(null);
      setCurrentOnboardingStep('apiKey');
      setShowOnboardingDialog(true);
    }
  }, []);
  
  useEffect(() => {
    register();
    if (typeof window !== 'undefined') {
      const privacyAcknowledged = getCookie(PRIVACY_ACKNOWLEDGED_COOKIE_NAME) === 'true';
      const apiKeyEncrypted = getCookie(API_KEY_ENCRYPTED_COOKIE_NAME);
      const tourFinished = getCookie(TOUR_COOKIE_NAME) === 'true';

      let nextStep: OnboardingStep | 'done' = 'done';

      if (!privacyAcknowledged) {
        nextStep = 'privacy';
      } else if (!apiKeyEncrypted) {
        nextStep = 'apiKey';
      } else if (!tourFinished) {
        nextStep = 'tour';
      }
      
      setCurrentOnboardingStep(nextStep);
      setShowOnboardingDialog(nextStep !== 'done');
      
      // If API key might exist, try to decrypt it
      if (privacyAcknowledged && apiKeyEncrypted) {
        const iv = getCookie(API_KEY_IV_COOKIE_NAME);
        const salt = getCookie(API_KEY_SALT_COOKIE_NAME);
        if (iv && salt) {
          decryptData(apiKeyEncrypted, iv, salt).then(decryptedKey => {
            if (decryptedKey) {
              setUserApiKey(decryptedKey);
            } else {
              // Decryption failed or key invalid, but privacy was acknowledged.
              // If current step became 'done' due to optimistic cookie check, revert to 'apiKey'.
              if (getCurrentOnboardingStepBasedOnCookies() === 'done') {
                clearApiCookiesAndResetState(); // This will set step to 'apiKey' and show dialog
              }
            }
          }).catch(error => {
            console.error("Error decrypting API key during initial check:", error);
            if (getCurrentOnboardingStepBasedOnCookies() === 'done') {
               clearApiCookiesAndResetState();
            }
          });
        } else {
           // Missing IV or Salt, API key effectively not set
           if (nextStep === 'done') { // Only force API key step if all others were 'done'
             setCurrentOnboardingStep('apiKey');
             setShowOnboardingDialog(true);
           }
        }
      }
    }
    setInitialCheckComplete(true);
  }, [clearApiCookiesAndResetState]);

  // Helper to re-evaluate current onboarding step based on cookies
  // This is useful for knowing where to go if a step "fails" like API key decryption
  const getCurrentOnboardingStepBasedOnCookies = (): OnboardingStep | 'done' => {
    const privacyAcknowledged = getCookie(PRIVACY_ACKNOWLEDGED_COOKIE_NAME) === 'true';
    const apiKeyEncrypted = getCookie(API_KEY_ENCRYPTED_COOKIE_NAME); // Just check existence
    const tourFinished = getCookie(TOUR_COOKIE_NAME) === 'true';

    if (!privacyAcknowledged) return 'privacy';
    if (!apiKeyEncrypted) return 'apiKey'; // If privacy done, next is API key
    if (!tourFinished) return 'tour'; // Then tour
    return 'done';
  };


  const handlePrivacyAcknowledged = () => {
    setCookie(PRIVACY_ACKNOWLEDGED_COOKIE_NAME, 'true', 365);
    // Check if API key needs to be entered next
    const apiKeyEncrypted = getCookie(API_KEY_ENCRYPTED_COOKIE_NAME);
    if (!apiKeyEncrypted) {
      setCurrentOnboardingStep('apiKey');
    } else {
      // API key cookie exists, try to load it (or it was loaded by initial useEffect)
      // Then check if tour is next
      const tourFinished = getCookie(TOUR_COOKIE_NAME) === 'true';
      if (!tourFinished) {
        setCurrentOnboardingStep('tour');
      } else {
        setShowOnboardingDialog(false);
        setCurrentOnboardingStep('done');
      }
    }
  };

  const handleApiKeySubmitted = async (apiKey: string) => {
    const encryptionResult = await encryptData(apiKey);
    if (encryptionResult) {
      setCookie(API_KEY_ENCRYPTED_COOKIE_NAME, encryptionResult.encryptedHex, 30);
      setCookie(API_KEY_IV_COOKIE_NAME, encryptionResult.ivHex, 30);
      setCookie(API_KEY_SALT_COOKIE_NAME, encryptionResult.saltHex, 30);
      setUserApiKey(apiKey);
      
      const tourFinished = getCookie(TOUR_COOKIE_NAME) === 'true';
      if (!tourFinished) {
        setCurrentOnboardingStep('tour');
      } else {
        setShowOnboardingDialog(false);
        setCurrentOnboardingStep('done');
      }
    } else {
      throw new Error("Encryption failed. Could not securely store the API key.");
    }
  };
  
  const handleApiKeySkippedOrClosed = () => {
    // If user skips API key, they can't use AI features.
    // Transition to tour if not finished, otherwise close dialog.
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

  const requestApiKeyEntry = () => {
    // This function is called by MagicCanvasSection if an API key error occurs
    clearApiCookiesAndResetState(); // This clears cookies, sets API key to null, and shows onboarding at API key step
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
      <MagicCanvasSection 
        userApiKey={userApiKey} 
        onInvalidApiKey={requestApiKeyEntry} 
      />

      {showOnboardingDialog && currentOnboardingStep !== 'done' && (
        <OnboardingDialog
          initialStep={currentOnboardingStep}
          onPrivacyAcknowledged={handlePrivacyAcknowledged}
          onApiKeySubmitted={handleApiKeySubmitted}
          onApiKeySkipped={handleApiKeySkippedOrClosed} // Added for explicit skip/close
          onTourFinished={handleTourFinished}
        />
      )}
    </div>
  );
}
