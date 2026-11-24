/* ============================================================
   SERVICE WORKER — Trening 2026 PWA (Wersja v33)
   Nawigacja: cache-first z odświeżaniem w tle. Android często
   porzuca proces karty PWA w tle, a powrót wymusza pełne
   przeładowanie — serwowanie index.html z cache zamiast z sieci
   skraca czarny ekran / oczekiwanie 3–5 s do ułamka sekundy.
   Bezpieczeństwo deployu: najpierw zapinamy w cache wszystkie
   pliki /assets/ wersji z nowego index.html, dopiero potem sam
   index — więc serwowany index nigdy nie wskazuje na brakujące
   pliki JS (stare pliki z haszami zostają w cache).
   Pozostałe pliki: cache-first z aktualizacją w tle (offline).
   WAŻNE: serwowany plik to public/sw.js (Vite publicDir).
   Katalog główny repo ma kopię legacy — obie muszą być identyczne
   (pilnuje tego tests/unit/sw.test.js).
   ============================================================ */

const CACHE_NAME = 'trening2026-v33';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

function indexUrl() {
  return new URL('./index.html', self.registration.scope).href;
}

// Wyciąga pliki /assets/*.js|css z treści index.html
function assetUrlsFrom(text) {
  const urls = [];
  const re = /(?:src|href)="([^"']*\/assets\/[^"']+\.(?:js|css))["']/g;
  let match;
  while ((match = re.exec(text)) !== null) urls.push(match[1]);
  return urls;
}

// Pobiera świeży index.html, cache'uje go oraz wszystkie zasoby,
// do których prowadzi — dopiero potem staje się widoczny w cache.
async function precacheIndexAndAssets(url) {
  const cache = await caches.open(CACHE_NAME);
  const response = await fetch(url, { cache: 'no-cache' });
  if (!response || response.status !== 200) return;
  const text = await response.clone().text();
  await cache.put(indexUrl(), response);
  await Promise.all(
    assetUrlsFrom(text).map(rel =>
      cache.add(new URL(rel, url).href).catch(() => {})
    )
  );
}

// Instalacja: zcachuj wszystkie kluczowe pliki
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS).catch(err => console.warn('Cachowanie:', err));
    })
  );
});

// Aktywacja: usuń stare wersje cache, przejmij natychmiast kontrolę
// i dociągnij zasoby aktualnego index.html (offline działa od razu).
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
    .then(() => precacheIndexAndAssets(indexUrl()).catch(() => {}))
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  // Zapytania do innych domen (Google — logowanie, Drive API) omijają
  // cache: SW nie może podstawić starej odpowiedzi zamiast live danych.
  if (new URL(event.request.url).origin !== self.location.origin) return;

  // Nawigacja (wejście na stronę): od razu z cache, sieć tylko
  // odświeża cache w tle (po wpinaniu nowych zasobów do cache).
  if (event.request.mode === 'navigate') {
    const url = indexUrl();
    event.waitUntil(precacheIndexAndAssets(url).catch(() => {}));
    event.respondWith(
      caches.match(url).then(cached =>
        cached || fetch(event.request).then(networkResponse =>
          networkResponse && networkResponse.status === 200
            ? precacheIndexAndAssets(url).then(() => networkResponse)
            : networkResponse
        ).catch(() => caches.match('./'))
      )
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
