// The site's service worker, built on its own to `dist/sw.js` (the `sw`
// environment of rstack.config.ts): it keeps the shell routes and their
// assets at install, answers each request by its strategy (`offline.ts`),
// and drops an older version's caches as it takes over.
import { type CacheKind, cacheName, OFFLINE, pageAssets, shellFor, strategyFor } from "./offline"

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
const scope = new URL(worker.registration.scope)

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
      for (const route of OFFLINE.shell) {
        const url = new URL(route, scope)
        const response = await fetch(url, { cache: "reload" }).catch(() => null)
        if (!response?.ok) continue
        await keep("pages", url.href, response.clone())
        const assets = pageAssets(await response.text(), url, scope)
        await Promise.all(
          assets.map((a) =>
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
  const strategy = strategyFor(new URL(request.url), scope, {
    method: request.method,
    mode: request.mode,
    range: request.headers.has("range"),
  })
  if (strategy === "network") return
  if (strategy === "page")
    // The network first, so a deploy shows at once; offline, the page as
    // last seen, else its route's shell.
    return event.respondWith(
      fetch(request)
        .then((response) => {
          event.waitUntil(keep("pages", request, response.clone()))
          return response
        })
        .catch(
          async () =>
            (await caches.match(request, { ignoreSearch: true })) ??
            (await caches.match(new URL(shellFor(new URL(request.url), scope), scope).href)) ??
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
