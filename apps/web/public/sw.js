/*
 * Fathom service worker — hand-rolled, no build step.
 *
 * Strategy:
 *  - Navigations: network-first, falling back to the cached app shell so
 *    previously visited installs keep working offline.
 *  - Hashed build assets (/assets/) and site media (/media/, /icons/):
 *    cache-first — their URLs change when their content does.
 *  - Everything else (map tiles, fonts, APIs on other origins): untouched.
 */
const CACHE = 'fathom-v1';
const SHELL = '/';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.add(SHELL))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(SHELL, copy));
          return response;
        })
        .catch(() => caches.match(SHELL)),
    );
    return;
  }

  const cacheFirst = ['/assets/', '/media/', '/icons/', '/api/'].some((prefix) =>
    url.pathname.startsWith(prefix),
  );
  if (cacheFirst) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ??
          fetch(request).then((response) => {
            if (response.ok) {
              const copy = response.clone();
              caches.open(CACHE).then((cache) => cache.put(request, copy));
            }
            return response;
          }),
      ),
    );
  }
});
