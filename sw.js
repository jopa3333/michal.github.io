/* ============================================================
   SERVICE WORKER — Trening 2026 PWA
   Cachuje wszystko lokalnie, działa w 100% offline po instalacji
   ============================================================ */

const CACHE_NAME = 'trening2026-v2';
const ASSETS = [
  './treningweb.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

// Instalacja: zcachuj wszystkie pliki
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Aktywacja: usuń stare cache
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch: zawsze serwuj z cache (offline-first)
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      // Jeśli nie ma w cache, spróbuj pobrać z sieci
      return fetch(event.request).catch(() => {
        // Fallback: zwróć główny plik HTML
        return caches.match('./treningweb.html');
      });
    })
  );
});
