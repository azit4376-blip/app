const CACHE_NAME = "shopping-home-v4";
const ASSETS = [
  "./",
  "./index.html",
  "./ali.html",
  "./coupang.html",
  "./style.css",
  "./app.js",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
  "./ali-icon.png",
  "./coupang-icon.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  // 외부 리소스(Google favicons 등)는 네트워크 우선, 실패 시 캐시
  const isExternal = !req.url.startsWith(self.location.origin);

  if (isExternal) {
    event.respondWith(
      fetch(req)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy)).catch(() => null);
          return response;
        })
        .catch(() => caches.match(req))
    );
    return;
  }

  // 내부 리소스: 캐시 우선
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(req, copy)).catch(() => null);
        return response;
      }).catch(() => caches.match("./index.html"));
    })
  );
});
