
const CACHE_NAME = 'magic-slate-cache-v1';
const urlsToCache = [
  '/',
  // These paths are from your manifest.ts, ensure they exist in /public
  '/android-chrome-192x192.png',
  '/android-chrome-512x512.png',
  '/apple-touch-icon.png',
  '/favicon-16x16.png',
  '/favicon-32x32.png',
  // It's good practice to cache the generated manifest if its path is known,
  // but Next.js handles its serving dynamically. This is often /manifest.webmanifest
  '/manifest.webmanifest' 
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache and caching initial assets');
        return cache.addAll(urlsToCache).catch(err => {
          console.error('Failed to cache some initial assets:', err);
          // Don't let a missing asset (e.g. a specific icon) prevent SW install
        });
      })
  );
});

self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    return;
  }

  // Network first, then cache strategy
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Check if we received a valid response
        if (!response || response.status !== 200 || response.type !== 'basic') {
          // If fetch fails (e.g. offline), try to get from cache
          return caches.match(event.request).then(cachedResponse => {
            return cachedResponse || response; // Return cached or original failing response
          });
        }

        const responseToCache = response.clone();
        caches.open(CACHE_NAME)
          .then((cache) => {
            cache.put(event.request, responseToCache);
          });
        return response;
      })
      .catch(() => {
        // Network request failed, try to get it from the cache
        return caches.match(event.request);
      })
  );
});
