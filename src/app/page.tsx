
'use client';

import { useEffect, useState } from 'react';
import { MagicCanvasSection } from '@/components/MagicCanvasSection';
import { AppTourDialog } from '@/components/AppTourDialog';
import { ApiKeyDialog } from '@/components/ApiKeyDialog';
import { PrivacyNoticeDialog } from '@/components/PrivacyNoticeDialog';
import { getCookie, setCookie } from '@/lib/cookieUtils';
import { encryptData, decryptData } from '@/lib/cryptoUtils';
import { register } from '@/app/service_worker';

const PRIVACY_ACKNOWLEDGED_COOKIE_NAME = 'magicSlatePrivacyAcknowledged';
const TOUR_COOKIE_NAME = 'magicSlateTourFinished';
const API_KEY_ENCRYPTED_COOKIE_NAME = 'genkitUserApiKeyEncrypted';
const API_KEY_IV_COOKIE_NAME = 'genkitUserApiKeyIV';
const API_KEY_SALT_COOKIE_NAME = 'genkitUserApiKeySalt';

export default function HomePage() {
  const [showPrivacyNoticeDialog, setShowPrivacyNoticeDialog] = useState(false);
  const [isPrivacyAcknowledged, setIsPrivacyAcknowledged] = useState(false);
  
  const [showTour, setShowTour] = useState(false);
  const [showApiKeyDialog, setShowApiKeyDialog] = useState(false);
  const [userApiKey, setUserApiKey] = useState<string | null>(null);
  const [isApiKeyChecked, setIsApiKeyChecked] = useState(false);

  const clearApiCookiesAndResetState = () => {
    if (typeof window !== 'undefined') {
      setCookie(API_KEY_ENCRYPTED_COOKIE_NAME, '', -1); 
      setCookie(API_KEY_IV_COOKIE_NAME, '', -1); 
      setCookie(API_KEY_SALT_COOKIE_NAME, '', -1); 
      setUserApiKey(null);
      setShowApiKeyDialog(true); // Re-prompt for API key
    }
  };
  
  // Step 1: Check for Privacy Notice Acknowledgment
  useEffect(() => {
    register();
    if (typeof window !== 'undefined') {
      const privacyAcknowledged = getCookie(PRIVACY_ACKNOWLEDGED_COOKIE_NAME);
      if (privacyAcknowledged !== 'true') {
        setShowPrivacyNoticeDialog(true);
      } else {
        setIsPrivacyAcknowledged(true);
      }
    }
  }, []);

  // Step 2: Check for API Key (only if privacy notice is acknowledged)
  useEffect(() => {
    async function checkApiKey() {
      if (typeof window !== 'undefined' && isPrivacyAcknowledged) {
        const encryptedKey = getCookie(API_KEY_ENCRYPTED_COOKIE_NAME);
        const iv = getCookie(API_KEY_IV_COOKIE_NAME);
        const salt = getCookie(API_KEY_SALT_COOKIE_NAME);

        if (encryptedKey && iv && salt) {
          try {
            const decryptedKey = await decryptData(encryptedKey, iv, salt);
            if (decryptedKey) {
              setUserApiKey(decryptedKey);
            } else {
              clearApiCookiesAndResetState(); // Decryption failed
            }
          } catch (error) {
            console.error("Error decrypting API key:", error);
            clearApiCookiesAndResetState(); // Decryption error
          }
        } else {
          setShowApiKeyDialog(true); // No key found
        }
        setIsApiKeyChecked(true); 
      }
    }
    if (isPrivacyAcknowledged) { // Only run if privacy is acknowledged
      checkApiKey();
    }
  }, [isPrivacyAcknowledged]);

  // Step 3: Check for App Tour (only if privacy acknowledged, API key checked, and API dialog not shown)
  useEffect(() => {
    if (isPrivacyAcknowledged && isApiKeyChecked && !showApiKeyDialog) {
      const tourFinished = getCookie(TOUR_COOKIE_NAME);
      if (tourFinished !== 'true') {
        setShowTour(true);
      }
    }
  }, [isPrivacyAcknowledged, isApiKeyChecked, showApiKeyDialog]);

  const handlePrivacyNoticeAcknowledge = () => {
    if (typeof window !== 'undefined') {
      setCookie(PRIVACY_ACKNOWLEDGED_COOKIE_NAME, 'true', 365);
    }
    setShowPrivacyNoticeDialog(false);
    setIsPrivacyAcknowledged(true); // Signal that privacy is now acknowledged
  };

  const handleFinishTour = () => {
    if (typeof window !== 'undefined') {
      setCookie(TOUR_COOKIE_NAME, 'true', 365);
    }
    setShowTour(false);
  };

  const handleApiKeySubmit = async (apiKey: string) => {
    if (typeof window !== 'undefined') {
      const encryptionResult = await encryptData(apiKey);
      if (encryptionResult) {
        setCookie(API_KEY_ENCRYPTED_COOKIE_NAME, encryptionResult.encryptedHex, 30);
        setCookie(API_KEY_IV_COOKIE_NAME, encryptionResult.ivHex, 30);
        setCookie(API_KEY_SALT_COOKIE_NAME, encryptionResult.saltHex, 30);
        setUserApiKey(apiKey); 
        setShowApiKeyDialog(false);
      } else {
        // This case should be handled by ApiKeyDialog's toast, but good to have a backup throw.
        throw new Error("Encryption failed. Could not securely store the API key.");
      }
    }
  };


  return (
    <div className="flex flex-col flex-grow h-full">
      <MagicCanvasSection 
        userApiKey={userApiKey} 
        onInvalidApiKey={clearApiCookiesAndResetState} 
      />

      {/* Dialogs are rendered based on their respective show states */}
      <PrivacyNoticeDialog
        isOpen={showPrivacyNoticeDialog}
        onAcknowledge={handlePrivacyNoticeAcknowledge}
      />

      {isPrivacyAcknowledged && isApiKeyChecked && ( 
        <ApiKeyDialog
          isOpen={showApiKeyDialog}
          onClose={() => {
            // If user closes API key dialog without submitting, 
            // and no key is set, they can't use AI features.
            // Consider if they should be forced or if closing is an acceptable "I don't have a key"
            setShowApiKeyDialog(false) 
          }}
          onApiKeySubmit={handleApiKeySubmit}
        />
      )}
      
      {isPrivacyAcknowledged && isApiKeyChecked && !showApiKeyDialog && ( 
          <AppTourDialog isOpen={showTour} onClose={handleFinishTour} />
      )}
    </div>
  );
}
