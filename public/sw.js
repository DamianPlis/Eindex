const CACHE_NAME = "eindx-offline-v1";
const OFFLINE_PAGES = {
  en: "/offline-en.html",
  cs: "/offline-cs.html",
};

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(Object.values(OFFLINE_PAGES))),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET" || request.mode !== "navigate") {
    return;
  }

  event.respondWith(handleNavigationRequest(request));
});

async function handleNavigationRequest(request) {
  try {
    return await fetch(request);
  } catch {
    const cache = await caches.open(CACHE_NAME);
    const fallback = await cache.match(getOfflinePagePath(request.url));

    if (fallback) {
      return fallback;
    }

    const defaultFallback = await cache.match(OFFLINE_PAGES.en);
    if (defaultFallback) {
      return defaultFallback;
    }

    return new Response("Offline", {
      status: 503,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  }
}

function getOfflinePagePath(requestUrl) {
  const { pathname } = new URL(requestUrl);
  const locale = pathname.split("/")[1];
  return locale === "cs" ? OFFLINE_PAGES.cs : OFFLINE_PAGES.en;
}
