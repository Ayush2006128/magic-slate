
'use client';

import { useEffect } from 'react';
import { MagicCanvasSection } from '@/components/MagicCanvasSection';
import { register } from '@/app/service_worker'; // Using alias for robustness

export default function HomePage() {
  useEffect(() => {
    register(); // Register the service worker
  }, []);

  return (
    <div className="flex flex-col flex-grow h-full">
      <MagicCanvasSection />
    </div>
  );
}
