/* ============================================================
   SERVICE WORKER — Trening 2026 PWA (Wersja v20)
   Nawigacja: network-first (zawsze świeży index.html online,
   cache tylko offline) — stary index nie może wskazywać na
   nieistniejące pliki JS po nowym wdrożeniu.
   Pozostałe pliki: cache-first z aktualizacją w tle (offline).
   WAŻNE: serwowany plik to public/sw.js (Vite publicDir).
   Katalog główny repo ma kopię legacy — obie muszą być identyczne
   (pilnuje tego tests/unit/sw.test.js).
   ============================================================ */

const CACHE_NAME = 'trening2026-v21';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// Instalacja: zcachuj wszystkie kluczowe pliki
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS).catch(err => console.warn('Cachowanie:', err));
    })
  );
});

// Aktywacja: usuń stare wersje cache i przejmij natychmiast kontrolę
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  // Nawigacja (wejście na stronę): najpierw sieć, żeby index.html zawsze
  // pasował do plików na serwerze. Cache tylko jako fallback offline.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(networkResponse => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then(cache => cache.put('./index.html', clone));
          }
          return networkResponse;
        })
        .catch(() => caches.match('./index.html').then(cached => cached || caches.match('./')))
    );
    return;
  }

  // Pozostałe pliki: cache-first z aktualizacją w tle (stale-while-revalidate)
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      const fetchPromise = fetch(event.request)
        .then(networkResponse => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          }
          return networkResponse;
        })
        .catch(() => cachedResponse);

      if (cachedResponse) {
        return cachedResponse;
      }
      return fetchPromise;
    })
  );
});
