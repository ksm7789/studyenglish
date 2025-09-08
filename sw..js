// sw.v6.js - network-first for audio, cache-busting
const CACHE_NAME = 'studyenglish-v6-20250907';
self.addEventListener('install', (e)=>{ self.skipWaiting(); });
self.addEventListener('activate', (e)=>{ e.waitUntil(clients.claim()); });

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  const isAudio = url.pathname.match(/\.(mp3|m4a|wav|ogg)$/i);
  if (isAudio) {
    event.respondWith(
      fetch(event.request).catch(()=> caches.match(event.request))
    );
    return;
  }
  event.respondWith(
    caches.match(event.request).then(res => {
      return res || fetch(event.request).then(resp => {
        const copy = resp.clone();
        caches.open(CACHE_NAME).then(c => c.put(event.request, copy));
        return resp;
      });
    })
  );
});
