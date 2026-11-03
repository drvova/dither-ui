// The site offline: what its service worker (`sw.ts`, built to `dist/sw.js`
// by the `sw` environment of rstack.config.ts) keeps and how it answers each
// request, and the registration the app makes once it has loaded. The
// rules are pure so the tests can read them; the worker only wires them to
// its events.

/** The worker's caches: the pages (each route as last seen), the hashed
 * build assets (immutable once named), everything else of the site's own
 * (fonts, icons, the manifest, the kit's sources). A new `version` drops
 * every cache of an older one. */
export const OFFLINE = {
  version: 1,
  caches: { pages: "pages", static: "static", assets: "assets" },
  /** The routes kept for a first offline start, relative to the scope. */
  shell: ["", "docs/", "studio/"],
  /** The most entries a growing cache keeps, the oldest dropped first. */
  keep: 240,
} as const

export type CacheKind = keyof typeof OFFLINE.caches
export const cacheName = (kind: CacheKind) => `dither-ui-${OFFLINE.caches[kind]}-v${OFFLINE.version}`

/** How the worker answers a request: left to the network, a page (network
 * first, the copy kept for offline), a hashed asset (from the cache once
 * kept), or another asset of the site (the kept copy at once, refreshed
 * behind it). */
export type Strategy = "network" | "page" | "static" | "asset"

/** What of a request the rules read. */
export type Ask = { method: string; mode: string; range: boolean }

/** Paths under the scope the worker leaves to the network: the film and
 * the share cards (large, range-read media), their embeds, the player and
 * the worker itself. */
const PASS = /^(trailer|og|embed|oembed|play)\/|^sw\.js$/

export function strategyFor(url: URL, scope: URL, ask: Ask): Strategy {
  if (ask.method !== "GET" || ask.range) return "network"
  if (url.origin !== scope.origin || !url.pathname.startsWith(scope.pathname)) return "network"
  const path = url.pathname.slice(scope.pathname.length)
  if (PASS.test(path)) return "network"
  if (ask.mode === "navigate") return "page"
  if (path.startsWith("static/")) return "static"
  return "asset"
}

/** The shell route a page under the scope falls back to offline when it
 * was never kept itself: its own route's (a docs section opens the docs,
 * which route it by its path), else the start page. */
export function shellFor(url: URL, scope: URL): string {
  const path = url.pathname.slice(scope.pathname.length)
  return OFFLINE.shell.find((route) => route && path.startsWith(route.replace(/\/$/, ""))) ?? ""
}

/** The build assets a page's HTML loads (its scripts, styles, preloads and
 * icons), as absolute URLs under the scope: what the worker keeps with each
 * shell route, so the page opens offline. */
export function pageAssets(html: string, page: URL, scope: URL): string[] {
  const found = new Set<string>()
  for (const m of html.matchAll(/\s(?:src|href)="([^"]+)"/g)) {
    const url = new URL(m[1].replace(/&amp;/g, "&"), page)
    if (url.origin === scope.origin && url.pathname.startsWith(`${scope.pathname}static/`)) found.add(url.href)
  }
  return [...found]
}

/** Registers the worker once the page has loaded, where the browser has
 * service workers (a production build only: `rs dev` serves no worker). */
export function registerOffline(base: string): void {
  if (!import.meta.env.PROD || typeof navigator === "undefined" || !("serviceWorker" in navigator)) return
  const register = () => void navigator.serviceWorker.register(`${base}sw.js`, { scope: base }).catch(() => {})
  if (document.readyState === "complete") register()
  else addEventListener("load", register, { once: true })
}
