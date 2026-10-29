/* ============================================================
   SERVICE WORKER — Trening 2026 PWA (Wersja v13)
   Cache-First (Stale-While-Revalidate) — Natychmiastowe otwieranie (0s czarnego ekranu)
   oraz 100% działanie offline bez kolizji z odtwarzaczami muzyki (Spotify)
   ============================================================ */

const CACHE_NAME = 'trening2026-v13';
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

// Pobieranie: Cache-First z aktualizacją w tle
// Gwarantuje 0 sekund czarnego ekranu przy powrocie do aplikacji!
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      // Zapytanie sieciowe w tle (dla aktualizacji cache)
      const fetchPromise = fetch(event.request)
        .then(networkResponse => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          }
          return networkResponse;
        })
        .catch(() => cachedResponse);

      // Jeśli mamy plik w cache — zwróć go natychmiast (0ms)!
      if (cachedResponse) {
        return cachedResponse;
      }

      // Jeśli nie ma w cache (pierwsze otwarcie) — czekaj na sieć
      return fetchPromise;
    })
  );
});
