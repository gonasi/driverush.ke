/*
 * DriveRush's service worker: after a first visit, the pages and levels a
 * learner has opened keep working with no connection, and the board's big
 * files are not downloaded twice.
 *
 * Three rules:
 *  - The build's own files carry a hash in their name and never change, so
 *    they are served from the cache once fetched.
 *  - Pages and their data are always asked of the network first. The cache is
 *    only the fallback when there is no connection, so a deploy is seen on the
 *    very next visit.
 *  - Other files of ours (the board's cars and textures, pictures, sounds) are
 *    served from the cache and refreshed in the background.
 *
 * To throw every cache away after a bad release, bump VERSION.
 */
const VERSION = "v1";
const FILES = `dr-files-${VERSION}`;
const PAGES = `dr-pages-${VERSION}`;
const KEEP = [FILES, PAGES];

/** A file Vite built: `/assets/name-HASH.js`. Its content never changes. */
const HASHED = /^\/assets\/[^/]+-[A-Za-z0-9_-]{8,}\.(?:js|css|woff2?)$/;
const STATIC =
  /\.(?:glb|gltf|png|jpe?g|webp|avif|svg|ico|mp3|ogg|wav|woff2?|json|webmanifest)$/;

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      for (const name of await caches.keys()) {
        if (name.startsWith("dr-") && !KEEP.includes(name)) {
          await caches.delete(name);
        }
      }
      await self.clients.claim();
    })(),
  );
});

async function put(cacheName, request, response) {
  if (!response || response.status !== 200 || response.type !== "basic") return;
  const cache = await caches.open(cacheName);
  await cache.put(request, response.clone());
}

async function cacheFirst(request) {
  const hit = await caches.match(request);
  if (hit) return hit;
  const response = await fetch(request);
  await put(FILES, request, response);
  return response;
}

async function refreshBehind(request) {
  const hit = await caches.match(request);
  const fresh = fetch(request)
    .then(async (response) => {
      await put(FILES, request, response);
      return response;
    })
    .catch(() => null);
  if (hit) return hit;
  const response = await fresh;
  return response ?? Response.error();
}

async function networkFirst(request, isPage) {
  try {
    const response = await fetch(request);
    await put(PAGES, request, response);
    return response;
  } catch (error) {
    const hit =
      (await caches.match(request)) ??
      // the game's page is one page whatever level it opens on
      (await caches.match(request, { ignoreSearch: true }));
    if (hit) return hit;
    if (isPage) {
      const board = await caches.match("/model-town-board");
      if (board) return board;
    }
    throw error;
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  // Analytics and anything else not ours is left alone.
  if (url.origin !== self.location.origin) return;
  if (url.pathname === "/sw.js") return;

  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request, true));
    return;
  }
  if (HASHED.test(url.pathname)) {
    event.respondWith(cacheFirst(request));
    return;
  }
  // The data a page loads when it is moved to without a full load.
  if (url.pathname.endsWith(".data") || url.pathname === "/__manifest") {
    event.respondWith(networkFirst(request, false));
    return;
  }
  if (STATIC.test(url.pathname)) {
    event.respondWith(refreshBehind(request));
  }
});
