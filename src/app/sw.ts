// The Studio's service worker, built on its own to `dist/sw.js` (the `sw`
// environment of rstack.config.ts) and registered with the app's scope: it
// keeps the app's page and its assets at install, answers each request the
// app makes by its strategy (`offline.ts`), and drops an older version's
// caches as it takes over.
import { buildKeep, type CacheKind, cacheName, OFFLINE, pageAssets, strategyFor } from "./offline"

// The worker's own globals, typed here: the DOM lib the app compiles
// against has no ServiceWorkerGlobalScope, and the two libs cannot meet.
type Waits = { waitUntil(p: Promise<unknown>): void }
type Fetching = Waits & { request: Request; respondWith(r: Promise<Response>): void }
type Worker = {
  registration: { scope: string }
  skipWaiting(): Promise<void>
  clients: { claim(): Promise<void> }
  addEventListener(type: "install" | "activate", fn: (e: Waits) => void): void
  addEventListener(type: "fetch", fn: (e: Fetching) => void): void
}
const worker = self as unknown as Worker
// The app's scope, and the site's root its assets live under.
const scope = new URL(worker.registration.scope)
const site = new URL(OFFLINE.app.replace(/[^/]+/g, ".."), scope)

/** Keeps a response, dropping the oldest entries past the cache's keep. */
async function keep(kind: CacheKind, request: Request | string, response: Response) {
  if (!response.ok || response.type === "opaque") return
  const cache = await caches.open(cacheName(kind))
  await cache.put(request, response)
  const keys = await cache.keys()
  for (const old of keys.slice(0, Math.max(0, keys.length - OFFLINE.keep))) await cache.delete(old)
}

worker.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const response = await fetch(scope, { cache: "reload" }).catch(() => null)
      if (response?.ok) {
        await keep("pages", scope.href, response.clone())
        // What the page names, and what the build says the app loads after it.
        const assets = new Set([
          ...pageAssets(await response.text(), scope, site),
          ...buildKeep().map((path) => new URL(path, site).href),
        ])
        await Promise.all(
          [...assets].map((a) =>
            fetch(a)
              .then((r) => keep("static", a, r))
              .catch(() => {}),
          ),
        )
      }
      await worker.skipWaiting()
    })(),
  )
})

worker.addEventListener("activate", (event) => {
  const current = new Set(Object.keys(OFFLINE.caches).map((k) => cacheName(k as CacheKind)))
  event.waitUntil(
    (async () => {
      for (const name of await caches.keys())
        if (name.startsWith("dither-ui-") && !current.has(name)) await caches.delete(name)
      await worker.clients.claim()
    })(),
  )
})

worker.addEventListener("fetch", (event) => {
  const request = event.request
  const strategy = strategyFor(new URL(request.url), site, {
    method: request.method,
    mode: request.mode,
    range: request.headers.has("range"),
  })
  if (strategy === "network") return
  if (strategy === "page")
    // The network first, so a deploy shows at once; offline, the page as
    // last seen, else the app's page (it routes itself by its hash).
    return event.respondWith(
      fetch(request)
        .then((response) => {
          event.waitUntil(keep("pages", request, response.clone()))
          return response
        })
        .catch(
          async () =>
            (await caches.match(request, { ignoreSearch: true })) ??
            (await caches.match(scope.href)) ??
            Response.error(),
        ),
    )
  if (strategy === "static")
    // Named by their content: a kept copy is the file.
    return event.respondWith(
      caches.match(request).then(
        (kept) =>
          kept ??
          fetch(request).then((response) => {
            event.waitUntil(keep("static", request, response.clone()))
            return response
          }),
      ),
    )
  // The kept copy at once, the network refreshing it behind.
  const fresh = fetch(request).then((response) => {
    event.waitUntil(keep("assets", request, response.clone()))
    return response
  })
  event.respondWith(caches.match(request).then((kept) => kept ?? fresh))
  event.waitUntil(fresh.catch(() => {}))
})
