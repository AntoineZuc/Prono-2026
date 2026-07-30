// Service worker — réseau d'abord, cache en secours hors-ligne.
// v8 : fix "Response body is already used"

const CACHE_NAME = 'pronos-v8';
const APP_SHELL = [
  './',
  './index.html',
  './cdm.html',
  './ldc.html',
  './missf.html',
  './special.html',
  './jeux.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL).catch(()=>{}))
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

  // Ne pas intercepter les appels API/externes
  if (
    url.includes('firebaseio.com') ||
    url.includes('flagcdn.com') ||
    url.includes('youtube.com') ||
    url.includes('football-data.org') ||
    url.includes('workers.dev') ||
    url.includes('anthropic.com') ||
    event.request.method !== 'GET'
  ) return;

  event.respondWith(
    fetch(event.request).then(response => {
      // Cloner AVANT de retourner pour éviter "body already used"
      if (response && response.ok && response.status === 200) {
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
      }
      return response;
    }).catch(() => {
      // Fallback cache si réseau indispo
      return caches.match(event.request);
    })
  );
});
