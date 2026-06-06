const CACHE_NAME = "shopping-home-stable20260606e";
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
      .then((cache) => Promise.allSettled(ASSETS.map((asset) => cache.add(asset))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  const isExternal = url.origin !== self.location.origin;

  // 외부 쇼핑몰/광고 링크는 서비스워커가 관여하지 않습니다.
  if (isExternal) return;

  const isHtml = req.mode === "navigate" || url.pathname.endsWith(".html") || url.pathname.endsWith("/");
  const isCode = /\.(css|js|json)$/i.test(url.pathname);

  // HTML/CSS/JS/manifest는 네트워크 우선: 배포 후 예전 코드가 오래 남는 문제를 줄입니다.
  if (isHtml || isCode) {
    event.respondWith(
      fetch(req)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy)).catch(() => null);
          return response;
        })
        .catch(() => caches.match(req).then((cached) => cached || caches.match("./index.html")))
    );
    return;
  }

  // 아이콘 등 정적 파일은 캐시 우선, 없으면 네트워크.
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(req, copy)).catch(() => null);
        return response;
      });
    })
  );
});
