// Service Worker with Stale-While-Revalidate strategy
const CACHE_VERSION = 'v4';
const CACHE_NAME = `koji-${CACHE_VERSION}`;
const RUNTIME_CACHE = `koji-runtime-${CACHE_VERSION}`;

// Assets to cache on install
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
];

// Patterns to bypass caching entirely (dev assets, Supabase, etc.)
const BYPASS_CACHE_PATTERNS = [
  '/node_modules/.vite/',
  '/@vite/',
  '/src/',
  '.hot-update',
  '__vite',
  '.map',
  'supabase.co',
  'supabase.in',
];

// Check if URL should bypass cache
const shouldBypassCache = (url) => {
  return BYPASS_CACHE_PATTERNS.some(pattern => url.includes(pattern));
};

// Install event - cache core assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((name) => {
            // Delete any cache that isn't the current version
            return name.startsWith('koji-') && 
                   name !== CACHE_NAME && 
                   name !== RUNTIME_CACHE;
          })
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      )
    ).then(() => {
      console.log('[SW] Activated, claiming clients');
      return self.clients.claim();
    })
  );
});

// Fetch event - Stale-While-Revalidate strategy
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  const url = event.request.url;

  // Skip caching for certain patterns
  if (shouldBypassCache(url)) {
    return; // Let browser handle normally
  }

  // For navigation requests (HTML pages), use network-first
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Clone and cache the fresh response
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
          return response;
        })
        .catch(() => {
          // Fallback to cache if offline
          return caches.match(event.request).then((cachedResponse) => {
            return cachedResponse || caches.match('/');
          });
        })
    );
    return;
  }

  // For other requests, use stale-while-revalidate
  event.respondWith(
    caches.open(RUNTIME_CACHE).then((cache) => {
      return cache.match(event.request).then((cachedResponse) => {
        // Start fetch in background regardless
        const fetchPromise = fetch(event.request)
          .then((networkResponse) => {
            // Only cache successful responses
            if (networkResponse && networkResponse.status === 200) {
              cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          })
          .catch((error) => {
            console.log('[SW] Fetch failed:', error);
            return cachedResponse; // Return cached if network fails
          });

        // Return cached response immediately, or wait for network
        return cachedResponse || fetchPromise;
      });
    })
  );
});

// Listen for messages from the main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[SW] Skip waiting requested');
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_VERSION });
  }
});

// Notify clients when there's a new version
self.addEventListener('controllerchange', () => {
  console.log('[SW] Controller changed - new version active');
});
