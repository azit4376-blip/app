const CACHE_NAME = "easy-shortcut-gpt-v1";
const APP_SHELL = [
  "./",
  "./index.html",
  "./coupang.html",
  "./ali.html",
  "./style.css",
  "./app.js",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
  "./coupang-icon.png",
  "./ali-icon.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    const jobs = APP_SHELL.map(async (url) => {
      try {
        const response = await fetch(new Request(url, { cache: "reload" }));
        if (response && response.ok) await cache.put(url, response);
      } catch (_) {
        // 일부 아이콘이 아직 없더라도 서비스워커 설치가 실패하지 않게 처리
      }
    });
    await Promise.allSettled(jobs);
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  const sameOrigin = url.origin === self.location.origin;

  // 외부 쇼핑/어필리에이트/파비콘 요청은 캐시하지 않고 브라우저 기본 처리
  if (!sameOrigin) return;

  // 페이지 이동은 네트워크 우선, 실패 시 캐시 fallback
  if (request.mode === "navigate") {
    event.respondWith((async () => {
      try {
        const response = await fetch(request);
        const cache = await caches.open(CACHE_NAME);
        cache.put(request, response.clone()).catch(() => null);
        return response;
      } catch (_) {
        return await caches.match(request) || await caches.match("./index.html");
      }
    })());
    return;
  }

  // 정적 리소스는 캐시 우선 + 백그라운드 갱신
  event.respondWith((async () => {
    const cached = await caches.match(request);
    const fetchPromise = fetch(request).then((response) => {
      if (response && response.ok) {
        caches.open(CACHE_NAME).then((cache) => cache.put(request, response.clone())).catch(() => null);
      }
      return response;
    }).catch(() => cached);

    return cached || fetchPromise;
  })());
});
