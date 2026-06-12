// Service worker minimal — cache l'app shell pour un démarrage rapide
// et un fonctionnement basique hors-ligne. Ne touche jamais à Firebase
// (les requêtes vers firebaseio.com ne sont jamais mises en cache).

const CACHE_NAME = 'pronos-cdm-2026-v1';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const url = event.request.url;

  // Ne jamais intercepter Firebase ou les flagcdn (toujours réseau)
  if (url.includes('firebaseio.com') || url.includes('flagcdn.com') || url.includes('youtube.com')) {
    return;
  }

  // Pour l'app shell: cache d'abord, puis réseau (mise à jour en arrière-plan)
  event.respondWith(
    caches.match(event.request).then(cached => {
      const networkFetch = fetch(event.request).then(response => {
        if (response.ok) {
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, response.clone()));
        }
        return response;
      }).catch(() => cached);
      return cached || networkFetch;
    })
  );
});
