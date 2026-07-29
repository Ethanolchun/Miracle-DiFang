const CACHE_NAME = 'miracle-difang-v4';
const ASSETS = [
  './',
  './index.html',
  './style.css?v=4',
  './script.js?v=4',
  './images/base.webp',
  './images/left-blue.webp',
  './images/left-silver.webp',
  './images/left-red-black.webp',
  './images/left-court.webp',
  './images/left-armor.webp',
  './images/right-silver-green.webp',
  './images/right-doctor.webp',
  './images/right-marshal-red.webp',
  './images/right-cross-collar.webp',
  './images/chain-knife.webp',
  './images/yulan-sword.webp',
  './images/left-hat-1.webp',
  './images/left-hat-2.webp',
  './images/right-hat.webp'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
      const copy = response.clone();
      caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
      return response;
    }))
  );
});
