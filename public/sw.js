/* root — service worker: la app abre aunque la conexión sea mala o no haya.
 *
 * Qué hace:
 *  - /_next/static/*  (JS/CSS con hash)  → cache-first, nunca cambian.
 *  - Páginas (navegaciones)               → red primero con tope de espera; si tarda o falla, la última copia guardada
 *                                           (hasta PAGE_MAX_AGE_MS de antigüedad).
 *  - Imágenes, fuentes, íconos            → stale-while-revalidate.
 *  - API del backend, RSC, video, Range   → no se tocan (datos y sesión siempre frescos).
 *
 * La sesión vive en localStorage, así que el HTML es igual para todos los usuarios y es seguro guardarlo.
 * Para invalidar todo después de un cambio grande: subir CACHE_VERSION.
 */
const CACHE_VERSION = "v1";
const STATIC_CACHE = `root-static-${CACHE_VERSION}`;
const PAGES_CACHE = `root-pages-${CACHE_VERSION}`;
const ASSETS_CACHE = `root-assets-${CACHE_VERSION}`;
const KNOWN_CACHES = [STATIC_CACHE, PAGES_CACHE, ASSETS_CACHE];

const PAGE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const NETWORK_TIMEOUT_MS = 3500;
const MAX_STATIC_ENTRIES = 400;
const MAX_ASSET_ENTRIES = 200;
const MAX_PAGE_ENTRIES = 40;
const CACHED_AT = "x-sw-cached-at";

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(names.filter((n) => n.startsWith("root-") && !KNOWN_CACHES.includes(n)).map((n) => caches.delete(n)));
      await self.clients.claim();
    })(),
  );
});

async function trim(cacheName, max) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  for (let i = 0; i < keys.length - max; i++) await cache.delete(keys[i]);
}

/** Copia la respuesta marcándole cuándo se guardó (para poder vencerla). */
async function stamp(response) {
  const headers = new Headers(response.headers);
  headers.set(CACHED_AT, String(Date.now()));
  return new Response(await response.blob(), { status: response.status, statusText: response.statusText, headers });
}

function isFresh(response) {
  const at = Number(response.headers.get(CACHED_AT));
  return Number.isFinite(at) && at > 0 && Date.now() - at < PAGE_MAX_AGE_MS;
}

async function cacheFirst(request) {
  const cache = await caches.open(STATIC_CACHE);
  const hit = await cache.match(request);
  if (hit) return hit;
  const response = await fetch(request);
  if (response.ok) {
    await cache.put(request, response.clone());
    void trim(STATIC_CACHE, MAX_STATIC_ENTRIES);
  }
  return response;
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(ASSETS_CACHE);
  const hit = await cache.match(request);
  const refresh = fetch(request)
    .then(async (response) => {
      if (response.ok) {
        await cache.put(request, response.clone());
        void trim(ASSETS_CACHE, MAX_ASSET_ENTRIES);
      }
      return response;
    })
    .catch(() => undefined);
  if (hit) return hit;
  return (await refresh) || Response.error();
}

async function pageFromCache(request) {
  const cache = await caches.open(PAGES_CACHE);
  const url = new URL(request.url);
  const hit = (await cache.match(url.pathname)) || (url.pathname === "/" ? await cache.match("/events") : undefined);
  return hit && isFresh(hit) ? hit : undefined;
}

async function networkFirstPage(request) {
  const cache = await caches.open(PAGES_CACHE);
  const key = new URL(request.url).pathname;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), NETWORK_TIMEOUT_MS);
  try {
    const response = await fetch(request, { signal: controller.signal });
    clearTimeout(timer);
    // Las redirecciones no se guardan (el navegador rechaza servirlas como respuesta de una navegación).
    if (response.ok && response.type === "basic" && !response.redirected) {
      await cache.put(key, await stamp(response.clone()));
      void trim(PAGES_CACHE, MAX_PAGE_ENTRIES);
    }
    return response;
  } catch {
    clearTimeout(timer);
    const cached = await pageFromCache(request);
    if (cached) return cached;
    return Response.error(); // sin copia: la app nativa muestra su pantalla de "sin conexión"
  }
}

const ASSET_PATH = /^\/(brand|images)\/|^\/_next\/image|\.(?:png|jpe?g|webp|avif|gif|svg|ico|woff2?)$/i;

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET" || request.headers.has("range")) return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || url.pathname === "/sw.js") return;
  // Navegación cliente de Next (RSC): siempre a la red.
  if (url.searchParams.has("_rsc") || request.headers.has("rsc")) return;

  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(cacheFirst(request));
  } else if (request.mode === "navigate") {
    event.respondWith(networkFirstPage(request));
  } else if (ASSET_PATH.test(url.pathname + url.search) && !url.pathname.endsWith(".mp4")) {
    event.respondWith(staleWhileRevalidate(request));
  }
});
