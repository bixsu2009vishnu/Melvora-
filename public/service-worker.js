const CACHE_NAME = 'melvora-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/icon.svg',
  '/manifest.json'
];

// Install Event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching App Shell and Core Assets');
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[Service Worker] Removing old cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event
self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);

  // Skip non-GET requests, firestore queries, cloud functions, and hot reload sockets
  if (
    event.request.method !== 'GET' ||
    requestUrl.pathname.startsWith('/__') ||
    requestUrl.hostname.includes('firestore') ||
    requestUrl.hostname.includes('googleapis') ||
    requestUrl.pathname.includes('hot-update')
  ) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Return cached shell asset, but fetch update in background (Stale-While-Revalidate)
        fetch(event.request).then((networkResponse) => {
          if (networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, networkResponse);
            });
          }
        }).catch(() => {/* Ignore network update errors offline */});
        
        return cachedResponse;
      }

      // Fallback to network
      return fetch(event.request).then((networkResponse) => {
        // Cache new image assets or general static files dynamically
        if (
          networkResponse.status === 200 &&
          (requestUrl.pathname.endsWith('.png') ||
           requestUrl.pathname.endsWith('.jpg') ||
           requestUrl.pathname.endsWith('.jpeg') ||
           requestUrl.pathname.endsWith('.svg') ||
           requestUrl.pathname.endsWith('.css') ||
           requestUrl.pathname.endsWith('.js') ||
           requestUrl.pathname.includes('dicebear'))
        ) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch((err) => {
        // Return offline fallback if network fails
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
        throw err;
      });
    })
  );
});
