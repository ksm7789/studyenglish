// sw.js
const CACHE = "oe-v1";
const CORE = [
  "/studyenglish/",
  "/studyenglish/manifest.json"
  // 필요한 정적 자원 경로 추가 (예: "/studyenglish/styles.css", "/studyenglish/app.js")
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE)));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ));
  self.clients.claim();
});

// 오디오는 캐시 우회 → 크롬과 동일 미디어 정책
self.addEventListener("fetch", (e) => {
  const req = e.request;
  const url = new URL(req.url);

  // 오디오/Workers TTS/비-GET은 네트워크 직행
  if (
    req.method !== "GET" ||
    req.destination === "audio" ||
    url.pathname.startsWith("/tts") ||
    url.hostname.endsWith(".workers.dev")
  ) return;

  // 네비게이션은 network-first
  if (req.mode === "navigate") {
    e.respondWith((async () => {
      try {
        const fresh = await fetch(req);
        const cache = await caches.open(CACHE);
        cache.put(req, fresh.clone());
        return fresh;
      } catch {
        const cache = await caches.open(CACHE);
        return (await cache.match("/studyenglish/index.html")) || Response.error();
      }
    })());
    return;
  }

  // 정적 파일: stale-while-revalidate
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(req, { ignoreSearch: true });
    const fetching = fetch(req).then(res => {
      if (res.ok && res.type !== "opaque") cache.put(req, res.clone());
      return res;
    }).catch(() => cached);
    return cached || fetching;
  })());
});
