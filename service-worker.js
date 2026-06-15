// Service worker — réseau d'abord, cache uniquement en secours hors-ligne.
// Pendant le développement actif, ça évite d'avoir à vider le cache à
// chaque déploiement: la dernière version est toujours récupérée si le
// réseau est disponible. Ne touche jamais à Firebase (jamais mis en cache).

const CACHE_NAME = 'pronos-cdm-2026-v4';
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

  // Réseau d'abord (toujours la dernière version si en ligne),
  // cache uniquement si le réseau échoue (hors-ligne).
  event.respondWith(
    fetch(event.request).then(response => {
      if (response.ok) {
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, response.clone()));
      }
      return response;
    }).catch(() => caches.match(event.request))
  );
});

