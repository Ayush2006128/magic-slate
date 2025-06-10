
'use client';

import { useEffect, useState } from 'react';
import { MagicCanvasSection } from '@/components/MagicCanvasSection';
import { AppTourDialog } from '@/components/AppTourDialog';
import { getCookie, setCookie } from '@/lib/cookieUtils';
import { register } from '@/app/service_worker'; // Using alias for robustness

const TOUR_COOKIE_NAME = 'magicSlateTourFinished';

export default function HomePage() {
  const [showTour, setShowTour] = useState(false);

  useEffect(() => {
    register(); // Register the service worker

    // Ensure this runs only on the client where document is available
    if (typeof window !== 'undefined') {
      const tourFinished = getCookie(TOUR_COOKIE_NAME);
      if (tourFinished !== 'true') {
        setShowTour(true);
      }
    }
  }, []);

  const handleFinishTour = () => {
    if (typeof window !== 'undefined') {
      setCookie(TOUR_COOKIE_NAME, 'true', 365); // Store cookie for 1 year
    }
    setShowTour(false);
  };

  return (
    <div className="flex flex-col flex-grow h-full">
      <MagicCanvasSection />
      <AppTourDialog isOpen={showTour} onClose={handleFinishTour} />
    </div>
  );
}
