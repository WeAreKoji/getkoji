// Service Worker with Network-First strategy for code, Cache-First for static assets
const CACHE_VERSION = 'v5';
const CACHE_NAME = `koji-${CACHE_VERSION}`;

// Only cache static assets (images, fonts) - NOT code
const CACHEABLE_EXTENSIONS = [
  '.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.ico',
  '.woff', '.woff2', '.ttf', '.eot'
];

// Patterns to NEVER cache (always fetch fresh)
const NEVER_CACHE_PATTERNS = [
  '/node_modules/',
  '/@vite/',
  '/src/',
  '.hot-update',
  '__vite',
  '.map',
  'supabase.co',
  'supabase.in',
  '.js',
  '.css',
  '.html',
  '/index.html',
  'manifest.json'
];

// Check if URL should never be cached
const shouldNeverCache = (url) => {
  return NEVER_CACHE_PATTERNS.some(pattern => url.includes(pattern));
};

// Check if URL is a cacheable static asset
const isCacheableAsset = (url) => {
  return CACHEABLE_EXTENSIONS.some(ext => url.endsWith(ext));
};

// Install event - skip waiting immediately
self.addEventListener('install', (event) => {
  console.log('[SW] Installing new version:', CACHE_VERSION);
  // Force immediate activation
  self.skipWaiting();
});

// Activate event - clean up old caches and take control immediately
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating new version:', CACHE_VERSION);
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((name) => name.startsWith('koji-') && name !== CACHE_NAME)
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      )
    ).then(() => {
      console.log('[SW] Taking control of all clients');
      // Take control of all pages immediately
      return self.clients.claim();
    })
  );
});

// Fetch event - Network-first for code, Cache-first for static assets
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  const url = event.request.url;

  // Never cache these - let browser handle normally (always fresh)
  if (shouldNeverCache(url)) {
    return;
  }

  // For navigation requests (HTML pages), ALWAYS use network-first
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          // Only use cache if completely offline
          return caches.match('/index.html');
        })
    );
    return;
  }

  // For static assets (images, fonts), use cache-first
  if (isCacheableAsset(url)) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          return fetch(event.request).then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          });
        });
      })
    );
    return;
  }

  // For everything else, use network-first (fresh content)
  event.respondWith(
    fetch(event.request)
      .catch(() => {
        return caches.match(event.request);
      })
  );
});

// Listen for skip waiting message
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
