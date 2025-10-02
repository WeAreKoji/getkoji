// Service Worker for offline support (dev-safe)
const CACHE_NAME = 'koji-v2';
const RUNTIME_CACHE = 'koji-runtime-v2';

// Assets to cache on install
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
];

// Patterns to bypass caching (Vite dev assets, module deps, app source)
const BYPASS_CACHE_PATTERNS = [
  '/node_modules/.vite/',
  '/@vite/',
  '/src/',
  '.hot-update',
  '__vite',
  '.map',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== RUNTIME_CACHE)
          .map((name) => caches.delete(name))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  const url = event.request.url;

  // Always bypass Supabase and dev/Vite assets
  if (
    url.includes('supabase.co') ||
    BYPASS_CACHE_PATTERNS.some((p) => url.includes(p))
  ) {
    return; // default network behavior
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;

      return caches.open(RUNTIME_CACHE).then((cache) =>
        fetch(event.request).then((response) => {
          if (response.status === 200) {
            cache.put(event.request, response.clone());
          }
          return response;
        })
      );
    })
  );
});
