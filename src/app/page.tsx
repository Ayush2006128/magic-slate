
'use client';

import { useEffect, useState } from 'react';
import { MagicCanvasSection } from '@/components/MagicCanvasSection';
import { AppTourDialog } from '@/components/AppTourDialog';
import { ApiKeyDialog } from '@/components/ApiKeyDialog'; // Import ApiKeyDialog
import { getCookie, setCookie } from '@/lib/cookieUtils';
import { encryptData, decryptData } from '@/lib/cryptoUtils'; // Import crypto utils
import { register } from '@/app/service_worker';

const TOUR_COOKIE_NAME = 'magicSlateTourFinished';
const API_KEY_ENCRYPTED_COOKIE_NAME = 'genkitUserApiKeyEncrypted';
const API_KEY_IV_COOKIE_NAME = 'genkitUserApiKeyIV';
const API_KEY_SALT_COOKIE_NAME = 'genkitUserApiKeySalt';

export default function HomePage() {
  const [showTour, setShowTour] = useState(false);
  const [showApiKeyDialog, setShowApiKeyDialog] = useState(false);
  const [userApiKey, setUserApiKey] = useState<string | null>(null);
  const [isApiKeyChecked, setIsApiKeyChecked] = useState(false);

  useEffect(() => {
    register();

    async function checkApiKey() {
      if (typeof window !== 'undefined') {
        const encryptedKey = getCookie(API_KEY_ENCRYPTED_COOKIE_NAME);
        const iv = getCookie(API_KEY_IV_COOKIE_NAME);
        const salt = getCookie(API_KEY_SALT_COOKIE_NAME);

        if (encryptedKey && iv && salt) {
          const decryptedKey = await decryptData(encryptedKey, iv, salt);
          if (decryptedKey) {
            setUserApiKey(decryptedKey);
          } else {
            // Decryption failed or key is invalid, prompt again
            setShowApiKeyDialog(true);
          }
        } else {
          // No API key found, prompt the user
          setShowApiKeyDialog(true);
        }
        setIsApiKeyChecked(true); // Mark API key check as complete
      }
    }
    checkApiKey();
  }, []);

  useEffect(() => {
    // Show tour only after API key check is complete and if API dialog is not shown
    if (isApiKeyChecked && !showApiKeyDialog) {
      const tourFinished = getCookie(TOUR_COOKIE_NAME);
      if (tourFinished !== 'true') {
        setShowTour(true);
      }
    }
  }, [isApiKeyChecked, showApiKeyDialog]);

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
        setUserApiKey(apiKey); // Set the raw API key for the current session
        setShowApiKeyDialog(false); // Close dialog
      } else {
        throw new Error("Encryption failed");
      }
    }
  };

  return (
    <div className="flex flex-col flex-grow h-full">
      <MagicCanvasSection userApiKey={userApiKey} />
      {isApiKeyChecked && ( // Render dialogs only after API key check
        <>
          <ApiKeyDialog
            isOpen={showApiKeyDialog}
            onClose={() => setShowApiKeyDialog(false)}
            onApiKeySubmit={handleApiKeySubmit}
          />
          {!showApiKeyDialog && ( // Show tour only if API key dialog is not active
            <AppTourDialog isOpen={showTour} onClose={handleFinishTour} />
          )}
        </>
      )}
    </div>
  );
}
